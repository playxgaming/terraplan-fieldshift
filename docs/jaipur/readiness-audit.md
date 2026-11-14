# ECC readiness audit — 14 November 2026

Engineering assessment: **82/100, launchable with caveats for a hackathon prototype**. This is a subjective triage score, not an agronomic-accuracy or judging score. The central caveats are unvalidated crop inputs and no evidence of an official project submission. The original private-access presentation blocker was resolved by the owner's explicit request for public Studio access.

## Fixed

- Evidence could show weather/trends from the previous point after field coordinates changed. It now withholds those observations and offers the climate-loading route. A regression test checks both wrong-point and explicitly stale-year states.
- Priority weights reset on reload. They now have a separate versioned record with validation, corrupt-record preservation, storage-error messages and reset behavior.
- Demo exploration had no direct route back to a saved field. Restore saved field now recovers it without modifying stored priorities or What-if settings; no saved record leaves the current draft intact.
- Added exact-value-backed annual rainfall and temperature charts. Gaps break lines; genuine zero remains zero. Mobile chart axes were enlarged after visual review.
- Added AEGIS LABS credits, an honest in-app implementation/validation status, seven-slide public presentation and a ready-to-adapt submission draft.

## Evidence checked

- Local repository, original AGENTS.md, current Studio branch, CI/deployment workflow, public-file allowlist, field/priority/scenario storage, weather caching, request guards and print/export boundaries.
- `npm run verify`: **107 passed, 0 failed**. New checks cover priority isolation/reload/corruption/blocked writes, stale Evidence, chart missing years/zero/purity and exact seven-slide/team/AI disclosures. Existing engine/data tests still pass; no scientific model constants or crop rows were changed.
- ECC browser at 360×800: all seven routes without page overflow or failed crop images. Mobile menu opens, 3D Pause becomes Play, and baseline remains 50.43 / 71.26 / 70.06.
- Saved-field recovery flow: save a distinct field → run demo → restore saved field. Original stored bytes remained unchanged. Water weight 5 survived reload and Reset restored default weights. Changing field latitude withheld old Evidence charts.
- Chart visual review at 360 px; presentation has seven slides and no page overflow at 360 px or 1440 px. Screenshots: [charts](charts-mobile.png), [presentation](pitch-desktop.png). Exact annual table remains available for accessibility.
- Successful local flow had no browser console errors. Hosting access changed through Sites to public as explicitly authorized; a previously unauthenticated browser could load the Studio without sign-in. Final release provenance is in hosted `build-info.json`.

## Evidence still missing

Actual field soil/water measurements, local agronomist sign-off, farmer interviews/usability results, crop varieties, field outcomes and quality-checked optional satellite observations. Team/project registration and official submitted status are not available. Complete the owner actions in [submission draft](submission-draft.md); see the full [requirement matrix and completion plan](requirements.md).

There is no app account backend, payment system, database migration or secret-bearing integration to audit. Browser storage belongs to each visitor. Only explicit live NASA loading and the optional map send location-dependent requests. Export is local and contains field coordinates. Public static packaging excludes repository history, credentials and local tooling.

Rollback: previous canonical Studio release `566540399ef418eb5f1226425d110e99d4fbf0b9` corresponds to hosted version 2. Repackage that release for source rollback. Audience is independent: keep the newly authorized public access unless the owner asks otherwise. Existing V2 and the earlier public Pages branch remain separate.
