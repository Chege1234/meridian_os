import * as fs from 'fs';
import * as path from 'path';

// Load environment variables before any other imports
function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env')
  ];
  
  let loaded = false;
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading env file: ${envPath}`);
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '');
        if (key) {
          process.env[key] = val;
          loaded = true;
        }
      }
    }
  }
  if (!loaded) {
    console.warn('No .env or .env.local file loaded!');
  }
}

loadEnv();
