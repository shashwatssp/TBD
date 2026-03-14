#!/usr/bin/env node

// Set environment variables with defaults for local development
process.env.EXPO_PACKAGER_PROXY_URL = process.env.REPLIT_EXPO_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}` 
  : '';
// Don't override EXPO_PUBLIC_DOMAIN if it's already set in .env
if (!process.env.EXPO_PUBLIC_DOMAIN) {
  process.env.EXPO_PUBLIC_DOMAIN = process.env.REPLIT_DEV_DOMAIN || 'localhost';
}
process.env.EXPO_PUBLIC_REPL_ID = process.env.REPL_ID || '';
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = process.env.REPLIT_DEV_DOMAIN || 'localhost';
const port = process.env.PORT || '19000';

// Run expo start
const { spawn } = require('child_process');
const child = spawn('pnpm', ['exec', 'expo', 'start', '--port', port], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});