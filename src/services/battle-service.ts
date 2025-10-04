// src/services/battle-service.ts
import { db } from './firebase-service';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

export interface Battle {
  id?: string;
  gameId: string;
  player1: string;
  player2: string;
  status: 'pending' | 'active' | 'completed';
  betAmount: number;
  winner?: string;
  createdAt: any;
}

const battlesCollection = collection(db, 'battles');

export const createBattle = async (battle: Omit<Battle, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(battlesCollection, {
    ...battle,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getBattle = async (id: string): Promise<Battle | null> => {
  const docRef = doc(db, 'battles', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Battle;
  }
  return null;
};

export const updateBattle = async (id: string, updates: Partial<Battle>): Promise<void> => {
  const docRef = doc(db, 'battles', id);
  await updateDoc(docRef, updates);
};

export const findPendingBattles = async (gameId: string, betAmount: number): Promise<Battle[]> => {
  const q = query(
    battlesCollection,
    where('gameId', '==', gameId),
    where('betAmount', '==', betAmount),
    where('status', '==', 'pending')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Battle));
};
