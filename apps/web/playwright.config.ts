import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  globalSetup: resolve(__dirname, 'e2e', 'global-setup'),
  globalTeardown: resolve(__dirname, 'e2e', 'global-teardown'),
  use: {
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
