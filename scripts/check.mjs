import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const files = [
  'app.mjs', 'views.mjs', 'engine.mjs', 'data.mjs', 'glossary.mjs', 'field.mjs', 'scenario.mjs', 'labels.mjs', 'map.mjs', 'print.mjs', 'field-scene.mjs', 'photos.mjs', 'brief.mjs', 'priorities.mjs', 'charts.mjs', 'project.mjs', 'tests/catalogue.test.mjs', 'tests/readiness.test.mjs',
  'scripts/check.mjs', 'scripts/package-site.mjs', 'scripts/fetch-demo.mjs',
  'tests/index.js', 'tests/climate.test.mjs', 'tests/satellite.test.mjs', 'tests/scenario.test.mjs', 'tests/deployment.test.mjs', 'tests/optional.test.mjs', 'tests/studio.test.mjs', 'tests/jaipur.test.mjs', 'tests/engine.test.mjs', 'tests/data.test.mjs', 'tests/routes.test.mjs', 'tests/field.test.mjs', 'tests/weather.test.mjs', 'tests/scoring.test.mjs', 'tests/comparison.test.mjs', 'tests/timeline.test.mjs',
];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

for (const name of ['crops', 'demo-power-daily', 'demo-power-monthly', 'demo-satellite']) {
  JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
}

console.log('V3 module syntax and JSON files are valid.');
