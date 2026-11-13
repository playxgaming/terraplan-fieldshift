# Changelog

## V3 — step 3 crop validation and rotation generation — 2026-11-13

- Replaced the original empty crop placeholder with the 12 requested starter crops, using fodder sorghum. Every row is explicitly AI-drafted, illustrative and unverified, with no photo URL.
- Added pure crop-schema validation, skipped-row diagnostics, local JSON loading and a retry state.
- Added pure rotation generation with earliest complete calendars, inclusive month windows, year wrapping, deduplication and explicit calendar/soil/equipment exclusions.
- Retained the farmer's current sequence exactly once, including overlaps, off-season crops, bare seasons and missing crop rows, with warnings instead of exclusions.
- Added an unranked generation preview and expandable excluded list; Evidence shows per-row assumptions, source labels, errors and crop glossary help.
- Added calendar, purity, schema, loader and view tests. The Rajkot fixture produces current + 83 alternatives, with 36 excluded sequences; these are illustrative rule outputs, not recommendations.
- NASA loading, scoring, Option A/B selection and the full comparison remain in their subsequent build steps.

## V3 — step 2 field entry and saving — 2026-11-13

- Added labelled field inputs, a soil-report checkbox, seasonal irrigation and current-crop pickers including Bare.
- Enabled editable Rajkot demo loading on Welcome and My field without automatically replacing the saved field.
- Added centralized numeric limits, inline/linked summary errors and rejection of empty/nonfinite/out-of-range values.
- Added validated, versioned field storage, recovery messages for corrupt/blocked storage and preservation of other storage keys.
- Kept drafts through route changes; explicit saves survive reloads. Added field and season glossary help.
- Added seven field tests (16 total) covering boundaries, persistence, error recovery, scenario preservation and escaped rendering.
- Crop generation, NASA retrieval, scoring and scenarios remain scheduled for subsequent steps.

## V3 — step 1 scaffold — 2026-11-13

- Started a fresh root-level HTML/CSS/ES-module application from the supplied AGENTS.md.
- Added seven routes, responsive navigation, unknown-route recovery and the shared decision-support banner.
- Added honest placeholder screens, the single Rajkot demo definition and not-loaded JSON placeholders.
- Added nine scaffold tests, syntax/JSON checks and initial KVK/rotation glossary popups.
- Field entry, persistence, crop generation, NASA retrieval, scoring and deployment are deferred to their specified build steps.
- V2 application code and assets remain available in main/history and were not copied into the V3 runtime.

## 2.1.0 — GitHub project packaging — 2026-11-13

- Added a standalone GitHub distribution, project metadata, dependency-free Node preview, npm scripts and lockfile.
- Added CI, static project checks, two HTTP preview tests, issue forms and pull-request template.
- Added model, architecture, data, testing, deployment and roadmap docs, plus the independent AI review handoff.
- Added a preview screenshot, MIT license for original code, and separate third-party photo/data notices.
- The application calculations, browser storage schema and existing Sites deployment are unchanged by repository packaging.

## V2.1 visual update — 2026-11-12

- Added an interactive WebGL farm with orbit, color, pause/reset and reduced-motion handling.
- Added seven crop photos, detail dialogs and attribution views.
- Calculation model remained `2.0.0`; saved-plan schema remained `2`.

## V2 workspace — 2026-11-12

- Added multiple fields, four-year weather history, both-season screening, scenarios, evidence, saved snapshots and comparisons.
- Added eight domain/storage/data tests and documented validation boundaries.

## Initial prototype — 2026-11-12

- Built an initial NASA POWER-based rotation explorer for the Field Shift challenge.

These are project-development milestones, not claims of agronomic validation or formal prior GitHub releases.
