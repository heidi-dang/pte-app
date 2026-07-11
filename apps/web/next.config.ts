import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  env: { APP_VERSION: process.env.APP_VERSION || '0.0.0' },
};

export default nextConfig;
