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
        destination: 'https://instabids-agent-swarm-8k5am.ondigitalocean.app/:path*', // Proxy to DigitalOcean backend
      },
    ]
  },
  images: {
    domains: ['instabids.ai'],
  },
  output: 'standalone',
}

module.exports = nextConfig
