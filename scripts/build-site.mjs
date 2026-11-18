import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
// Publish only runtime files, never local tooling, test outputs or credentials.
const files = ['index.html', 'style.css', 'game.js', 'presentation.js',
  'battle-skills.js', 'defenses.js', 'geometry.js', 'manifest.webmanifest',
  'assets', 'vendor'];
await mkdir(output, { recursive: true });
for (const file of files) await cp(path.join(root, file), path.join(output, file), { recursive: true });
console.log(`Static game prepared in ${output}`);
