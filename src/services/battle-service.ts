import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 
import { db } from "@/lib/firebase";
import { Battle } from "@/models/battle.model";

export const createBattle = async (battle: Omit<Battle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const battleCollection = collection(db, "battles");
    const battleRef = await addDoc(battleCollection, {
        ...battle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return battleRef.id;
};
