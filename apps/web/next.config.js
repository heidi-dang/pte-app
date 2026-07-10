/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: { APP_VERSION: process.env.APP_VERSION || '0.0.0' },
};
module.exports = nextConfig;
