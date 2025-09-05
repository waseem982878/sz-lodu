
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 *  @param path The path in Firebase Storage where the file should be saved.
 *  @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
    if (!file || !path) {
        throw new Error("A file and a destination path must be provided.");
    }
    const storageRef = ref(storage, path);
    // uploadBytes is simpler for smaller files like screenshots.
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};
