# Jaipur release audit

Version: 3.2.0-jaipur.1. ECC production-audit applied to the buildless prototype. Assessment: ready for a clearly labelled hackathon demonstration; agronomic validation remains necessary before real farm recommendations.

The user's Jaipur request overrides the original Rajkot demo in AGENTS.md. That specification remains unchanged. No scoring formulas or scientific crop rows were changed to improve demo results. Historical Studio reviews describe their earlier release.

## Changes and evidence

- Replaced the actual daily and monthly NASA POWER responses at the Jobner point; did not relabel another city's observations. Added dated primary local sources and explicit soil, irrigation and regional uncertainty.
- Added one-click bundled demonstration, visible field identity, comparison loading/error/retry states, a local JSON decision brief, and a 90-second presentation guide.
- Kept the animated WebGL illustration, static fallback, motion controls, local licensed crop photographs, source labels, confidence reasons and all excluded alternatives.
- `npm run verify`: **103 tests passed**. Coverage includes current crop retention, missing data, stale-location rejection, crop calendars, scoring boundaries, cache fallback, safe rendering, scenario persistence and decision-brief purity/provenance/null handling.
- Browser QA: all seven routes at 360×800 fit without page overflow or failed crop images. At 1440×1000 comparison columns align at the same row. One-click demo displayed 50.43 / 71.26 / 70.06; export Blob contained identical exact scores, Jaipur coordinates, assumptions and NASA URLs. Saved field was unchanged. A stored −20% rainfall experiment survived Run demo, and Reset restored 0%. Screenshots: [mobile](mobile.png), [desktop](desktop.png). Console had no errors on the successful flow.
- Simulated missing bundled weather: visible error and Retry weather; current card says Not scored. No invented numeric result.

## Remaining limits and release controls

This is browser-local software with no account backend. The export contains coordinates and is generated locally. NASA requests require no secret. Static packaging uses an explicit public-file allowlist, excluding Git history, credentials and local tooling. Source publication preserves the existing owner-private audience; a judge needs account access or the local backup.

All crop parameters remain illustrative, confidence Low. The coarse weather grid is not a field sensor. Passing the water-gap threshold can still leave a shortfall. Missing satellite observations, unsupported crops, field soil tests, locally validated varieties, irrigation capacity and farmer feedback remain visible gaps. No yield, profit or winning claim is supported.

For regression recovery, the previous canonical Studio commit is `99937a599c5e1222169ea158440458a2fb26d9b4`, hosted as Site version 1 before this release. Repackage that commit to restore its static output. Avoid deploying it over the separate V2 or public V3 Pages branches. Release provenance is written into the packaged `build-info.json`.
