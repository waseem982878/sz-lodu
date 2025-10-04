import {
    collection, 
    doc, 
    addDoc, 
    getDoc, 
    updateDoc, 
    query, 
    where, 
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Battle } from '@/models/battle.model';
import { uploadImage } from './image-upload.service';

export class BattleService {

    static battlesCollection = collection(db, 'battles');

    // Create a new battle
    static async createBattle(playerIds: string[]): Promise<Battle> {
        const newBattleData = {
            players: playerIds,
            status: 'pending' as const, // Initial status
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const docRef = await addDoc(this.battlesCollection, newBattleData);
        return { id: docRef.id, ...newBattleData } as Battle;
    }

    // Get a battle by its ID
    static async getBattle(battleId: string): Promise<Battle | null> {
        const docRef = doc(this.battlesCollection, battleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Battle;
        }
        return null;
    }

    // Upload a result screenshot and update the battle
    static async uploadBattleResult(battleId: string, userId: string, file: File): Promise<void> {
        if (!file) {
            throw new Error("No screenshot file provided.");
        }

        const battle = await this.getBattle(battleId);
        if (!battle) {
            throw new Error("Battle not found.");
        }
        if (!battle.players.includes(userId)) {
            throw new Error("You are not a player in this battle.");
        }
        if (battle.status !== 'active') {
            throw new Error("Battle is not active. You cannot upload a result.");
        }

        // 1. Upload the image using the centralized service
        const imagePath = `battles/${battleId}/${userId}_${Date.now()}`;
        const screenshotUrl = await uploadImage(file, imagePath);

        // 2. Update the battle document
        const battleRef = doc(this.battlesCollection, battleId);
        await updateDoc(battleRef, {
            screenshotUrl: screenshotUrl,
            status: 'disputed', // Change status to disputed, awaiting admin review
            winner: userId, // Tentatively set the uploader as the winner
            updatedAt: new Date(),
        });
        
        console.log(`Battle ${battleId} updated with screenshot from user ${userId}.`);
    }

    // Get battles for a specific user
    static async getUserBattles(userId: string): Promise<Battle[]> {
        const q = query(this.battlesCollection, where("players", "array-contains", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Battle));
    }
}
