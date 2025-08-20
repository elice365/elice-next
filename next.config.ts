import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
  // Webpack 경고 제거
  webpack: (config) => {
    // webpack 인프라 로깅 레벨 조정 (캐시 경고 억제)
    config.infrastructureLogging = {
      level: 'error', // 'warn' 레벨 메시지 숨기기
      debug: false,
    };

    // 성능 경고 비활성화
    config.performance = {
      hints: false, // 번들 크기 경고 비활성화
    };

    // 캐시 전략 최적화 (경고 발생 지점)
    if (config.cache && typeof config.cache === 'object') {
      config.cache.maxMemoryGenerations = 5; // 메모리 세대 제한
    }

    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'], 
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          // API-specific headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/_error',
        destination: '/',
        permanent: false
      },
    ];
  },
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig)