/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'], // Allow images from Firebase Storage
  },
};

module.exports = nextConfig;
