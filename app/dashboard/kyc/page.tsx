'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth'; // Assuming you have this hook
import { uploadImage } from '@/services/image-upload.service';
import { updateUserKycStatus } from '@/services/user.service'; // Assuming you create this service function

const KycPage = () => {
  const auth = useAuth(); // Custom hook to get user info
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !auth.user) {
      setMessage('Please select a file and make sure you are logged in.');
      return;
    }

    setUploading(true);
    setMessage('Uploading...');

    try {
      const filePath = `kyc/${auth.user.uid}/${file.name}`;
      const downloadURL = await uploadImage(file, filePath);

      // After successful upload, update user's KYC status to pending
      await updateUserKycStatus(auth.user.uid, 'pending', downloadURL);

      setMessage(`File uploaded successfully! Your KYC is pending review.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessage(`Upload failed: ${errorMessage}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">KYC Verification</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">Please upload a clear photo of your government-issued ID (Aadhaar, PAN, etc.)</p>
        
        <input type="file" onChange={handleFileChange} className="mb-4" accept="image/*" />
        
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>

        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}

        {/* You would fetch and display the user's current KYC status here */}
        {auth.user && (
            <div className="mt-6">
                <p>Current Status: <span className="font-semibold">{auth.user.kycStatus || 'Not Submitted'}</span></p>
            </div>
        )}
      </div>
    </div>
  );
};

export default KycPage;
