import { getStorage } from 'firebase/storage';
import { app } from '@/lib/firebase';

// Initialize Firebase Storage and export it
export const storage = getStorage(app);
