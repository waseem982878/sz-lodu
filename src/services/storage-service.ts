
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param path The base path in Firebase Storage where the file should be saved (e.g., 'kyc/userId/pan').
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    console.log('🚀 Starting upload for:', file.name);
    console.log('📁 Target path:', path);

    // 1. File validation
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file (JPEG, PNG, etc.)');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // 2. Create unique filename
    const timestamp = Date.now();
    // Use the provided path as a directory and create a unique name inside it
    const fileName = `${path}/${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    
    console.log('📄 Final filename:', fileName);

    // 3. Create storage reference
    const storageRef = ref(storage, fileName);
    
    // 4. Upload file
    console.log('⬆️ Uploading file...');
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Upload successful');

    // 5. Get download URL
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🌐 Download URL:', downloadURL);

    return downloadURL;

  } catch (error: any) {
    console.error('❌ Upload failed:', error);
    
    // Specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to upload files. Check your storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/unknown') {
      throw new Error('An unknown error occurred during upload. Please try again.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};
