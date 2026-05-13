/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://toogood-2ncf.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;