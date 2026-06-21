/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://toogood-production.up.railway.app/api/:path*',
      },
      {
        source: '/users/:path*',
        destination: 'https://toogood-production.up.railway.app/users/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'https://toogood-production.up.railway.app/uploads/:path*',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'toogood-production.up.railway.app',
        port: '',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  compress: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
};

module.exports = nextConfig;