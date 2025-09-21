/** @type {import('next').NextConfig} */
const nextConfig = {
  // The recharts library uses some syntax that is not compatible with the modern JS build process.
  // This line tells Next.js to run recharts through its compiler to fix this.
  transpilePackages: ['recharts'],
};

export default nextConfig;
