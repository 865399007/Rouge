import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
// Publish only runtime files, never local tooling, test outputs or credentials.
const files = ['index.html', 'style.css', 'game.js', 'presentation.js',
  'lobby.js', 'encounters.js', 'balance.js', 'progression.js', 'combat.js', 'impact-audio.js', 'classes.js', 'damage-numbers.js', 'roll.js', 'battle-skills.js', 'defenses.js', 'mounts.js', 'geometry.js', 'manifest.webmanifest',
  'assets', 'vendor'];
await mkdir(output, { recursive: true });
for (const file of files) await cp(path.join(root, file), path.join(output, file), { recursive: true });
// A changed module can affect its importers, so version the module graph together.
const modules = files.filter(file => file.endsWith('.js'));
const hash = createHash('sha256');
for (const file of modules) hash.update(await readFile(path.join(output, file)));
const revision = hash.digest('hex').slice(0, 12);
for (const file of ['index.html', ...modules]) {
  const dest = path.join(output, file);
  const source = await readFile(dest, 'utf8');
  const versioned = source.replace(/(["'])(\.\/[\w-]+\.js)(?:\?v=[\w-]+)?\1/g,
    (_, quote, name) => quote + name + '?v=' + revision + quote);
  await writeFile(dest, versioned);
}
console.log(`Static game prepared in ${output}`);
