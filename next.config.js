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
  // 👇 ДОБАВЬ ЭТУ СЕКЦИЮ
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Если используешь другие источники изображений, добавь их сюда
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'toogood-2ncf.onrender.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Опционально: игнорировать ошибки TypeScript при сборке
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;