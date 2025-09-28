
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param path The base path in Firebase Storage where the file should be saved (e.g., 'kyc/userId/pan').
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    console.log('=== UPLOAD STARTED ===');
    console.log('File:', file.name, 'Size:', file.size);
    console.log('Path:', path);

    // 1. Basic validation
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file (JPEG, PNG, WebP)');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // 2. Create unique filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/\s+/g, '_');
    const fullPath = `${path}/${timestamp}_${safeFileName}`;

    console.log('Final path:', fullPath);

    // 3. Upload to Firebase Storage
    if (!storage) {
        throw new Error("Firebase Storage is not initialized. Check your Firebase config and environment variables.");
    }
    const storageRef = ref(storage, fullPath);
    console.log('Storage ref created');

    const snapshot = await uploadBytes(storageRef, file);
    console.log('Upload completed, snapshot:', snapshot);

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);

    console.log('=== UPLOAD SUCCESSFUL ===');
    return downloadURL;

  } catch (error: any) {
    console.error('=== UPLOAD FAILED ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    // Specific error handling
    if (error.code === 'storage/unauthorized') {
      throw new Error('Upload permission denied. Please check storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};
