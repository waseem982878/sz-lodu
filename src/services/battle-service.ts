import {
    collection,
    doc,
    addDoc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    serverTimestamp,
    FieldValue
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Battle } from '@/models/battle.model';
import { uploadFile } from './storage-service'; // Import uploadFile

export class BattleService {

    static battlesCollection = collection(db, 'battles');

    static async createBattle(playerIds: string[]): Promise<Battle> {
        const newBattleData = {
            players: playerIds,
            status: 'pending' as const,
            createdAt: serverTimestamp() as FieldValue,
            updatedAt: serverTimestamp() as FieldValue,
        };
        const docRef = await addDoc(this.battlesCollection, newBattleData);
        const docSnap = await getDoc(docRef);
        return { id: docRef.id, ...docSnap.data() } as Battle;
    }

    static getBattleStream(battleId: string, onUpdate: (battle: Battle | null) => void): () => void {
        const docRef = doc(this.battlesCollection, battleId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                onUpdate({ id: docSnap.id, ...docSnap.data() } as Battle);
            } else {
                onUpdate(null);
            }
        }, (error) => {
            console.error("Error streaming battle:", error);
            onUpdate(null);
        });
        return unsubscribe;
    }

    static async cancelBattle(battleId: string, userId: string): Promise<void> {
        const battleRef = doc(this.battlesCollection, battleId);
        await updateDoc(battleRef, {
            status: 'cancelled',
            updatedAt: serverTimestamp(),
            cancelledBy: userId,
        });
    }

    static async markPlayerAsReady(battleId: string, userId: string): Promise<void> {
        const battleRef = doc(this.battlesCollection, battleId);
        await updateDoc(battleRef, {
            [`readyPlayers.${userId}`]: true,
            updatedAt: serverTimestamp(),
        });
    }

    static async setRoomCode(battleId: string, roomCode: string): Promise<void> {
        const battleRef = doc(this.battlesCollection, battleId);
        await updateDoc(battleRef, {
            roomCode: roomCode,
            status: 'waiting_for_players_ready',
            updatedAt: serverTimestamp(),
        });
    }

    static async uploadResult(battleId: string, userId: string, status: 'won' | 'lost', screenshotFile: File): Promise<void> {
        const screenshotUrl = await uploadFile(screenshotFile, `battle-results/${battleId}`);
        const battleRef = doc(this.battlesCollection, battleId);
        await updateDoc(battleRef, {
            status: 'result_pending',
            updatedAt: serverTimestamp(),
            [`result.${userId}`]: {
                status: status,
                screenshotUrl: screenshotUrl,
                submittedAt: serverTimestamp(),
            },
        });
    }

    static async getUserBattles(userId: string): Promise<Battle[]> {
        const q = query(this.battlesCollection, where("players", "array-contains", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Battle));
    }
}
