'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { uploadImage } from '@/services/image-upload.service';

const BattleResultPage = () => {
  const auth = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [battleId, setBattleId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !battleId || !auth.user) {
      setMessage('Please select a file, enter a Battle ID, and make sure you are logged in.');
      return;
    }

    setUploading(true);
    setMessage('Uploading result...');

    try {
      const timestamp = new Date().toISOString();
      const filePath = `results/${battleId}/${auth.user.uid}_${timestamp}`;
      const downloadURL = await uploadImage(file, filePath);

      // Here you would typically update the battle data with this result proof
      // For example, call a service function like:
      // await submitBattleResult(battleId, auth.user.uid, downloadURL);

      setMessage(`Result for battle ${battleId} uploaded successfully! A moderator will review it shortly.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessage(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Upload Battle Result</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">After completing your battle, upload a screenshot of the victory/defeat screen.</p>
        
        <div className="mb-4">
            <label htmlFor="battleId" className="block text-sm font-medium text-gray-700 mb-1">Battle ID</label>
            <input 
                type="text" 
                id="battleId" 
                value={battleId} 
                onChange={(e) => setBattleId(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter the ID of the battle you completed"
            />
        </div>

        <input type="file" onChange={handleFileChange} className="mb-4" accept="image/*" />
        
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file || !battleId}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Result'}
        </button>

        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

export default BattleResultPage;
