import { v4 as uuidv4 } from 'uuid';

const UPLOAD_PRESET = 'your_upload_preset'; // Replace with your Cloudinary upload preset
const CLOUD_NAME = 'your_cloud_name'; // Replace with your Cloudinary cloud name

export async function uploadImage(file: File, publicId?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('public_id', publicId || uuidv4());

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Image upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}
