# TerraPlan V3

NASA Space Apps 2026 · **Field Shift: Adapting Farms with NASA Data**

**TerraPlan supports your decision. It does not replace your judgment or local advice.**

V3 is a fresh build for small farms in western India. The planned workflow starts with the farmer's **current rotation** and compares it with two alternatives using stated rules and clearly labelled NASA evidence.

## Current status: steps 1–3

This branch implements the first three build steps in [AGENTS.md](AGENTS.md): seven routes, mobile navigation, a persistent decision-support banner, a validated field form with browser storage, and crop validation/rotation generation. It does not copy V2 application code or datasets. V2 remains in the `main` branch and the existing release history.

Field entry, saving, editable Rajkot demo loading and unranked rotation generation are available. NASA requests, climate metrics, scoring, confidence labels, timelines and scenarios are **not implemented yet**.

Choose **Start** for a blank field or **Load demo farm** for the shared Rajkot definition. Fill in the location, soil, water, equipment, market access and current crop for each season. Every season supports **Bare (no crop)**. Choose **Save field** to keep entries after reloading. Demo loading fills a draft and does not overwrite a saved field until you save it. Draft edits survive navigation between pages in the current tab, but unsaved edits do not survive a reload.

All numeric values must be finite: latitude −90…90, longitude −180…180, area greater than 0 and at most 100 hectares, and extra irrigation 0…1500 mm per season. Invalid entries show linked summary errors and inline messages. Zero is valid for coordinates and irrigation; missing values are never converted into zero.

Storage uses `terraplan.v3.field` with the envelope `{ "version": 1, "field": { ... } }`. Only this key is written; future What-if storage and unrelated keys are untouched. Corrupt, invalid or unsupported records show a recovery message and are kept unchanged until the user saves a valid replacement. Blocked storage or quota failures leave the editable draft visible and do not claim success. Browser storage is local to the origin/browser; it is not an account or a cloud backup.

The 12-crop starter contains explicitly illustrative, AI-drafted values: every row has `verified: false` and `source_note: "illustrative (AI-drafted, not verified)"`. These are not NASA measurements or verified farming advice. Fodder means fodder sorghum. Photo URLs are empty; initials serve as placeholders. Daily/monthly JSON placeholders still contain no NASA observations. The optional satellite file is absent. No missing value is shown as zero.

## Run locally

From the repository root:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

On Windows, use `python` instead of `python3` if needed. Open **http://127.0.0.1:8080/#/**. Another option from the specification is `npx serve .`.

With Python on your PATH, `npm start` serves the same root at http://127.0.0.1:3000. There is no build step, bundler, framework, application backend or npm runtime dependency.

## Routes

| Hash | Screen | Current behavior |
| --- | --- | --- |
| `#/` | Welcome | Start a field or load an editable Rajkot demo |
| `#/field` | My field | Validated form, current-rotation pickers, save/reload and recovery messages |
| `#/climate` | Your climate (NASA) | Missing/unconnected weather placeholder |
| `#/priorities` | Priorities | Placeholder for scoring priorities |
| `#/compare` | Compare rotations | Unranked generation preview, current warnings and expandable generated/excluded lists; scoring columns remain placeholders |
| `#/whatif` | What if? | Scenario and sensitivity placeholder |
| `#/evidence` | Evidence | Crop-source cards, row validation errors, glossary help and data/model limitations |

Unknown routes provide a return-to-Welcome action. Direct hashes and browser back/forward are supported. Mobile navigation can be expanded/collapsed; each route updates the title, active link and main-content focus. The decision-support message remains outside the routed content.

Glossary popups explain **KVK**, **crop rotation**, **kharif**, **rabi**, **zaid**, **irrigation in millimetres**, **coordinates** and **hectares**. They open with click/keyboard and close through the Close button or Escape. Crop-related terms have help on Evidence. The remaining climate glossary is scheduled for step 8.

## Files

```text
index.html / style.css     Shared shell and mobile-first presentation
app.mjs                    Hash navigation, field state/form events and storage adapter
field.mjs                  Shared choices/limits, validation and versioned persistence helpers
views.mjs                  Seven screen renderers and route resolution
engine.mjs                 Pure crop validation and rotation generation; MODEL constants; no scoring yet
data.mjs                   Rajkot DEMO_FARM, bundled-crop loading/validation and weather readiness states
glossary.mjs               Scaffold definitions and popup helper
data/crops.json            12 illustrative, unverified starter crops
data/demo-power-daily.json Explicit not-loaded placeholder until step 4
data/demo-power-monthly.json Explicit not-loaded placeholder
scripts/fetch-demo.mjs     Non-downloading stub until step 4
tests/                     Field validation/storage, configuration, data and routing checks
AGENTS.md                  User-supplied V3 specification, preserved verbatim
```

