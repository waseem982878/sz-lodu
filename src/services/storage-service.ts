// src/services/storage-service.ts
import { storage } from './firebase-service';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 *
 * @param file The file to upload.
 * @param path The path in Firebase Storage to upload the file to.
 * @param onProgress A callback function to track the upload progress.
 * @returns The download URL of the uploaded file.
 */
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file) throw new Error('No file provided');
  if (!storage) throw new Error('Firebase Storage is not initialized.');

  const timestamp = Date.now();
  const safeFileName = file.name.replace(/\s+/g, '_');
  const fullPath = `${path}/${timestamp}_${safeFileName}`;
  const storageRef = ref(storage, fullPath);

  return new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        reject(new Error('Upload failed: ' + error.message));
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then(resolve)
          .catch(reject);
      }
    );
  });
};
