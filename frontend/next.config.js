/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['www.ahana.co.in'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        // Exclude our internal API routes
        has: [
          {
            type: 'header',
            key: 'x-skip-rewrite',
            value: '1',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 