The downloader stub exits with a clear message and changes no files. It must not be mistaken for a completed NASA integration.

## Checks

```bash
node --test tests/
npm run check
npm run verify
```

The suite contains 28 tests. These include numeric boundary/coercion rejection, required choices, Bare seasons, a versioned save/load round trip, preservation of other stored state, corrupt records, blocked/quota-limited storage and safe rendering of field names. The original route/configuration/data checks remain. A small `tests/index.js` entrypoint makes the requested `node --test tests/` command work on Node.js 24.

The crop picker registry in `field.mjs` contains names/IDs only, with every crop available for recording the farmer's actual current rotation. It contains no agronomic values or suitability claims. The crop table uses these IDs (`rice`, `wheat`, `sorghum`, `bajra`, `maize`, `soybean`, `groundnut`, `chickpea`, `tur`, `moong`, `cotton`, `fodder`). The selected fodder is fodder sorghum. Current crops must not be silently removed for seasonal or suitability mismatches.

Generator tests check complete calendars, month wrapping, earliest valid starts, backtracking, the 12-month horizon, exclusions with reasons, input purity and retention of overlapping/off-season/Bare/missing-data current rotations. Crop validation checks every required key, ranges, types, duplicate IDs and known role tags. Data/view tests cover partial-row recovery and safe source/error rendering. Climate-parsing and scoring tests belong to later steps. Browser checks complement these unit checks.

## Crop validation and generator contract

`validateCrops(rows)` returns `{ crops, errors }`. Each error has a one-based `row` (or null for the file), crop `id` where available, and `messages`. Invalid rows are skipped; the first valid occurrence of a duplicate ID is kept. The browser loads only bundled `data/crops.json` in this step, shows validation errors on Evidence and provides retry on load failure. Schema validation does not establish scientific accuracy. Temperatures must be finite within −100…100 °C, attributes within 0…10, months/duration integers within 1…12, water need positive and finite, and roles/seasons/soil/equipment must be supported values. Metadata and booleans are required; nonempty photo URLs require HTTPS plus attribution/licence.

`generateRotations(crops, field)` returns `{ rotations, excluded }`. It validates the supplied rows, enumerates per-season crop choices plus Bare, then searches all listed starts in June-to-May order. It returns the earliest complete non-overlapping calendar per unique crop sequence, in Kharif→Rabi→Zaid order, within 12 months from the first crop's sowing. A bare Kharif requires a non-bare Rabi. Soil/equipment rules, rice on sand, and impossible calendars produce explicit exclusion reasons. Generated results have no scores, confidence or water-feasibility labels.

Every rotation has a stable ID derived from the three crop IDs (null for Bare), `seasons`, `is_current` and `warnings`. A non-bare season contains `{ crop, start, end, start_offset, end_offset }`: `crop` is the row object; `start`/`end` are calendar months 1–12 with inclusive endpoints. Offsets count months from June=0 and distinguish January of the next calendar year; the complete sequence can cross May provided it fits 12 months from its first sowing. Bare is null. Excluded rows also have a nonempty `reasons` list.

The current rotation is returned exactly once as `is_current: true`, including overlaps, off-season choices and hard-rule failures; those produce warnings. If no valid calendar exists, its earliest listed starts are shown as assumptions with warnings. Missing/invalid crop rows retain the current crop ID with `unavailable: true` and null calendar bounds. These cannot be treated as computed crop windows in later scoring. The current sequence is never duplicated among alternatives or excluded rows.

For the current illustrative Rajkot fixture: **84 retained rotations (current + 83 alternatives), 36 excluded**. This is a generator test result, not a recommendation count or evidence of water feasibility. Counts will change when the crop person replaces the starter values. The Compare preview uses current field entries, including a valid unsaved draft; use Save field for reload persistence.

## Next build step

**Step 4:** NASA POWER daily/monthly loading, caching and demo fallback, plus per-season climate metrics and fill-value handling. Do one build step per prompt, test and check the app, then commit as specified in AGENTS.md.

Public GitHub Pages deployment is scheduled for step 11. This scaffold does not replace the existing V2 live Site.

## Honesty and credits

Future scores must be relative comparisons from stated rules, never yield/profit predictions. Crop constants need local agricultural validation. NASA/model/satellite/ground sources must be distinguished when their actual integrations are added.

Planned data credits: NASA POWER (LaRC), GPM IMERG, SMAP and GRACE/GRACE-FO. None is connected in this step. No V2 photographs or external libraries are bundled in the fresh V3 scaffold. Built with help from OpenAI Codex. Team names have not been supplied yet.

Original project software is covered by [LICENSE](LICENSE). Provider data and future photos retain their own terms. Independent hackathon project; no NASA endorsement is claimed.
