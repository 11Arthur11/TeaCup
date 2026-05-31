import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/assets', { recursive: true });
execFileSync(process.platform === 'win32' ? 'tsc.cmd' : 'tsc', ['-p', 'tsconfig.json'], { stdio: 'inherit' });
cpSync('public/index.html', 'dist/index.html');
cpSync('src/styles.css', 'dist/assets/styles.css');
cpSync('public/assets', 'dist/assets', { recursive: true });
cpSync('public/manifest.webmanifest', 'dist/manifest.webmanifest');
cpSync('public/config.js', 'dist/config.js');
console.log('TeaCloud build completed: dist/');
