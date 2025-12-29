/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack to avoid issues with AWS SDK symlinks
  experimental: {
    turbo: false,
  },
}

module.exports = nextConfig
