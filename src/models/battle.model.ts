import { Timestamp } from 'firebase/firestore';

export type GameType = 'tic_tac_toe' | 'chess' | 'checkers' | 'classic' | 'ludo_classic';
export type BattleStatus = 'waiting' | 'active' | 'completed' | 'cancelled' | 'pending' | 'inprogress' | 'result_pending' | 'waiting_for_players_ready' | 'open';

export interface BattlePlayer {
    id: string;
    name: string;
    avatarUrl?: string;
}

export interface Battle {
    id: string;
    amount: number;
    gameType: GameType;
    status: BattleStatus;
    creator: BattlePlayer;
    opponent?: BattlePlayer;
    winner?: BattlePlayer | string;
    moves?: any[]; 
    result?: string;
    rematchRequestedBy?: string; 
    rematchAccepted?: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    roomCode?: string;
    readyPlayers?: string[];
}
