#!/usr/bin/env node
/**
 * Reads API_BASE_URL environment variable and writes environment.prod.ts.
 * Called by Vercel at build time: node scripts/set-env.js && ng build --configuration production
 */

const fs = require('fs');
const path = require('path');

const apiBase = (process.env.API_BASE_URL || '').replace(/\/$/, '');
const apiUrl = apiBase ? `${apiBase}/api/v1` : '/api/v1';

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};\n`;

const outPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(outPath, content, 'utf8');

console.log(`[set-env] apiUrl = ${apiUrl}`);
