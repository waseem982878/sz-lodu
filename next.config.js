/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'], // Allow images from Firebase Storage
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Add this for development
  allowedDevOrigins: [
    "3002-firebase-sdf-battles-1759558441500.cluster-sumfw3zmzzhzkx4mpvz3ogth4y.cloudworkstations.dev",
    "localhost",
    "127.0.0.1"
  ],
}

module.exports = nextConfig
