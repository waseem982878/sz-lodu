
import { Battle, BattleStatus, GameType } from "@/models/battle.model";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export const createBattle = async (
  userId: string,
  amount: number,
  gameType: GameType
): Promise<string> => {
  const battlesRef = collection(db, "battles");
  const newBattle: Partial<Battle> = {
    creator: userId,
    amount,
    gameType,
    status: 'open',
    players: [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(battlesRef, newBattle);
  return docRef.id;
};

export const joinBattle = async (
  battleId: string,
  userId: string
): Promise<void> => {
  const battleRef = doc(db, "battles", battleId);
  const battleDoc = await getDoc(battleRef);
  if (!battleDoc.exists()) {
    throw new Error("Battle not found");
  }
  const battleData = battleDoc.data() as Battle;

  await updateDoc(battleRef, {
    opponent: userId,
    status: "pending",
    players: [ battleData.creator, userId],
    updatedAt: serverTimestamp(),
  });
};

export const updateBattleStatus = async (
  battleId: string,
  status: BattleStatus
): Promise<void> => {
  const battleRef = doc(db, "battles", battleId);
  await updateDoc(battleRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const setRoomCode = async (
  battleId: string,
  roomCode: string
): Promise<void> => {
  const battleRef = doc(db, "battles", battleId);
  await updateDoc(battleRef, {
    roomCode,
    status: "active",
    updatedAt: serverTimestamp(),
  });
};

export const uploadBattleResult = async (battleId: string, userId: string, screenshotUrl: string) => {
    // Implementation needed
};

// Add other battle-related functions here
