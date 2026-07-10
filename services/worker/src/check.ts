import { loadConfig } from './env.js';

try {
  loadConfig();
  console.log('Worker configuration valid');
  process.exit(0);
} catch (e) {
  console.error('Worker configuration invalid:', (e as Error).message);
  process.exit(1);
}
