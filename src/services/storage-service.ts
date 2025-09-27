
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 *  @param path The path in Firebase Storage where the file should be saved.
 *  @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
    if (!storage) {
        throw new Error("Storage not available. Cannot upload image.");
    }
    if (!file || !path) {
        throw new Error("A file and a destination path must be provided.");
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file.");
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size should be less than 5MB.");
    }

    try {
        const timestamp = Date.now();
        const uniquePath = `${path}_${timestamp}`;
        const storageRef = ref(storage, uniquePath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error("Failed to upload image. Please try again.");
    }
};
