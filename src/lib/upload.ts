import { v4 as uuidv4 } from 'uuid';

const UPLOAD_PRESET = 'your_upload_preset'; // Replace with your Cloudinary upload preset
const CLOUD_NAME = 'your_cloud_name';     // Replace with your Cloudinary cloud name
const API_KEY = 'your_api_key';           // Replace with your Cloudinary API key

/**
 * Uploads a file to a cloud service (e.g., Cloudinary).
 * 
 * @param file The file to be uploaded.
 * @returns The secure URL of the uploaded file.
 */
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('api_key', API_KEY);
  formData.append('public_id', uuidv4()); // Assign a unique public ID

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
    }

    const data = await response.json();
    return data.secure_url;
    
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
