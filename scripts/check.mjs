import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const files = [
  'app.mjs', 'views.mjs', 'engine.mjs', 'data.mjs', 'glossary.mjs', 'field.mjs',
  'scripts/check.mjs', 'scripts/fetch-demo.mjs',
  'tests/index.js', 'tests/engine.test.mjs', 'tests/data.test.mjs', 'tests/routes.test.mjs', 'tests/field.test.mjs', 'tests/weather.test.mjs', 'tests/scoring.test.mjs', 'tests/comparison.test.mjs',
];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

for (const name of ['crops', 'demo-power-daily', 'demo-power-monthly']) {
  JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
}

console.log('V3 module syntax and JSON files are valid.');
