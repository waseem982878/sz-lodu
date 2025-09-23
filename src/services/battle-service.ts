
import { db } from '@/firebase/config';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp, query, where, onSnapshot, runTransaction, increment, getDocs, limit } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/models/user.model';
import type { Battle, GameType, ResultSubmission } from '@/models/battle.model';


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

            const newDepositBalance = currentUserProfile.depositBalance - depositDeduction;
            const newWinningsBalance = currentUserProfile.winningsBalance - winningsDeduction;

            transaction.update(userRef, {
                depositBalance: newDepositBalance,
                winningsBalance: newWinningsBalance
            });
        }

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
    if (!db) {
        throw new Error("Database not available. Cannot accept battle.");
    }
    const battleRef = doc(db, 'battles', battleId);
    const userRef = doc(db, 'users', user.uid);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists() || battleDoc.data().status !== 'open') {
            throw new Error("Battle not available or already taken.");
        }

        const battleData = battleDoc.data() as Battle;
        const isPractice = battleData.amount === 0;

        if(battleData.creator.id === user.uid) {
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

            const newDepositBalance = currentUserProfile.depositBalance - depositDeduction;
            const newWinningsBalance = currentUserProfile.winningsBalance - winningsDeduction;

            transaction.update(userRef, { 
                depositBalance: newDepositBalance,
                winningsBalance: newWinningsBalance
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
    if (!db) {
        console.error("Database not available. Cannot get battle.");
        return () => {}; // Return an empty unsubscribe function
    }
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
    if (!db) {
        throw new Error("Database not available. Cannot set room code.");
    }
    if (!battleId || !roomCode) {
        throw new Error("battleId and roomCode are required");
    }
    const battleRef = doc(db, 'battles', battleId);
    await updateDoc(battleRef, {
        roomCode,
        updatedAt: serverTimestamp(),
    });
};

// Cancel a battle
export const cancelBattle = async (battleId: string, userId: string, amount: number) => {
    if (!db) {
        throw new Error("Database not available. Cannot cancel battle.");
    }
    const battleRef = doc(db, 'battles', battleId);
    const CANCELLATION_FEE = 5;
    const isPractice = amount === 0;

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found.");

        const battleData = battleDoc.data() as Battle;
        if (['cancelled', 'completed'].includes(battleData.status)) {
            throw new Error("Battle cannot be cancelled as it's already concluded.");
        }

        const creatorId = battleData.creator.id;
        const opponentId = battleData.opponent?.id;

        // If an opponent has joined, apply penalty logic
        if (opponentId && !isPractice) {
            const cancellerIsCreator = userId === creatorId;
            const otherPlayerId = cancellerIsCreator ? opponentId : creatorId;

            const cancellerRef = doc(db, 'users', userId);
            const otherPlayerRef = doc(db, 'users', otherPlayerId);
            
            // Deduct penalty from canceller and refund their bet
            transaction.update(cancellerRef, {
                winningsBalance: increment(amount - CANCELLATION_FEE), 
                penaltyTotal: increment(CANCELLATION_FEE)
            });

            // Refund the other player and give them the penalty fee
            transaction.update(otherPlayerRef, { 
                winningsBalance: increment(amount + CANCELLATION_FEE) 
            });

        } else { // No opponent yet or it's a practice match
             if (userId !== creatorId) {
                // This case should ideally not happen if UI is correct, but as a safeguard
                throw new Error("Only the creator can cancel an open battle.");
            }
            // Just refund the creator if it's not a practice match
            if (!isPractice) {
                const creatorRef = doc(db, 'users', creatorId);
                transaction.update(creatorRef, { winningsBalance: increment(amount) });
            }
        }

        transaction.update(battleRef, { 
            status: 'cancelled', 
            updatedAt: serverTimestamp() 
        });
    });
};


const awardReferralBonus = async (transaction: any, referredUserId: string) => {
    if (!db) return;
    const referralQuery = query(collection(db, 'referrals'), where('referredId', '==', referredUserId), where('status', '==', 'pending'), limit(1));
    const settingsRef = doc(db, 'config', 'appSettings');
    
    // These reads happen OUTSIDE the main transaction that calls this function.
    const [referralSnap, settingsSnap] = await Promise.all([
        getDocs(referralQuery),
        getDoc(settingsRef)
    ]);

    if (!referralSnap.empty) {
        const referralDoc = referralSnap.docs[0];
        const referralData = referralDoc.data();
        const referrerId = referralData.referrerId;
        const referralBonus = settingsSnap.exists() ? settingsSnap.data().referralBonus || 25 : 25;

        const referrerRef = doc(db, 'users', referrerId);
        const referralRef = doc(db, 'referrals', referralDoc.id);
        
        // These updates are safe to be 'awaited' inside the calling transaction
        // because they are passed the transaction object `t`.
        transaction.update(referrerRef, {
            winningsBalance: increment(referralBonus)
        });

        transaction.update(referralRef, {
            status: 'completed'
        });
    }
}


