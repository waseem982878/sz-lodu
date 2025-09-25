

import { db } from '@/firebase/config';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp, query, where, onSnapshot, runTransaction, increment, getDocs, limit, writeBatch, Transaction as FirestoreTransaction } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/models/user.model';
import type { Battle, GameType, ResultSubmission } from '@/models/battle.model';
import { Transaction } from '@/models/transaction.model';

// Create a new battle
export const createBattle = async (amount: number, gameType: GameType, user: User, userProfile: UserProfile): Promise<string> => {
    if (!db) {
        throw new Error("Database not available. Cannot create battle.");
    }

    // Check for existing active battles
    const activeBattlesQuery = query(
        collection(db, 'battles'),
        where('creator.id', '==', user.uid),
        where('status', 'in', ['open', 'waiting_for_players_ready', 'inprogress', 'result_pending'])
    );

    const activeBattlesSnap = await getDocs(activeBattlesQuery);
    if (activeBattlesSnap.size >= 3) {
        throw new Error("You can only have a maximum of 3 active battles.");
    }

    const userRef = doc(db, 'users', user.uid);
    const isPractice = amount === 0;

    const battleId = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User does not exist!");
        }

        const currentUserProfile = userDoc.data() as UserProfile;

        if (!isPractice) {
            if ((currentUserProfile.depositBalance + currentUserProfile.winningsBalance) < amount) {
                throw new Error("Insufficient balance.");
            }

            const depositDeduction = Math.min(currentUserProfile.depositBalance, amount);
            const winningsDeduction = amount - depositDeduction;

            transaction.update(userRef, {
                depositBalance: increment(-depositDeduction),
                winningsBalance: increment(-winningsDeduction)
            });
        }

        const battleRef = doc(collection(db, "battles"));
        const newBattleData: Omit<Battle, 'id'> = {
            amount,
            gameType: gameType,
            status: 'open',
            creator: {
                id: user.uid,
                name: userProfile.name,
                avatarUrl: userProfile.avatarUrl,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            readyPlayers: {},
            result: {},
        };
        transaction.set(battleRef, newBattleData);

        return battleRef.id;
    });

    if (!battleId) {
        throw new Error("Failed to create battle ID.");
    }

    return battleId;
};

// Accept an open battle
export const acceptBattle = async (battleId: string, user: User, userProfile: UserProfile): Promise<void> => {
    if (!db) throw new Error("Database not available.");
    const battleRef = doc(db, 'battles', battleId);
    const userRef = doc(db, 'users', user.uid);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists() || battleDoc.data().status !== 'open') {
            throw new Error("Battle not available or already taken.");
        }

        const battleData = battleDoc.data() as Battle;
        const isPractice = battleData.amount === 0;

        if (battleData.creator.id === user.uid) {
            throw new Error("You cannot accept your own challenge.");
        }

        const userAccount = await transaction.get(userRef);
        if (!userAccount.exists()) {
            throw new Error("User does not exist!");
        }
        const currentUserProfile = userAccount.data() as UserProfile;

        if (!isPractice) {
            if ((currentUserProfile.depositBalance + currentUserProfile.winningsBalance) < battleData.amount) {
                throw new Error("Insufficient balance to accept this battle.");
            }
            const depositDeduction = Math.min(currentUserProfile.depositBalance, battleData.amount);
            const winningsDeduction = battleData.amount - depositDeduction;

            transaction.update(userRef, {
                depositBalance: increment(-depositDeduction),
                winningsBalance: increment(-winningsDeduction)
            });
        }

        transaction.update(battleRef, {
            status: 'waiting_for_players_ready',
            opponent: {
                id: user.uid,
                name: userProfile.name,
                avatarUrl: userProfile.avatarUrl,
            },
            updatedAt: serverTimestamp(),
        });
    });
};

// Get real-time updates for a single battle
export const getBattle = (battleId: string, callback: (battle: Battle | null) => void) => {
    if (!db) return () => {};
    const battleRef = doc(db, 'battles', battleId);
    return onSnapshot(battleRef, (doc) => {
        callback(doc.exists() ? { id: doc.id, ...doc.data() } as Battle : null);
    });
}

