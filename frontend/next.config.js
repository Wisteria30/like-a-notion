/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  typescript: {
    // Type errors will be caught during build
    ignoreBuildErrors: false,
  },
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: true,
}