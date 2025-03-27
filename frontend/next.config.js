/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['www.ahana.co.in'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*',
      },
    ];
  },
}

module.exports = nextConfig 