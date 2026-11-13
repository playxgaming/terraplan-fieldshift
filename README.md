# TerraPlan V3

NASA Space Apps 2026 · **Field Shift: Adapting Farms with NASA Data**

**TerraPlan supports your decision. It does not replace your judgment or local advice.**

V3 is a fresh build for small farms in western India. The planned workflow starts with the farmer's **current rotation** and compares it with two alternatives using stated rules and clearly labelled NASA evidence.

## Current status: steps 1–2

This branch implements the first two build steps in [AGENTS.md](AGENTS.md): seven routes, mobile navigation, a persistent decision-support banner, and a validated field form with browser storage. It does not copy V2 application code or datasets. V2 remains in the `main` branch and the existing release history.

Field entry, saving and editable Rajkot demo loading are available. Crop generation, NASA requests, climate metrics, scoring, confidence labels, timelines and scenarios are **not implemented yet**.

Choose **Start** for a blank field or **Load demo farm** for the shared Rajkot definition. Fill in the location, soil, water, equipment, market access and current crop for each season. Every season supports **Bare (no crop)**. Choose **Save field** to keep entries after reloading. Demo loading fills a draft and does not overwrite a saved field until you save it. Draft edits survive navigation between pages in the current tab, but unsaved edits do not survive a reload.

All numeric values must be finite: latitude −90…90, longitude −180…180, area greater than 0 and at most 100 hectares, and extra irrigation 0…1500 mm per season. Invalid entries show linked summary errors and inline messages. Zero is valid for coordinates and irrigation; missing values are never converted into zero.

Storage uses `terraplan.v3.field` with the envelope `{ "version": 1, "field": { ... } }`. Only this key is written; future What-if storage and unrelated keys are untouched. Corrupt, invalid or unsupported records show a recovery message and are kept unchanged until the user saves a valid replacement. Blocked storage or quota failures leave the editable draft visible and do not claim success. Browser storage is local to the origin/browser; it is not an account or a cloud backup.

The empty crop table and daily/monthly JSON placeholders deliberately contain no observations or invented values. The optional satellite file is absent. No missing value is shown as zero.

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
| `#/compare` | Compare rotations | Your current / Option A / Option B layout; five explanation sections |
| `#/whatif` | What if? | Scenario and sensitivity placeholder |
| `#/evidence` | Evidence | Explicit data/engine readiness and limitations |

Unknown routes provide a return-to-Welcome action. Direct hashes and browser back/forward are supported. Mobile navigation can be expanded/collapsed; each route updates the title, active link and main-content focus. The decision-support message remains outside the routed content.

Glossary popups explain **KVK**, **crop rotation**, **kharif**, **rabi**, **zaid**, **irrigation in millimetres**, **coordinates** and **hectares**. They open with click/keyboard and close through the Close button or Escape. The remaining glossary is scheduled for step 8.

## Files

```text
index.html / style.css     Shared shell and mobile-first presentation
app.mjs                    Hash navigation, field state/form events and storage adapter
field.mjs                  Shared choices/limits, validation and versioned persistence helpers
views.mjs                  Seven screen renderers and route resolution
engine.mjs                 Pure, centralized MODEL constants; no scoring yet
data.mjs                   One Rajkot DEMO_FARM and explicit readiness states
glossary.mjs               Scaffold definitions and popup helper
data/crops.json            Empty until step 3
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

The suite contains 16 tests. These include numeric boundary/coercion rejection, required choices, Bare seasons, a versioned save/load round trip, preservation of other stored state, corrupt records, blocked/quota-limited storage and safe rendering of field names. The original route/configuration/data checks remain. A small `tests/index.js` entrypoint makes the requested `node --test tests/` command work on Node.js 24.

The crop picker registry in `field.mjs` contains names/IDs only, with every crop available for recording the farmer's actual current rotation. It contains no agronomic values or suitability claims. Step 3 must use these IDs when creating the crop table (`rice`, `wheat`, `sorghum`, `bajra`, `maize`, `soybean`, `groundnut`, `chickpea`, `tur`, `moong`, `cotton`, `fodder`). The selected fodder is fodder sorghum. Current crops must not be silently removed for seasonal or suitability mismatches.

There are no generator, crop-validation, climate-parsing or scoring tests yet; those implementations belong to later steps. Browser route/menu checks complement these unit checks and are recorded in the step's completion report.

## Next build step

**Step 3:** crop table, crop validation and rotation generation with exclusion reasons and retention of the current rotation. Do one build step per prompt, test and check the app, then commit as specified in AGENTS.md.

Public GitHub Pages deployment is scheduled for step 11. This scaffold does not replace the existing V2 live Site.

## Honesty and credits

Future scores must be relative comparisons from stated rules, never yield/profit predictions. Crop constants need local agricultural validation. NASA/model/satellite/ground sources must be distinguished when their actual integrations are added.

Planned data credits: NASA POWER (LaRC), GPM IMERG, SMAP and GRACE/GRACE-FO. None is connected in this step. No V2 photographs or external libraries are bundled in the fresh V3 scaffold. Built with help from OpenAI Codex. Team names have not been supplied yet.

Original project software is covered by [LICENSE](LICENSE). Provider data and future photos retain their own terms. Independent hackathon project; no NASA endorsement is claimed.
