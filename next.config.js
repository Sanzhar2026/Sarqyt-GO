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

  // Настройки изображений
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
        hostname: 'toogood-2ncf.onrender.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ✅ ДОБАВЛЕНО: Оптимизация памяти
  experimental: {
    workerThreads: false,  // Отключаем worker threads (экономия памяти)
    cpus: 1,               // Ограничиваем количество CPU (экономия памяти)
  },

  // ✅ ДОБАВЛЕНО: Уменьшение размера сборки
  compress: true,          // Включаем сжатие
  swcMinify: true,         // Используем SWC для минификации (быстрее и меньше памяти)

  // ✅ ДОБАВЛЕНО: Отключение source maps в production (экономия памяти)
  productionBrowserSourceMaps: false,

  // Опционально: игнорировать ошибки TypeScript при сборке
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ ДОБАВЛЕНО: Дополнительные оптимизации
  reactStrictMode: true,   // Помогает найти проблемы с памятью
  poweredByHeader: false,  // Убираем X-Powered-By header (экономия)
  
  // Настройки для Render.com
  output: 'standalone',     // Уменьшает размер деплоя (экономия памяти)
};

module.exports = nextConfig;