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
        destination: 'https://instabids-sales-bot-api-67gkc.ondigitalocean.app/api/:path*',
      },
    ]
  },
  images: {
    domains: ['instabids.ai'],
  },
  // REMOVED: output: 'standalone', - This was causing Vercel deployment issues
}

module.exports = nextConfig
