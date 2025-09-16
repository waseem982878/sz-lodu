
import type { Timestamp } from "firebase/firestore";

export interface BattlePlayer {
    id: string;
    name: string;
    avatarUrl: string;
}

export type GameType = 'classic' | 'popular';

export interface ResultSubmission {
    status: 'won' | 'lost';
    screenshotUrl?: string; // URL to screenshot for 'won'
    submittedAt: any;
}

export interface Battle {
    id: string;
    amount: number;
    gameType: GameType;
    status: 'open' | 'waiting_for_players_ready' | 'inprogress' | 'result_pending' | 'completed' | 'cancelled';
    creator: BattlePlayer;
    opponent?: BattlePlayer;
    roomCode?: string;
    winnerId?: string;
    readyPlayers?: {
        [userId: string]: boolean;
    };
    result?: {
        [userId: string]: ResultSubmission;
    };
    createdAt: any;
    updatedAt: any;
    startedAt?: any;
    completedAt?: any;
}
