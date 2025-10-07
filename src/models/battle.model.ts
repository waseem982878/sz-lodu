import { Timestamp } from 'firebase/firestore';

export type GameType = 'ludo_king' | 'ludo_classic' | 'ludo_popular';

export type BattleStatus = 
  | 'open'                 
  | 'pending'              
  | 'waiting_for_players_ready' 
  | 'active'               
  | 'inprogress'           
  | 'result_pending'       
  | 'disputed'             
  | 'completed'            
  | 'cancelled';

export interface BattlePlayer {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Battle {
  id: string;
  gameType: GameType;
  amount: number;
  status: BattleStatus;
  
  creator: BattlePlayer; 

  opponent?: BattlePlayer; 
  
  players: BattlePlayer[]; 
  readyPlayers?: { [key: string]: boolean };

  roomCode?: string;
  
  winner?: BattlePlayer; 
  loser?: BattlePlayer;  

  result?: {
    [key: string]: { 
      status: 'won' | 'lost';
      screenshotUrl?: string;
      submittedAt: Timestamp;
    };
  };

  dispute?: {
    raisedBy: string;
    reason: string;
    status: 'open' | 'resolved';
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledBy?: string;
}
