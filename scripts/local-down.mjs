#!/usr/bin/env node
import { execSync } from 'child_process';

try {
  execSync('docker compose down', { stdio: 'inherit' });
  console.log('Services stopped. Volumes preserved.');
  console.log('To reset completely: docker compose down -v && rm -f .env.local');
} catch {
  console.log('Docker Compose not running or unavailable.');
}
