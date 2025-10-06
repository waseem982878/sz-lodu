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

export interface Battle {
  id: string;
  gameType: GameType;
  amount: number;
  status: BattleStatus;
  
  creator: string; 
  creatorName?: string;
  creatorPhotoURL?: string;

  opponent?: string; 
  opponentName?: string;
  opponentPhotoURL?: string;
  
  players: string[]; 
  readyPlayers?: string[];

  roomCode?: string;
  
  winner?: string; 
  loser?: string;  

  result?: {
    winner: {
      uid: string;
      screenshotURL: string;
    };
    loser: {
      uid: string;
      screenshotURL?: string;
    };
  };

  dispute?: {
    raisedBy: string;
    reason: string;
    status: 'open' | 'resolved';
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
