
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for static export on GitHub Pages
  output: 'export',
  
  // The name of your repository
  basePath: "/ludo-king-battles",
  assetPrefix: "/ludo-king-battles/",
  
  images: {
    // Required for static export
    unoptimized: true,
  },
};

export default nextConfig;
