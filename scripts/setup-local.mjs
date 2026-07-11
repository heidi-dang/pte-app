#!/usr/bin/env node
import { existsSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';

const stages = [
  {
    label: 'Checking Node.js',
    check: () => {
      const v = process.version.match(/^v(\d+)/);
      if (!v || parseInt(v[1]) < 24) throw new Error('Node.js 24+ required');
    },
  },
  {
    label: 'Checking npm',
    check: () => {
      execSync('npm --version', { stdio: 'pipe' });
    },
  },
  {
    label: 'Preparing local environment',
    check: () => {
      if (existsSync('.env.local')) return false;
      copyFileSync('.env.example', '.env.local');
      return true;
    },
  },
  {
    label: 'Checking Docker',
    check: () => {
      try {
        execSync('docker --version', { stdio: 'pipe' });
      } catch {
        // warn only, not blocking
      }
    },
  },
];

async function main() {
  let exitCode = 0;
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    process.stdout.write(`[${i + 1}/${stages.length}] ${s.label}... `);
    try {
      const created = s.check();
      if (created === false) {
        console.log('SKIP (already exists)');
      } else {
        console.log('OK');
      }
    } catch (e) {
      console.log(`FAIL\n  ${e.message}`);
      exitCode = 1;
    }
  }
  console.log('\nSetup complete. Next commands:');
  console.log('  npm run doctor    — verify the environment');
  console.log('  npm run local:up  — start all services');
  process.exit(exitCode);
}

main();
