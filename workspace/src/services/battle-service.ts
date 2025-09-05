
import { db, auth } from '@/firebase/config';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp, query, where, onSnapshot, runTransaction, writeBatch, increment, getDocs, limit, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/models/user.model';
import type { Battle, GameType } from '@/models/battle.model';

// Create a new battle
export const createBattle = async (amount: number, gameType: GameType, user: User, userProfile: UserProfile): Promise<string> => {
    const userRef = doc(db, 'users', user.uid);
    
    const battleId = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User does not exist!");
        }

        const currentUserProfile = userDoc.data() as UserProfile;
        if ((currentUserProfile.depositBalance + currentUserProfile.winningsBalance) < amount) {
            throw new Error("Insufficient balance.");
        }

        // Prioritize deducting from deposit balance first, then winnings
        const depositDeduction = Math.min(currentUserProfile.depositBalance, amount);
        const winningsDeduction = amount - depositDeduction;

        const newDepositBalance = currentUserProfile.depositBalance - depositDeduction;
        const newWinningsBalance = currentUserProfile.winningsBalance - winningsDeduction;
        
        transaction.update(userRef, {
            depositBalance: newDepositBalance,
            winningsBalance: newWinningsBalance
        });

        const battleRef = doc(collection(db, "battles"));
        const newBattleData: Partial<Battle> = {
            amount,
            gameType: gameType,
            status: 'open',
            creator: {
                id: user.uid,
                name: userProfile.name,
                avatarUrl: userProfile.avatarUrl,
            },
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
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
     const battleRef = doc(db, 'battles', battleId);
     const userRef = doc(db, 'users', user.uid);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists() || battleDoc.data().status !== 'open') {
            throw new Error("Battle not available or already taken.");
        }
        
        const battleData = battleDoc.data() as Battle;
        if(battleData.creator.id === user.uid) {
            throw new Error("You cannot accept your own battle.");
        }

        const userAccount = await transaction.get(userRef);
        if (!userAccount.exists()) {
            throw new Error("User does not exist!");
        }
        const currentUserProfile = userAccount.data() as UserProfile;
        
        if ((currentUserProfile.depositBalance + currentUserProfile.winningsBalance) < battleData.amount) {
            throw new Error("Insufficient balance to accept this battle.");
        }

        // Deduct amount from opponent's wallet (deposit first, then winnings)
        const depositDeduction = Math.min(currentUserProfile.depositBalance, battleData.amount);
        const winningsDeduction = battleData.amount - depositDeduction;

        const newDepositBalance = currentUserProfile.depositBalance - depositDeduction;
        const newWinningsBalance = currentUserProfile.winningsBalance - winningsDeduction;
        
        transaction.update(userRef, { 
            depositBalance: newDepositBalance,
            winningsBalance: newWinningsBalance
        });
        
        // Update battle status and add opponent
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


// Get real-time updates for all battles of a specific game type
export const getBattles = (gameType: GameType, callback: (battles: Battle[]) => void, setLoading: (loading: boolean) => void) => {
    const battlesQuery = query(
        collection(db, 'battles'), 
        where('gameType', '==', gameType),
        where('status', 'in', ['open', 'inprogress', 'waiting_for_players_ready'])
    );
    
    setLoading(true);
    const unsubscribe = onSnapshot(battlesQuery, (querySnapshot) => {
        const battles: Battle[] = [];
        querySnapshot.forEach((doc) => {
            battles.push({ id: doc.id, ...doc.data() } as Battle);
        });
        callback(battles);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching battles: ", error);
        setLoading(false);
    });

    return unsubscribe;
};

// Get real-time updates for a single battle
export const getBattle = (battleId: string, callback: (battle: Battle | null) => void) => {
    const battleRef = doc(db, 'battles', battleId);
    
    const unsubscribe = onSnapshot(battleRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as Battle);
        } else {
            callback(null);
        }
    });

    return unsubscribe;
}

// Set room code by the creator
export const setRoomCode = async (battleId: string, roomCode: string) => {
    const battleRef = doc(db, 'battles', battleId);
    await updateDoc(battleRef, {
        roomCode,
        updatedAt: serverTimestamp(),
    });
};

// Cancel a battle
export const cancelBattle = async (battleId: string, userId: string, amount: number) => {
    const battleRef = doc(db, 'battles', battleId);
    const CANCELLATION_FEE = 5;

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists() || ['cancelled', 'completed'].includes(battleDoc.data().status)) {
            throw new Error("Battle cannot be cancelled.");
        }

        const battleData = battleDoc.data() as Battle;
        const creatorId = battleData.creator.id;
        const opponentId = battleData.opponent?.id;
        const cancellerRef = doc(db, 'users', userId);
        
        // If an opponent has joined, apply penalty logic
        if (opponentId) {
            const otherPlayerId = userId === creatorId ? opponentId : creatorId;
            const otherPlayerRef = doc(db, 'users', otherPlayerId);

            // Apply penalty to canceller
            transaction.update(cancellerRef, { 
                winningsBalance: increment(-CANCELLATION_FEE), // Penalty from winnings
                penaltyTotal: increment(CANCELLATION_FEE) 
            });

            // Compensate the other player
            transaction.update(otherPlayerRef, { 
                winningsBalance: increment(CANCELLATION_FEE) 
            });

            // Refund both players their original bet amount
            transaction.update(doc(db, 'users', creatorId), { winningsBalance: increment(amount) });
            transaction.update(doc(db, 'users', opponentId), { winningsBalance: increment(amount) });
        } else { // No opponent yet, creator is cancelling
            transaction.update(doc(db, 'users', creatorId), { winningsBalance: increment(amount) }); // Full refund for creator
        }

        transaction.update(battleRef, { status: 'cancelled', updatedAt: serverTimestamp() });
    });
};


