import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function walk(directory) { const result = []; for (const entry of await readdir(directory, { withFileTypes: true })) { const path = resolve(directory, entry.name); if (entry.isDirectory()) result.push(...await walk(path)); else result.push(path); } return result; }
const paths = [...await walk(resolve(root, 'dist')), ...await walk(resolve(root, 'scripts')), resolve(root, 'test.mjs')];
for (const file of paths.filter(path => path.endsWith('.mjs'))) {
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (check.status !== 0) throw Error(check.stderr || `Syntax check failed: ${file}`);
}
const credits = JSON.parse(await readFile(resolve(root, 'dist/assets/photo-credits.json'), 'utf8'));
for (const key of ['rice', 'wheat', 'millet', 'chickpea', 'maize', 'sorghum', 'mung']) {
  const credit = credits[key];
  if (!credit?.author || !credit?.license || !credit?.page || !credit?.path) throw Error(`Incomplete photo credit: ${key}`);
  if (!(await stat(resolve(root, 'dist', credit.path))).isFile()) throw Error(`Missing crop image: ${key}`);
}
for (const path of [resolve(root, 'README.md'), ...await walk(resolve(root, 'docs'))].filter(path => path.endsWith('.md'))) {
  const content = await readFile(path, 'utf8');
  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (target.startsWith('#') || /^[a-z]+:/i.test(target)) continue;
    const local = decodeURIComponent(target.split('#')[0]);
    if (local) await stat(resolve(dirname(path), local));
  }
}
for (const forbidden of ['.openai', '.env']) {
  try { await stat(resolve(root, forbidden)); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  throw Error(`${forbidden} must not be included in this distribution.`);
}
console.log('PASS: module syntax, seven photo records/assets, local documentation links and distribution boundaries.');
