'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { uploadImage } from '@/services/image-upload.service';

const PaymentProofPage = () => {
  const auth = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [orderId, setOrderId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !orderId || !auth.session?.user) {
      setMessage('Please select a file, enter an Order ID, and make sure you are logged in.');
      return;
    }

    setUploading(true);
    setMessage('Uploading proof...');

    try {
      const userId = (auth.session.user as any).id;
      const filePath = `payment-proofs/${userId}/${orderId}_${file.name}`;
      const downloadURL = await uploadImage(file, filePath);

      // Here you would typically associate this proof with the order in your database
      // For example, call a service function like:
      // await linkPaymentProofToOrder(orderId, downloadURL);

      setMessage(`Proof for order ${orderId} uploaded successfully!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessage(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Upload Payment Proof</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">If your payment is pending, please upload a screenshot of the completed transaction.</p>
        
        <div className="mb-4">
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
            <input 
                type="text" 
                id="orderId" 
                value={orderId} 
                onChange={(e) => setOrderId(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter the Order ID from your transaction"
            />
        </div>

        <input type="file" onChange={handleFileChange} className="mb-4" accept="image/*" />
        
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file || !orderId}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Proof'}
        </button>

        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

export default PaymentProofPage;