// Upload result screenshot or loss confirmation
export const uploadResult = async (battleId: string, userId: string, status: 'won' | 'lost', screenshotUrl?: string) => {
    if (!db) {
        throw new Error("Database not available. Cannot upload result.");
    }
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found");

        const battleData = battleDoc.data() as Battle;
        if(battleData.status !== 'inprogress' && battleData.status !== 'result_pending') throw new Error("Can only submit result for a game that is in progress or pending results.");

        const resultSubmission: ResultSubmission = {
            status,
            screenshotUrl: status === 'won' ? screenshotUrl : undefined,
            submittedAt: serverTimestamp()
        };

        const updateData = {
            [`result.${userId}`]: resultSubmission,
            status: 'result_pending', 
            updatedAt: serverTimestamp()
        };

        transaction.update(battleRef, updateData);
    });
};


// Mark a player as ready for the battle
export const markPlayerAsReady = async (battleId: string, userId: string) => {
    if (!db) {
        throw new Error("Database not available. Cannot mark player as ready.");
    }
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found.");

        const battleData = battleDoc.data() as Battle;

        transaction.update(battleRef, {
            [`readyPlayers.${userId}`]: true,
            updatedAt: serverTimestamp()
        });

        const opponentId = battleData.creator.id === userId ? battleData.opponent?.id : battleData.creator.id;
        if (opponentId && battleData.readyPlayers?.[opponentId]) {
            transaction.update(battleRef, {
                status: 'inprogress',
                startedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    });
};


export const updateBattleStatus = async (battleId: string, winnerId: string) => {
    if (!db) {
        throw new Error("Database not available. Cannot update battle status.");
    }
    const battleRef = doc(db, 'battles', battleId);

    await runTransaction(db, async (transaction) => {
        const battleDoc = await transaction.get(battleRef);
        if (!battleDoc.exists()) throw new Error("Battle not found");

        const battleData = battleDoc.data() as Battle;
        if (battleData.status === 'completed') return; 

        const loserId = battleData.creator.id === winnerId ? battleData.opponent?.id : battleData.creator.id;
        if (!loserId) throw new Error("Opponent not found, cannot complete battle.");

        const winnerRef = doc(db, 'users', winnerId);
        const loserRef = doc(db, 'users', loserId);

        const [winnerDoc, loserDoc, settingsSnap] = await Promise.all([
            transaction.get(winnerRef),
            transaction.get(loserRef),
            transaction.get(doc(db, 'config', 'appSettings'))
        ]);

        if(!winnerDoc.exists()) throw new Error("Winner profile not found");
        if(!loserDoc.exists()) throw new Error("Loser profile not found");

        const winnerProfile = winnerDoc.data() as UserProfile;
        const loserProfile = loserDoc.data() as UserProfile;
        const isPractice = battleData.amount === 0;

        transaction.update(battleRef, {
            status: 'completed',
            winnerId,
            updatedAt: serverTimestamp(),
            completedAt: serverTimestamp()
        });

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

        if (!isPractice) {
             const commissionRate = settingsSnap.exists() ? (settingsSnap.data().commissionRate || 5) / 100 : 0.05;
             const prizeMoney = (battleData.amount * 2) * (1 - commissionRate);
             winnerUpdate.winningsBalance = increment(prizeMoney);

            if (prizeMoney > (winnerProfile.biggestWin || 0)) {
                winnerUpdate.biggestWin = prizeMoney;
            }
        }

        transaction.update(winnerRef, winnerUpdate);
        transaction.update(loserRef, loserUpdate);

        if (!isPractice) {
            if (winnerProfile.gamesPlayed === 0) {
                // Do not await this call inside the transaction
                awardReferralBonus(transaction, winnerId);
            }
            if (loserProfile.gamesPlayed === 0) {
                 // Do not await this call inside the transaction
                 awardReferralBonus(transaction, loserId);
            }
        }
    });
}
