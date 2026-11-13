# Changelog

## V3 Field Studio — separate visual release — 2026-11-13

- Added a refined sidebar workspace, locally bundled typography and a field-first overview, with an original interactive WebGL farm, reduced-motion/visibility handling and a static fallback.
- Added twelve representative crop-photo entries with Commons source links and per-image attribution/licence, without changing crop values or verification flags.
- Improved mobile menu/tool placement, Compare density, relative-score visibility and direct plan jumps; source details and all five explanation sections remain available.
- Rechecked all seven routes, validation, scoring, priorities, stale-weather protection, scenario persistence, regional labels and printing. Added two source/scene tests (99 total) and retained rendered design evidence.
- Studio uses a separate branch and Site; the earlier V2 and public V3 publications remain unchanged.

## V3 — step 12 optional field map, regional labels and print — 2026-11-13

- Added an opt-in Leaflet 1.9.4 field-location pin with integrity-pinned CDN files, OpenStreetMap attribution, keyboard centre selection, manual-coordinate sync and failure/retry states. Picks remain unsaved until Save field; route changes dispose maps and ignore stale loads.
- Added Hindi, Gujarati and Marathi navigation/crop labels alongside English without rebuilding field forms or changing crop IDs, priorities or experiments. Stored label preference has validation/recovery.
- Added browser printing with field/source context, wrapping timelines, preserved warnings and temporary disclosure expansion/restoration.
- Added seven tests for catalog coverage, label storage, coordinate bounds, map lifecycle/loading failures and print-state restoration (97 total). Extended the public artifact allowlist.

## V3 — step 11 accessibility and Pages deployment — 2026-11-13

- Audited mobile routes and keyboard controls; added consistent glossary hit areas and focus indicators for scrolling tables.
- Kept fractional entered irrigation intact in the experiment controls and rejected wrong-location POWER data in satellite cross-checks.
- Updated setup, feature, dataset, scenario and limitation documentation. Added allowlisted Pages packaging with a source-commit manifest and a deployment-content test.
- Added a pinned-actions workflow that verifies before publishing the V3 branch. Main and the V2 live Site remain unchanged.

## V3 — step 10 What-if and historical sensitivity — 2026-11-13

- Added validated rain, temperature and absolute seasonal irrigation sliders, saved separately from the field with recovery from invalid/blocked storage.
- Recomputed the same baseline current/A/B plans under active experiment settings, without silently selecting replacement alternatives.
- Added four agricultural-year scores with best/worst available years, missing totals and water/confidence warnings. Original NASA records, baseline scores and field entries stay unchanged.
- Added pure perturbation, input validation, persistence, numeric recalculation, fixed-ID, purity and missing-year tests.

## V3 — step 9 satellite evidence — 2026-11-13

- Added optional Rajkot IMERG, SMAP and GRACE cards and Evidence source entries, with a not-loaded manifest instead of invented values.
- Validated location, retrieval time, HTTPS/DOI provenance and per-product series; invalid products are independently skipped.
- Added same-month IMERG/POWER comparisons only for complete rain months. GRACE is labelled total water-storage context, not a well measurement.

## V3 — step 8 climate cards and trends — 2026-11-13

- Added six sourced cards for each current crop window and independently complete-year OLS rain/Tmax trends with annual audit tables.
- Disclosed the monthly SUM unit discrepancy, retained sum values without multiplying by days, and checked all 31 overlapping complete demo months against daily rain.
- Added plain-language climate glossary and missing/unsupported-unit safeguards. Added four climate tests.

## V3 — step 7 crop timelines — 2026-11-13

- Added pure twelve-cell June–May timelines to current and both populated alternatives, with crop colours, hatched Bare months and native keyboard-accessible month disclosures.
- Added historical heat, assumed-flowering heat, cold, dry-spell and heavy-rain markers with source labels, per-crop counts and explicit model assumptions. Heavy rain does not claim confirmed flooding.
- Tracked qualifying dry runs across month boundaries; missing days break runs and missing weather stays unknown.
- Preserved overlapping current crops and unknown calendars; explained windows outside the display without wrapping them backward. Timeline presentation leaves scoring and option selection unchanged.
- Added 12 timeline tests (75 total). Full climate cards and monthly trends remain step 8.

## V3 — step 6 explained three-column comparison — 2026-11-13

- Replaced comparison placeholders with current / Option A / Option B, assumed crop windows, photo/initial placeholders, scores, confidence reasons and water warnings.
- Added the five ordered sections per column: Why, NASA evidence, Benefits, Information gaps and local checks. Missing alternatives remain explicit empty places.
- Added pure badge and advice derivation, inclusive 85% water/10-point market thresholds, cyclic family checks and unique-month coverage counts; badge explanations distinguish rule matches from measured outcomes.
- Added a semantic sortable all-rotations table that retains infeasible/unscored/current rows, keeps missing values last and never changes selected options. Exclusions retain every reason.
- Reused current scoring state so field/priority edits derive fresh option IDs. Sorting preserves focus and leaves field, priority and What-if state alone.
- Added 10 comparison tests (63 total) for boundaries, gaps, section order, fallback/missing states, sorting, purity and escaped output. Timeline work remains step 7.

## V3 — step 5 scoring, feasibility, confidence and priorities — 2026-11-13

- Added pure seasonal fits, weakest-season weighted climate fit, six normalized priorities, cyclic rule adjustments with reasons and bounded relative scores.
- Added strict water-gap feasibility, confidence levels with explanations and retention of infeasible/unscored/current rows.
- Added feasible-first comparison-candidate selection with labelled infeasible fallback; the full comparison display remains step 6.
- Added six accessible 0–5 sliders, tab-local weights, reset and an immediately updated ranking preview that preserves the range controls/focus.
- Cached weather-dependent scoring preparation; weight changes recompute only the ranking component. Field saves and route changes preserve weights and leave What-if storage alone.
- Printed model constants and formulas on Evidence with illustrative labels. Starter crop values remain unverified and all starter-based confidence is Low.
- Added 13 scoring/view tests (53 total): arithmetic, weakest season, Bare normalization, priority reversals, zero weights, rule reasons, thresholds, confidence, candidate fallback, clamps, unknowns and purity.

## V3 — step 4 NASA climate loading and offline fallback — 2026-11-13

- Added user-triggered daily/monthly POWER requests, 20-second aborts, validated versioned caches and live→cache→matching-Rajkot-bundle fallback.
- Downloaded real Rajkot daily records for June 2022–May 2026 and monthly records for 1991–2024, preserving provider responses and request/retrieval metadata.
- Replaced the downloader stub with a Node script that validates both requests before replacing existing bundles.
- Added null handling for −999/absent days and monthly parsing that excludes annual month-13 entries; raw monthly values and provider units are retained without trend calculations.
- Added pure seasonal metrics with complete-day counts, conservative missing-day handling, dry-spell breaks, partial-rain labels and leap/year-wrap handling.
- Added basic current-crop metric previews, explicit bundled-demo mode, stale-location protection and per-dataset provenance on Evidence.
- Added 12 weather tests (40 total), including a clearly synthetic test-only fixture, cache/bundle recovery, aborts, wrong-location/range rejection and monthly-only failure.
- Scoring remains step 5; full climate cards and trends remain step 8. Monthly PRECTOTCORR_SUM provider metadata currently reports mm/day; this step preserves raw values and does not infer a trend or apply a unit conversion.

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
