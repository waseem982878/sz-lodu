export interface Battle {
  id: string;
  players: string[]; // Array of user IDs
  status: 'pending' | 'active' | 'completed' | 'disputed';
  winner?: string; // User ID of the winner
  screenshotUrl?: string; // URL of the uploaded screenshot
  createdAt: any;
  updatedAt: any;
}
