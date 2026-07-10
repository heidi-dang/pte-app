#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';

const root = resolve(import.meta.dirname, '../..');
const envLocalPath = resolve(root, '.env.local');
const envExamplePath = resolve(root, '.env.example');

export function loadEnvLocal(path) {
  const p = path || envLocalPath;
  if (!existsSync(p)) return {};
  const text = readFileSync(p, 'utf-8');
  const vars = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) vars[key] = val;
  }
  return vars;
}

export function getRequired(vars, key) {
  const val = vars[key];
  if (val === undefined || val === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export function validatePort(val, key) {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1 || num > 65535) {
    throw new Error(`Invalid port for ${key}: "${val}" must be between 1 and 65535`);
  }
  return num;
}

const REQUIRED_LOCAL = [
  'NODE_ENV',
  'WEB_HOST',
  'WEB_PORT',
  'API_HOST',
  'API_PORT',
  'SCORING_HOST',
  'SCORING_PORT',
  'POSTGRES_DATABASE',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
  'LOG_LEVEL',
  'APP_VERSION',
];

const REQUIRED_BROWSER = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_SCORING_URL'];

export function validateConfig(vars) {
  const errors = [];
  for (const key of [...REQUIRED_LOCAL, ...REQUIRED_BROWSER]) {
    try {
      getRequired(vars, key);
    } catch (e) {
      errors.push(e.message);
    }
  }
  // Validate ports
  for (const key of ['WEB_PORT', 'API_PORT', 'SCORING_PORT', 'POSTGRES_PORT', 'REDIS_PORT']) {
    if (vars[key]) {
      try {
        validatePort(vars[key], key);
      } catch (e) {
        errors.push(e.message);
      }
    }
  }
  return errors;
}

export { envLocalPath, envExamplePath, root };
