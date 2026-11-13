# Testing and verification

Run `npm run verify` on Node.js 22+ (CI uses 24). There is no required package dependency installation. `npm run check` checks module syntax, local doc links, seven photo records/files and exclusion of private hosting files. `npm test` runs ten tests.

## Eight existing domain/storage/data tests

1. Four complete crop years and the leap day.
2. Calendar/soil exclusions and null scores for excluded pairs.
3. Water and heat sensitivity in the expected direction for both seasons.
4. Area-to-volume scaling without changing rankings.
5. Missing daily observations blocking evaluation.
6. Snapshot copying, imported-score recalculation, coordinate mismatch and unsupported versions.
7. Workspace persistence round trips.
8. Late weather responses becoming stale after field switching.

These use the bundled NASA record or an in-memory fake client. They do not call the external API.

## Two repository preview tests

The Node preview is tested for application/module/data serving, MIME types and HEAD behavior, then invalid encoding, unsupported methods, unavailable files and restricted paths. Each test binds an ephemeral port on `127.0.0.1` and closes it afterwards. Restricted execution environments may need permission to bind loopback sockets.

## Manual browser checklist

- Add/edit/select a field, change texture and verify the context/exclusions change.
- Compare historical years; inspect rainfall/temperature tables and units.
- Trigger an unsupported or incomplete window and restore the default calendar.
- Change both seasons' water/heat settings and verify the baseline stays clearly identified.
- Save/reload a plan, export/import it, compare two snapshots and inspect print output.
- Open crop details and photo credits; verify original-source and license links.
- Test 3D orbit, color, pause/reset, keyboard controls, reduced motion and unavailable WebGL.
- Test keyboard focus, dialogs, mobile menu, overflow, touch scrolling, screen readers and real-device performance.

Earlier bounded checks covered many desktop/390 px mobile workflows without observed console errors. They were not an automated browser suite. Broader device/accessibility checks, print-to-PDF, unavailable-WebGL simulation, live custom-location behavior and measured performance remain incomplete.

Software tests do not validate crop constants, regional suitability or agricultural outcomes. Treat agronomist/farmer review as a separate evidence requirement.
