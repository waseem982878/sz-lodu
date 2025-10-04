import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase'; // Assuming db is initialized and exported from here

const storage = getStorage();

// Centralized function for uploading images to Firebase Storage.
export const uploadImage = async (file: File, path: string): Promise<string> => {
    if (!file) {
        throw new Error("No file provided for upload.");
    }

    // Validate file type (only allow images)
    if (!file.type.startsWith('image/')) {
        throw new Error("Invalid file type. Only images are allowed.");
    }

    // Validate file size (max 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        throw new Error("File is too large. Maximum size is 5MB.");
    }

    console.log(`Attempting to upload ${file.name} to path: ${path}`);

    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log(`Successfully uploaded file and got download URL: ${downloadURL}`);
        return downloadURL;
    } catch (error) {
        console.error("Error during image upload:", error);
        // It's often helpful to re-throw the error to let the caller handle it
        throw new Error("Failed to upload image. Please try again later.");
    }
};
