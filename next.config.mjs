/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            }
        ],
    },
    webpack: (config) => {
        // This is to fix a bug with recharts and Next.js App Router
        config.externals.push('recharts');
        return config;
    }
};

export default nextConfig;
