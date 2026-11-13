import { writeFile, rename } from 'node:fs/promises';
import { DEMO_FARM, buildPowerRequests, fetchPowerRecord, latestCompleteAgYear } from '../data.mjs';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--year' || !/^\d{4}$/.test(args[1]))) {
  console.error('Usage: node scripts/fetch-demo.mjs [--year YYYY]');
  process.exitCode = 1;
} else {
  try {
    const requests = buildPowerRequests(DEMO_FARM, args.length ? Number(args[1]) : latestCompleteAgYear());
    const results = await Promise.allSettled([fetchPowerRecord(requests.daily), fetchPowerRecord(requests.monthly)]);
    const errors = results.filter(result => result.status === 'rejected').map(result => result.reason.message);
    if (errors.length) throw new Error(errors.join(' '));
    // Validate both downloads before replacing either existing fallback file.
    for (const { value: record } of results) {
      const { payload, source, fallback_reason, cache_warning, ...metadata } = record;
      const target = new URL(`../data/demo-power-${record.kind}.json`, import.meta.url);
      const temporary = new URL(`${target.href}.tmp`);
      await writeFile(temporary, JSON.stringify({ ...payload, _terraplan: metadata }) + '\n', 'utf8');
      await rename(temporary, target);
      console.log(`${record.kind}: downloaded ${record.start}–${record.end} for Rajkot. Source: ${record.request_url}. Retrieved: ${record.retrieved_at}`);
    }
  } catch (error) {
    console.error(`Demo download failed: ${error.message} Existing files are preserved when requests fail. Run this script again with network access.`);
    process.exitCode = 1;
  }
}
