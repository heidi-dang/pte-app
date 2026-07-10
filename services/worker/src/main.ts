import { loadConfig } from './env.js';

const config = loadConfig();
const isTest = process.argv.includes('--test') || process.env.LOG_LEVEL === 'test';

console.log(JSON.stringify({ event: 'worker_starting', version: config.version, timestamp: new Date().toISOString() }));

const keepalive = setInterval(() => {
  console.log(JSON.stringify({ event: 'worker_keepalive', timestamp: new Date().toISOString() }));
}, 30000);

console.log(JSON.stringify({ event: 'worker_ready', version: config.version, timestamp: new Date().toISOString() }));

if (isTest) {
  console.log(JSON.stringify({ event: 'worker_test_mode_exit', timestamp: new Date().toISOString() }));
  clearInterval(keepalive);
  process.exit(0);
}

process.on('SIGINT', () => {
  console.log(JSON.stringify({ event: 'worker_shutdown', timestamp: new Date().toISOString() }));
  clearInterval(keepalive);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(JSON.stringify({ event: 'worker_shutdown', timestamp: new Date().toISOString() }));
  clearInterval(keepalive);
  process.exit(0);
});
