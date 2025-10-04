import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file should be stored.
 * @returns The public URL of the uploaded file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};
