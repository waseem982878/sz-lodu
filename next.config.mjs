
/** @type {import('next').NextConfig} */
const nextConfig = {
    // This is required to make 'recharts' library work with Next.js App Router
    transpilePackages: ['recharts'],
    experimental: {
        serverComponentsExternalPackages: ['firebase-admin'],
    }
};

export default nextConfig;