const awardReferralBonus = async (transaction: any, referredUserId: string) => {
    // Check if this user was referred
    const referralQuery = query(collection(db, 'referrals'), where('referredId', '==', referredUserId), where('status', '==', 'pending'), limit(1));
    const referralSnap = await getDocs(referralQuery);

    if (!referralSnap.empty) {
        const referralDoc = referralSnap.docs[0];
        const referralData = referralDoc.data();
        const referrerId = referralData.referrerId;
        const REFERRAL_BONUS = 25;

        const referrerRef = doc(db, 'users', referrerId);
        const referralRef = doc(db, 'referrals', referralDoc.id);

        // 1. Award bonus to referrer's winnings balance
        transaction.update(referrerRef, {
            winningsBalance: increment(REFERRAL_BONUS)
        });

        // 2. Mark referral as completed so it's not awarded again
        transaction.update(referralRef, {
            status: 'completed'
        });
        
        console.log(`Referral bonus of ${REFERRAL_BONUS} queued for ${referrerId}`);
    }
}


// Upload result screenshot or loss confirmation
export const uploadResult = async (battleId: string, userId: string, status: 'won' | 'lost', screenshotUrl?: string) => {
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found");

        const battleData = battleDoc.data() as Battle;
        const opponentId = battleData.creator.id === userId ? battleData.opponent?.id : battleData.creator.id;
        
        const resultSubmission = {
            status,
            screenshotUrl: status === 'won' ? screenshotUrl : '',
            submittedAt: serverTimestamp()
        };
        
        // This is a simplified approach where the result is just recorded.
        // The admin will verify and set the final winner.
        transaction.update(battleRef, {
            [`result.${userId}`]: resultSubmission,
            status: 'result_pending', // Always move to result_pending for admin review
            updatedAt: serverTimestamp()
        });
    });
};


// Mark a player as ready for the battle
export const markPlayerAsReady = async (battleId: string, userId: string) => {
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found.");

        const battleData = battleDoc.data() as Battle;

        // Set the current player as ready
        transaction.update(battleRef, {
            [`readyPlayers.${userId}`]: true
        });

        // Check if the other player is already ready
        const opponentId = battleData.creator.id === userId ? battleData.opponent?.id : battleData.creator.id;
        if (opponentId && battleData.readyPlayers?.[opponentId]) {
            // Both players are ready, start the game
            transaction.update(battleRef, {
                status: 'inprogress',
                startedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    });
};



// This function is now the single source of truth for completing a battle.
// It is called by an admin from the admin panel.
export const updateBattleStatus = async (battleId: string, winnerId: string) => {
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found");

        const battleData = battleDoc.data() as Battle;
        if (battleData.status === 'completed') return; // Already completed, do nothing.

        const loserId = battleData.creator.id === winnerId ? battleData.opponent?.id : battleData.creator.id;
        if (!loserId) throw new Error("Opponent not found, cannot complete battle.");

        const winnerRef = doc(db, 'users', winnerId);
        const loserRef = doc(db, 'users', loserId);
        
        const [winnerDoc, loserDoc] = await Promise.all([
            transaction.get(winnerRef),
            transaction.get(loserRef)
        ]);

        if(!winnerDoc.exists()) throw new Error("Winner profile not found");
        if(!loserDoc.exists()) throw new Error("Loser profile not found");
        
        const winnerProfile = winnerDoc.data() as UserProfile;
        const loserProfile = loserDoc.data() as UserProfile;

        // Update battle document
        transaction.update(battleRef, {
            status: 'completed',
            winnerId,
            updatedAt: serverTimestamp(),
            completedAt: serverTimestamp()
        });

        const commissionRate = 0.05; // 5% commission
        const prizeMoney = (battleData.amount * 2) * (1 - commissionRate);

        // Update winner's stats and add prize to winnings balance
        transaction.update(winnerRef, {
            gamesPlayed: increment(1),
            gamesWon: increment(1),
            winningsBalance: increment(prizeMoney)
        });

        // Update loser's stats
        transaction.update(loserRef, {
            gamesPlayed: increment(1)
        });

        // Check for referral bonus on first game played for both players
        if (winnerProfile.gamesPlayed === 0) {
            await awardReferralBonus(transaction, winnerId);
        }
        if (loserProfile.gamesPlayed === 0) {
             await awardReferralBonus(transaction, loserId);
        }
    });
}

    