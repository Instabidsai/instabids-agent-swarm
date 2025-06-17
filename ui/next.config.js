/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*', // Keep API routes within Next.js for Vercel routing
      },
    ]
  },
  images: {
    domains: ['instabids.ai'],
  },
  output: 'standalone',
}

module.exports = nextConfig
