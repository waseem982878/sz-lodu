
import { db } from '@/firebase/config';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp, query, where, onSnapshot, runTransaction, increment, getDocs, limit, writeBatch, Transaction as FirestoreTransaction } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/models/user.model';
import type { Battle, GameType, ResultSubmission } from '@/models/battle.model';
import { Transaction, TransactionType } from '@/models/transaction.model';

// Create a new battle
export const createBattle = async (amount: number, gameType: GameType, user: User, userProfile: UserProfile): Promise<string> => {
    if (!db) {
        throw new Error("Database not available. Cannot create battle.");
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

        if (['cancelled', 'completed', 'disputed'].includes(status)) {
            throw new Error("Battle cannot be cancelled as it's already concluded.");
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
            const cancellerName = cancellerIsCreator ? creator.name : opponent.name;
            const otherPlayerName = cancellerIsCreator ? opponent.name : creator.name;

            // Refund canceller minus penalty
            transaction.update(cancellerRef, {
                winningsBalance: increment(amount - CANCELLATION_FEE),
                penaltyTotal: increment(CANCELLATION_FEE)
            });
            // Refund other player plus penalty
            transaction.update(otherPlayerRef, {
                winningsBalance: increment(amount + CANCELLATION_FEE)
            });

            // Create transactions
            _createTransaction(transaction, {
                userId: userId,
                type: 'cancellation_penalty',
                amount: CANCELLATION_FEE,
                description: `Penalty for cancelling match vs ${otherPlayerName}`,
                battleId: battleId
            });
            _createTransaction(transaction, {
                userId: userId,
                type: 'refund',
                amount: amount - CANCELLATION_FEE,
                description: `Refund for cancelled match vs ${otherPlayerName}`,
                battleId: battleId
            });
            _createTransaction(transaction, {
                userId: otherPlayerId,
                type: 'cancellation_bonus',
                amount: CANCELLATION_FEE,
                description: `Bonus from ${cancellerName} cancelling the match`,
                battleId: battleId
            });
             _createTransaction(transaction, {
                userId: otherPlayerId,
                type: 'refund',
                amount: amount,
                description: `Refund for cancelled match vs ${cancellerName}`,
                battleId: battleId
            });

        } else if (!isPractice) { // No opponent yet
            if (userId !== creator.id) throw new Error("Only the creator can cancel an open battle.");
            const creatorRef = doc(db, 'users', creator.id);
            transaction.update(creatorRef, { winningsBalance: increment(amount) });
             _createTransaction(transaction, {
                userId: creator.id,
                type: 'refund',
                amount: amount,
                description: `Refund for cancelled open battle`,
                battleId: battleId
            });
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

// New uploadResult function with automated completion logic
export const uploadResult = async (battleId: string, userId: string, status: 'won' | 'lost', screenshotUrl?: string) => {
    if (!db) throw new Error("Database not available.");
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found");

        const battleData = battleDoc.data() as Battle;
        if (battleData.status !== 'inprogress' && battleData.status !== 'result_pending') {
            throw new Error("Can only submit result for an active game.");
        }
        if (battleData.result?.[userId]) {
            throw new Error("You have already submitted your result.");
        }

        // 1. Update the user's result submission
        const resultSubmission: ResultSubmission = {
            status,
            screenshotUrl: status === 'won' ? screenshotUrl : undefined,
            submittedAt: serverTimestamp()
        };
        
        const updatedResult = { ...battleData.result, [userId]: resultSubmission };

        transaction.update(battleRef, {
            result: updatedResult,
            status: 'result_pending',
            updatedAt: serverTimestamp()
        });
        
        // 2. Check the opponent's result to decide the next step
        const opponentId = battleData.creator.id === userId ? battleData.opponent?.id : battleData.creator.id;
        const userResult = status;
        const opponentResult = opponentId ? updatedResult?.[opponentId]?.status : undefined;

        if (!opponentId || !opponentResult) {
            // Waiting for the other player, do nothing more
            return;
        }

        // Both players have submitted results, let's resolve the battle
        const creatorResult = battleData.creator.id === userId ? userResult : opponentResult;
        const opponentResultFinal = battleData.opponent?.id === userId ? userResult : opponentResult;
        
        if (creatorResult === 'won' && opponentResultFinal === 'lost') {
            await _completeBattle(transaction, battleId, battleData.creator.id, battleData);
        } else if (creatorResult === 'lost' && opponentResultFinal === 'won') {
            await _completeBattle(transaction, battleId, battleData.opponent!.id, battleData);
        } else if (creatorResult === 'won' && opponentResultFinal === 'won') {
            // Both claim victory, mark as disputed for admin review
            transaction.update(battleRef, { status: 'disputed', updatedAt: serverTimestamp() });
        } else if (creatorResult === 'lost' && opponentResultFinal === 'lost') {
            // Both claim loss, cancel the game and refund
             const isPractice = battleData.amount === 0;
             if(!isPractice) {
                const creatorRef = doc(db, 'users', battleData.creator.id);
                const opponentRef = doc(db, 'users', battleData.opponent!.id);
                transaction.update(creatorRef, { winningsBalance: increment(battleData.amount) });
                transaction.update(opponentRef, { winningsBalance: increment(battleData.amount) });
                 _createTransaction(transaction, { userId: battleData.creator.id, type: 'refund', amount: battleData.amount, description: "Mutual loss reported. Battle cancelled.", battleId });
                 _createTransaction(transaction, { userId: battleData.opponent!.id, type: 'refund', amount: battleData.amount, description: "Mutual loss reported. Battle cancelled.", battleId });
             }
            transaction.update(battleRef, { status: 'cancelled', updatedAt: serverTimestamp() });
        }
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

    // 3. Handle Prize Money & Create Transactions
    if (!isPractice) {
        const commissionRate = settingsSnap.exists() ? (settingsSnap.data().commissionRate || 10) / 100 : 0.10;
        const totalPot = battleData.amount * 2;
        const commission = totalPot * commissionRate;
        const prizeMoney = totalPot - commission;
        
        winnerUpdate.winningsBalance = increment(prizeMoney);

        if (prizeMoney > (winnerProfile.biggestWin || 0)) {
            winnerUpdate.biggestWin = prizeMoney;
        }

        // Create transactions for both players
        _createTransaction(transaction, {
            userId: winnerId,
            type: 'game_win',
            amount: prizeMoney,
            description: `Won battle vs ${loserProfile.name}`,
            battleId,
            opponent: { id: loserId, name: loserProfile.name }
        });

        _createTransaction(transaction, {
            userId: loserId,
            type: 'game_loss',
            amount: battleData.amount, // The amount they lost
            description: `Lost battle vs ${winnerProfile.name}`,
            battleId,
            opponent: { id: winnerId, name: winnerProfile.name }
        });
    }

    transaction.update(winnerRef, winnerUpdate);
    transaction.update(loserRef, loserUpdate);

    // 4. Handle Referral Bonus
    if (!isPractice) {
        if (winnerProfile.gamesPlayed === 0) {
            await _awardReferralBonus(transaction, winnerId);
        }
        if (loserProfile.gamesPlayed === 0) {
            await _awardReferralBonus(transaction, loserId);
        }
    }
}

function _createTransaction(transaction: FirestoreTransaction, data: Omit<Transaction, 'id' | 'createdAt'>) {
    const txRef = doc(collection(db, 'transactions'));
    const transactionData: Omit<Transaction, 'id'> = {
        ...data,
        createdAt: serverTimestamp(),
    }
    transaction.set(txRef, transactionData);
}

async function _awardReferralBonus(transaction: FirestoreTransaction, referredUserId: string) {
    // This needs to be adapted to be transaction-safe if possible
    // For now, we are reading outside and writing inside transaction, which is acceptable
    const referralQuery = query(collection(db, 'referrals'), where('referredId', '==', referredUserId), where('status', '==', 'pending'), limit(1));
    const settingsRef = doc(db, 'config', 'appSettings');
    
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

        _createTransaction(transaction, {
            userId: referrerId,
            type: 'referral_bonus',
            amount: referralBonus,
            description: `Bonus for referring user ${referredUserId}`
        });
    }
}