// Set room code by the creator
export const setRoomCode = async (battleId: string, roomCode: string) => {
    if (!db) throw new Error("Database not available.");
    if (!battleId || !roomCode) throw new Error("battleId and roomCode are required");
    const battleRef = doc(db, 'battles', battleId);
    await updateDoc(battleRef, { roomCode, updatedAt: serverTimestamp() });
};

// Cancel a battle
export const cancelBattle = async (battleId: string, userId: string) => {
    if (!db) throw new Error("Database not available.");
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found.");

        const battleData = battleDoc.data() as Battle;
        const { status, amount, creator, opponent } = battleData;

        if (['cancelled', 'completed'].includes(status)) {
            throw new Error("Battle cannot be cancelled as it's already concluded or cancelled.");
        }

        const isPractice = amount === 0;
        const opponentId = opponent?.id;

        // Refund logic
        if (!isPractice && opponentId) { // Opponent has joined, apply penalty
            const CANCELLATION_FEE = 5;
            const cancellerIsCreator = userId === creator.id;
            const otherPlayerId = cancellerIsCreator ? opponentId : creator.id;

            const cancellerRef = doc(db, 'users', userId);
            const otherPlayerRef = doc(db, 'users', otherPlayerId);
            
            // Refund canceller minus penalty
            transaction.update(cancellerRef, {
                winningsBalance: increment(amount - CANCELLATION_FEE),
                penaltyTotal: increment(CANCELLATION_FEE)
            });
            // Refund other player plus penalty
            transaction.update(otherPlayerRef, {
                winningsBalance: increment(amount + CANCELLATION_FEE)
            });
            
        } else if (!isPractice) { // No opponent yet
            if (userId !== creator.id) throw new Error("Only the creator can cancel an open battle.");
            const creatorRef = doc(db, 'users', creator.id);
            transaction.update(creatorRef, { winningsBalance: increment(amount) });
        }

        transaction.update(battleRef, {
            status: 'cancelled',
            updatedAt: serverTimestamp()
        });
    });
};

// Mark a player as ready for the battle
export const markPlayerAsReady = async (battleId: string, userId: string) => {
    if (!db) throw new Error("Database not available.");
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found.");

        const battleData = battleDoc.data() as Battle;
        const opponentId = battleData.creator.id === userId ? battleData.opponent?.id : battleData.creator.id;

        transaction.update(battleRef, {
            [`readyPlayers.${userId}`]: true,
            updatedAt: serverTimestamp()
        });
        
        // If the other player is also ready, start the game
        if (opponentId && battleData.readyPlayers?.[opponentId]) {
            transaction.update(battleRef, {
                status: 'inprogress',
                startedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    });
};

// New simplified uploadResult function
export const uploadResult = async (battleId: string, userId: string, status: 'won' | 'lost', screenshotUrl?: string) => {
    if (!db) throw new Error("Database not available.");
    const battleRef = doc(db, 'battles', battleId);

    const battleDoc = await getDoc(battleRef);
    if (!battleDoc.exists()) {
        throw new Error("Battle not found");
    }

    const battleData = battleDoc.data() as Battle;
    if (battleData.status !== 'inprogress' && battleData.status !== 'result_pending') {
        throw new Error("Can only submit result for an active game.");
    }
    if (battleData.result?.[userId]) {
        throw new Error("You have already submitted your result.");
    }

    const resultSubmission: ResultSubmission = {
        status,
        submittedAt: serverTimestamp()
    };
    if (status === 'won' && screenshotUrl) {
        resultSubmission.screenshotUrl = screenshotUrl;
    }
    
    await updateDoc(battleRef, {
        [`result.${userId}`]: resultSubmission,
        status: 'result_pending',
        updatedAt: serverTimestamp()
    });
};



// This function is for admins to manually set a winner
export const updateBattleStatus = async (battleId: string, winnerId: string) => {
    if (!db) throw new Error("Database not available.");
    const battleRef = doc(db, 'battles', battleId);
    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found");
        const battleData = battleDoc.data() as Battle;
        await _completeBattle(transaction, battleId, winnerId, battleData);
    });
}

