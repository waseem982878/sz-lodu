// src/services/storage-service.ts
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  if (!file) throw new Error('No file provided');
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file (JPEG, PNG, WebP)');
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');

  if (!storage) throw new Error("Firebase Storage is not initialized. Check your Firebase config and environment variables.");

  const timestamp = Date.now();
  const safeFileName = file.name.replace(/\s+/g, '_');
  const fullPath = `${path}/${timestamp}_${safeFileName}`;
  const storageRef = ref(storage, fullPath);

  return await new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        // optional: you can add progress logging here
        // const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      (error) => {
        console.error('Upload failed', error);
        if (error.code === 'storage/unauthorized') {
          reject(new Error('Upload permission denied. Please check storage rules.'));
        } else if (error.code === 'storage/canceled') {
          reject(new Error('Upload was canceled'));
        } else {
          reject(new Error(`Upload failed: ${error.message || error}`)));
        }
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err: any) {
          reject(new Error(`Failed to get download URL: ${err.message || err}`));
        }
      }
    );
  });
};