// Internal function to handle the logic of completing a battle
// Can be called from a transaction in uploadResult or updateBattleStatus
async function _completeBattle(transaction: FirestoreTransaction, battleId: string, winnerId: string, battleData: Battle) {
    const battleRef = doc(db, 'battles', battleId);

    if (battleData.status === 'completed') return; // Already completed

    const loserId = battleData.creator.id === winnerId ? battleData.opponent?.id : battleData.creator.id;
    if (!loserId) throw new Error("Opponent not found, cannot complete battle.");

    const winnerRef = doc(db, 'users', winnerId);
    const loserRef = doc(db, 'users', loserId);

    const [winnerDoc, loserDoc, settingsSnap] = await Promise.all([
        transaction.get(winnerRef),
        transaction.get(loserRef),
        getDoc(doc(db, 'config', 'appSettings')) // Reading settings, can be outside transaction if needed
    ]);

    if (!winnerDoc.exists()) throw new Error("Winner profile not found");
    if (!loserDoc.exists()) throw new Error("Loser profile not found");

    const winnerProfile = winnerDoc.data() as UserProfile;
    const loserProfile = loserDoc.data() as UserProfile;
    const isPractice = battleData.amount === 0;

    // 1. Update Battle Document
    transaction.update(battleRef, {
        status: 'completed',
        winnerId,
        updatedAt: serverTimestamp(),
        completedAt: serverTimestamp()
    });

    // 2. Update User Profiles (stats)
    const winnerUpdate: any = {
        gamesPlayed: increment(1),
        gamesWon: increment(1),
        winStreak: increment(1),
        losingStreak: 0,
    };
    const loserUpdate: any = {
        gamesPlayed: increment(1),
        winStreak: 0,
        losingStreak: increment(1),
    };

    // 3. Handle Prize Money
    if (!isPractice) {
        const commissionRate = settingsSnap.exists() ? (settingsSnap.data().commissionRate || 10) / 100 : 0.10;
        const totalPot = battleData.amount * 2;
        const commission = totalPot * commissionRate;
        const prizeMoney = totalPot - commission;
        
        winnerUpdate.winningsBalance = increment(prizeMoney);

        if (prizeMoney > (winnerProfile.biggestWin || 0)) {
            winnerUpdate.biggestWin = prizeMoney;
        }
    }

    transaction.update(winnerRef, winnerUpdate);
    transaction.update(loserRef, loserUpdate);

    // 4. Handle Referral Bonus
    if (!isPractice) {
        // These are not awaited to prevent transaction issues. They will run in the background.
        _awardReferralBonus(transaction, winnerId, winnerProfile.gamesPlayed);
        _awardReferralBonus(transaction, loserId, loserProfile.gamesPlayed);
    }
}


async function _awardReferralBonus(transaction: FirestoreTransaction, referredUserId: string, gamesPlayed: number) {
    if (gamesPlayed !== 0) return; // Only award for the very first game

    const referralQuery = query(collection(db, 'referrals'), where('referredId', '==', referredUserId), where('status', '==', 'pending'), limit(1));
    const settingsRef = doc(db, 'config', 'appSettings');
    
    // We get docs outside of the main transaction path to avoid contention.
    const [referralSnap, settingsSnap] = await Promise.all([
        getDocs(referralQuery),
        getDoc(settingsRef)
    ]);

    if (!referralSnap.empty) {
        const referralDoc = referralSnap.docs[0];
        const referrerId = referralDoc.data().referrerId;
        const referralBonus = settingsSnap.exists() ? settingsSnap.data().referralBonus || 25 : 25;

        const referrerRef = doc(db, 'users', referrerId);
        const referralRef = referralDoc.ref;
        
        transaction.update(referrerRef, { winningsBalance: increment(referralBonus) });
        transaction.update(referralRef, { status: 'completed' });
    }
}
