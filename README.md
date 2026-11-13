# TerraPlan V3 · Field Studio

Studio: [TerraPlan V3 · Field Studio](https://terraplan-v3-studio.sarveshsehra1.chatgpt.site). This separate Site uses owner-private access, matching the earlier Site.

The separately hosted Studio redesign lives on `codex/terraplan-v3-studio`. The original public V3 Pages site and earlier V2 Site remain unchanged. Studio adds a refined planning workspace, an original animated WebGL field and sourced crop photographs while preserving V3 calculations. See [the UI/UX and regression review](docs/design-studio/review.md).

NASA Space Apps 2026 · **Field Shift: Adapting Farms with NASA Data**

**TerraPlan supports your decision. It does not replace your judgment or local advice.**

V3 is a fresh build for small farms in western India. The planned workflow starts with the farmer's **current rotation** and compares it with two alternatives using stated rules and clearly labelled NASA evidence.

## Current status: steps 1–12

This branch implements the all twelve build steps in [AGENTS.md](AGENTS.md): seven routes, mobile navigation, a persistent decision-support banner, a validated field form with browser storage, crop validation/rotation generation, NASA POWER loading with offline demo fallback, a relative scoring/priority preview, and the explained three-column comparison with crop timelines, full climate cards and What-if sensitivity. It does not copy V2 application code or datasets. V2 remains in the `main` branch and the existing release history.

Field entry, saving, editable Rajkot demo loading, unranked rotation generation, NASA POWER loading/caching and per-crop climate metrics are available. The Priorities page now scores rotations with water-feasibility labels and confidence reasons. Compare now displays current / Option A / Option B, potential-benefit badges, information gaps, local checks and a sortable table. June–May crop timelines now show historical weather markers and known Bare months. Climate cards, complete-year monthly trends, optional satellite evidence and What-if sensitivity are now implemented. Satellite observations have not been supplied; the cards show **Not loaded yet**.

Choose **Start** for a blank field or **Load demo farm** for the shared Rajkot definition. Fill in the location, soil, water, equipment, market access and current crop for each season. Every season supports **Bare (no crop)**. Choose **Save field** to keep entries after reloading. Demo loading fills a draft and does not overwrite a saved field until you save it. Draft edits survive navigation between pages in the current tab, but unsaved edits do not survive a reload.

All numeric values must be finite: latitude −90…90, longitude −180…180, area greater than 0 and at most 100 hectares, and extra irrigation 0…1500 mm per season. Invalid entries show linked summary errors and inline messages. Zero is valid for coordinates and irrigation; missing values are never converted into zero.

Storage uses `terraplan.v3.field` with the envelope `{ "version": 1, "field": { ... } }`. Field saves write only this key. Weather requests write their own versioned cache keys; future What-if storage and unrelated keys are untouched. Corrupt, invalid or unsupported records show a recovery message and are kept unchanged until the user saves a valid replacement. Blocked storage or quota failures leave the editable draft visible and do not claim success. Browser storage is local to the origin/browser; it is not an account or a cloud backup.

The 12-crop starter contains explicitly illustrative, AI-drafted values: every row has `verified: false` and `source_note: "illustrative (AI-drafted, not verified)"`. These are not NASA measurements or verified farming advice. Fodder means fodder sorghum. The scientific crop rows retain empty photo URLs; a separate representative-photo registry supplies licensed imagery without changing crop inputs. The daily and monthly demo files now contain actual NASA POWER responses plus retrieval metadata. The optional satellite file is a not-loaded manifest, with no invented observations. No missing value is shown as zero.

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
| `#/climate` | Your climate (NASA) | Explicit live/bundle loading, source labels, current-crop cards, annual trends, optional satellite summaries, missing-data notes and retry |
| `#/priorities` | Priorities | Six weights, live ranking preview, current score, water labels and confidence/rule reasons |
| `#/compare` | Compare rotations | Current / Option A / Option B, crop timelines, ordered explanations, badges, sortable retained-rotation table and exclusions |
| `#/whatif` | What if? | Rain/temperature/irrigation experiments on fixed comparison plans; four historical-year scores and best/worst |
| `#/evidence` | Evidence | Crop assumptions plus weather request URLs, retrieval times, source labels, parameter metadata and limitations |

Unknown routes provide a return-to-Welcome action. Direct hashes and browser back/forward are supported. Mobile navigation can be expanded/collapsed; each route updates the title, active link and main-content focus. The decision-support message remains outside the routed content.

Glossary popups explain **KVK**, **crop rotation**, **kharif**, **rabi**, **zaid**, **irrigation in millimetres**, **coordinates** and **hectares**. They open with click/keyboard and close through the Close button or Escape. Crop-related terms have help on Evidence. Climate, satellite and sensitivity terms are also available.

## Files

```text
index.html / style.css     Shared shell and mobile-first presentation
app.mjs                    Hash navigation, field state/form events and storage adapter
field.mjs                  Shared choices/limits, validation and versioned persistence helpers
views.mjs                  Seven screen renderers and route resolution
engine.mjs                 Pure crop validation/generation, seasonClimate, fit, scoring and ranking; centralized MODEL constants
data.mjs                   Crop loading plus POWER requests, parsing, caching and demo fallback
glossary.mjs               Scaffold definitions and popup helper
data/crops.json            12 illustrative, unverified starter crops
data/demo-power-daily.json Actual POWER daily response: June 2022–May 2026
data/demo-power-monthly.json Actual POWER monthly response: 1991–2024
scripts/fetch-demo.mjs     Validated NASA downloader; refreshes both demo bundles
tests/                     Field validation/storage, configuration, data and routing checks
AGENTS.md                  User-supplied V3 specification, preserved verbatim
```

The downloader validates both responses before replacing the existing files. Request failures leave the previous bundles intact. No API key is needed.

## Checks

```bash
node --test tests/
npm run check
npm run verify
```

The suite contains 99 tests. These include numeric boundary/coercion rejection, required choices, Bare seasons, a versioned save/load round trip, preservation of other stored state, corrupt records, blocked/quota-limited storage and safe rendering of field names. The original route/configuration/data checks remain. A small `tests/index.js` entrypoint makes the requested `node --test tests/` command work on Node.js 24.

The crop picker registry in `field.mjs` contains names/IDs only, with every crop available for recording the farmer's actual current rotation. It contains no agronomic values or suitability claims. The crop table uses these IDs (`rice`, `wheat`, `sorghum`, `bajra`, `maize`, `soybean`, `groundnut`, `chickpea`, `tur`, `moong`, `cotton`, `fodder`). The selected fodder is fodder sorghum. Current crops must not be silently removed for seasonal or suitability mismatches.

Generator tests check complete calendars, month wrapping, earliest valid starts, backtracking, the 12-month horizon, exclusions with reasons, input purity and retention of overlapping/off-season/Bare/missing-data current rotations. Crop validation checks every required key, ranges, types, duplicate IDs and known role tags. Data/view tests cover partial-row recovery and safe source/error rendering. Weather tests cover fill values, absent dates, a known dry spell, all-missing windows, leap years, year wrapping, request ranges, timeout/body aborts, source fallback, cache corruption, wrong-location/range rejection, blocked storage, monthly failure and safe missing-value/provenance rendering. All tests run without network access. Scoring tests cover exact fit arithmetic, weakest-season weighting, Bare normalization, priority order changes, all-zero weights, cyclic rule reasons, cover/feasibility boundaries, confidence causes, fallback selection, missing totals, score clamps and purity. Browser checks complement these unit checks.

## Crop validation and generator contract

`validateCrops(rows)` returns `{ crops, errors }`. Each error has a one-based `row` (or null for the file), crop `id` where available, and `messages`. Invalid rows are skipped; the first valid occurrence of a duplicate ID is kept. The browser validates bundled `data/crops.json`, shows errors on Evidence and provides retry on load failure. Schema validation does not establish scientific accuracy. Temperatures must be finite within −100…100 °C, attributes within 0…10, months/duration integers within 1…12, water need positive and finite, and roles/seasons/soil/equipment must be supported values. Metadata and booleans are required; nonempty photo URLs require HTTPS plus attribution/licence.

`generateRotations(crops, field)` returns `{ rotations, excluded }`. It validates the supplied rows, enumerates per-season crop choices plus Bare, then searches all listed starts in June-to-May order. It returns the earliest complete non-overlapping calendar per unique crop sequence, in Kharif→Rabi→Zaid order, within 12 months from the first crop's sowing. A bare Kharif requires a non-bare Rabi. Soil/equipment rules, rice on sand, and impossible calendars produce explicit exclusion reasons. The generator returns calendars without scores. The scoring stage adds scores, confidence and water-feasibility labels after matching climate is loaded.

Every rotation has a stable ID derived from the three crop IDs (null for Bare), `seasons`, `is_current` and `warnings`. A non-bare season contains `{ crop, start, end, start_offset, end_offset }`: `crop` is the row object; `start`/`end` are calendar months 1–12 with inclusive endpoints. Offsets count months from June=0 and distinguish January of the next calendar year; the complete sequence can cross May provided it fits 12 months from its first sowing. Bare is null. Excluded rows also have a nonempty `reasons` list.

The current rotation is returned exactly once as `is_current: true`, including overlaps, off-season choices and hard-rule failures; those produce warnings. If no valid calendar exists, its earliest listed starts are shown as assumptions with warnings. Missing/invalid crop rows retain the current crop ID with `unavailable: true` and null calendar bounds. These cannot be treated as computed crop windows in later scoring. The current sequence is never duplicated among alternatives or excluded rows.

For the current illustrative Rajkot fixture: **84 retained rotations (current + 83 alternatives), 36 excluded**. This is a generator test result, not a recommendation count or evidence of water feasibility. Counts will change when the crop person replaces the starter values. The Compare preview uses current field entries, including a valid unsaved draft; use Save field for reload persistence.

## NASA loading and offline use

1. Load the Rajkot demo or complete your own field. Save it if you want it to survive a reload.
2. Open **Your climate**. **Load NASA climate** sends coordinates rounded to two decimal places to NASA POWER and loads daily/monthly records. Requests are user-triggered, with a 20-second timeout covering headers and response body.
3. **Use bundled demo data** is available at the Rajkot point. It fetches local JSON and sends no NASA request. Serve the project locally to demonstrate this without internet access. This is an offline NASA-data fallback, not a service worker or a guarantee that an uncached site shell can open offline.
4. Evidence lists each dataset independently as live, browser cache or demo bundle, with original URL/retrieval time, provider units, date range and fallback reason. Switching locations hides old metrics until weather is loaded for the new point.

Daily parameters: `PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,GWETROOT,GWETTOP`. For agricultural year Y, the requested range is June 1 of Y−3 through May 31 of Y+1. The default Y follows the specification: current month ≥ July gives current year−1; January–June gives current year−2. Dates use UTC calendar arithmetic while the provider's default daily data time standard is LST (recorded in metadata).

Monthly parameters: `PRECTOTCORR_SUM,T2M_MAX`, 1991–2024. Parsing emits 408 monthly entries and skips month 13 (annual values). Raw sums and provider units are retained. The downloaded API metadata labels `PRECTOTCORR_SUM` as `mm/day`; the monthly accumulation is used directly in mm, following the NASA POWER GIS variable definition and a cross-check against every overlapping complete daily month. The discrepancy is explicitly disclosed on the cards and Evidence; do not multiply the SUM by days. Missing values, including −999 and absent dates, become null.

Fallback order is **live → validated cache → matching Rajkot bundle**. Cache keys include temporal level, coordinates rounded to two decimal places, start and end dates; records are versioned and checked against request URL, location and range before use. Cache fallback keeps the original retrieval time. Corrupt cache bytes are left untouched when a fallback is used. A bundle for another point or date range is rejected. Monthly failure is reported separately while daily data remain usable. Storage quota/blocking errors do not hide successful live data.

The bundled daily response covers **2022-06-01 through 2026-05-31** (1,461 daily entries); the monthly file covers **1991–2024**. NASA responses are preserved with `_terraplan` metadata (request URL, point, range, version and retrieval timestamp). Refresh them with:

```bash
node scripts/fetch-demo.mjs --year 2025
# Or omit --year to use the latest complete agricultural year.
```

When the default agricultural year advances, regenerate the daily bundle; the app will not silently use an old range as current data.

`seasonClimate(climate, window, crop)` is pure. It uses the crop window's inclusive calendar months/June-based offsets and returns rain, heat/cold-day counts, heavy-rain days, longest known dry spell, mean root-zone wetness, complete-day count and missing-day count. A day is used only when all six required daily values are valid; this conservative policy keeps every metric on the same denominator for step 5. Missing days break dry spells. Rain totals are labelled partial when any days are omitted. All-missing metrics are null, not zero. Bare returns null; unknown crop windows return unavailable metrics with a reason. Windows extending beyond the fetched period report missing days rather than reusing another year's data.

The small test fixture is explicitly synthetic and lives only in `tests/fixtures/power-small.json`. Demo files under `data/` contain the real downloads. The fixture's expected June metrics are 205 mm partial rain, 2 heat days, 1 cold day, 2 heavy-rain days, a 10-day dry spell, 27 complete days and 3 missing days.

NASA references: [daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/), [monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/), [data methodology/FAQ](https://power.larc.nasa.gov/docs/faqs/data/). POWER area patterns are not field measurements; soil wetness is a MERRA-2 model value. Crop thresholds remain illustrative. Full climate cards and complete-year trends are available on Your climate.

## Scoring and priority preview

Open **Priorities** after loading matching weather. Six labelled range inputs set water use, forage, nitrogen fixation, erosion control, organic matter and market weights from 0 to 5 (default 3). Changes update scores and ordering immediately, without replacing the controls or losing keyboard focus. Reset priorities restores 3. Weights are tab-local state: they survive route changes and field saves, reset on reload, and do not write or clear field/What-if storage.

The current rotation is always kept. Every alternative remains in the ranking, including infeasible and unscored rows. Each scored row shows total, climate fit, priority component, rule adjustment, water label and confidence. Expand its reasons for seasonal water calculations, individual adjustments, confidence reasons and current-rotation warnings. Excluded calendars remain in a separate expandable list with reasons. Compare uses the same scoring result to show current and the two derived options, with full explanation sections.

The pure engine exposes:

- `seasonFit(metrics, crop, irrigation)` for the specified rain/water/heat/cold formulas and strict water-gap rule.
- `prepareScoring(generated, field, climate)` for cached per-window metrics, normalized crop priorities, climate fit, feasibility, confidence and rule reasons. This stage does not depend on weights.
- `rankRotations(prepared, weights)` for the weighted component, bounded total, deterministic ordering and the two derived comparison options.
- `scoreRotations(generated, field, climate, weights)` as the combined convenience call.
- `benefitBadges(rotation, current)`, `bareMonthCount(rotation)` and `rotationAdvice(rotation, field, climate)` for pure benefit/gap/local-check derivation.

Climate fit is half the mean plus half the minimum active-season fit. Bare is omitted from the climate fit but counts as zero in the three-slot crop-attribute priority averages. The water-priority denominator is the largest total crop water need among all retained rotations, including current. All-zero weights produce a priority component of 50; climate and rule adjustments remain active. Totals are clamped to 0–100 and are never yield/profit predictions.

Rules check cyclic adjacent slots, including Zaid→next Kharif; Bare breaks adjacency. Each same-family pair subtracts 8; a nitrogen fixer immediately after a heavy feeder adds 6. A Bare season subtracts 6 if an allowed retained crop window for that season reaches water fit ≥60. Cover possibility is a season-level check across field-allowed generated calendars, independent of weights; a warned current-only crop is not evidence that an alternative is allowed.

A water gap **greater than 40%** of crop need makes a rotation infeasible; exactly 40% passes. Passing the water rule does not establish local suitability. Infeasible rows stay visible. Comparison-candidate selection prefers the two highest-scoring passing alternatives, then fills missing places with the best scored infeasible ones and keeps their warning. It never selects current or fabricates missing totals.

Any active window without a computable fit leaves the total null/Not scored; all-Bare and missing-crop current plans remain visible with Low confidence. Partial weather is scored from complete days with missing-data reasons. Confidence is High for complete/verified/regional crop windows with a soil test, Medium with soil type only, and Low for unverified/non-regional crops, missing weather or crops outside listed seasons/start months. Every label includes reasons. All current starter-based results are Low because every starter crop has `verified: false`.

For the bundled Rajkot data and default weights, tests currently produce a **56.35 current score**, **77 scored alternatives** and **6 unavailable totals** (windows outside the loaded weather range). These are outputs of illustrative rules and crop assumptions; changing weights, water entries or crop data changes them. Evidence prints every MODEL constant with an illustrative tag and explains the formulas.

## Full comparison

Load matching weather, adjust weights on Priorities if desired, then open **Compare rotations**. The current rotation and derived Option A/B each show seasonal crop names and assumed sowing–harvest months, a crop photo or clearly labelled initial placeholder, relative total, confidence reasons and water-feasibility labels. The current rotation keeps all warnings. Missing options get explicit empty columns, not fabricated crops or zero scores. Before weather loads, current crop inputs remain visible without calculated scores; stale-location weather is not used.

Each column always has these five sections in order: **Why**, **Evidence (NASA numbers)**, **Benefits**, **Information gaps**, **Check locally (KVK / agri officer)**. Evidence includes crop-window rain, heat/cold days, longest known dry spell, heavy-rain days, model root-zone wetness, complete/missing days and derived usable water/gap. NASA source/retrieval time and crop/model/irrigation provenance stay explicit. Missing weather remains Missing; partial rain is labelled partial.

Badges are native keyboard-accessible disclosures with one-line explanations on tap/click and hover titles. Rules are: crop water need ≤85% of current; a nitrogen-fixer role; no cyclic consecutive same-family pair and at least one new family; a cover/deep-rooted role with fewer assumed Bare months; market priority ≥current+10. These describe potential matches to illustrative rules, not measured water savings, nitrogen, pest control, infiltration or profit. Unknown calendars prevent a Bare-month comparison. Coverage is counted as unique months so overlaps cannot inflate cover; this badge count is independent of the June–May display.

Gap/check text identifies unverified or missing crop values, missing weather days, lack of soil test, coarse POWER coverage, assumed crop dates and absent local prices. Local checks name the crop and sowing month and, where known, each season's additional water gap beyond entered irrigation. Advice is a prompt to verify locally, not an instruction to plant.

**See all rotations** opens a semantic sortable table containing current and every retained alternative, including infeasible and unscored rows. It marks current/A/B, exposes sort direction to assistive technology, preserves missing values last in both directions and keeps keyboard focus on the chosen sort button. Table sorting changes presentation only; it cannot change selected A/B or scores. On 360-pixel screens the columns stack and the table scrolls within its own labelled region. The **Excluded** disclosure lists every excluded calendar with its reasons. When weather has not loaded, the table still lists known calendars with unavailable numerical columns.

Option IDs are derived anew from the current scoring result, so editing field entries or priorities cannot retain obsolete selected IDs. Sorting and page navigation do not clear priority weights or field/What-if storage. Timeline markers update from the same current rotations and matching weather.

## Crop timelines

Each populated comparison has twelve June–May cells. Crop names and colours identify occupied months; known Bare months have hatching and a text label. Scroll the labelled region horizontally and open any month with a tap, click or keyboard to see per-crop counts, missing days and qualifying dry-run dates. Overlapping current crops remain visible together. Unknown crop calendars cannot create false Bare months. Crops extending beyond May are explained and are never wrapped onto the first June.

`buildTimeline(rotation, climate)` is pure. Each cell contains `month`, `crop`, `bare` and `flags`, with calendar year, overlapping crops, per-crop assessments and data status. Flags use complete historical daily records, the same six required parameters as seasonal metrics, and illustrative crop temperature thresholds. Heat needs at least 3 days above the threshold; cold needs 2 below; heavy rain needs 1 day at or above 64.5 mm. The internal `flood` flag is labelled **Heavy rain** in the UI: it does not establish flooding. Heat at flowering additionally needs the assumed month `start + floor(duration × 0.6)`, never observed flowering.

A known dry run needs at least 10 consecutive days below 2.5 mm inside that crop window. Every month touched by the qualifying run is marked, including runs crossing a month boundary. Missing days break runs. Missing weather stays unknown rather than zero; no weather flag is placed in a Bare month. Markers describe historical area weather under rules, not forecasts or confirmed crop damage. Timeline tests cover threshold boundaries, cross-month runs, missing records, leap years, unknown calendars, overlap, year clipping, safe rendering and unchanged demo scoring.

## Climate and satellite evidence

Your climate shows six cards per active current crop: rainfall, heat/cold days, longest known dry spell, heavy-rain days and model root-zone wetness. Each has a plain explanation, source/retrieval label, grid resolution and glossary help. Crop thresholds and calendars remain illustrative. Bare seasons have no crop-specific metrics.

Long-term trends cover calendar years 1991–2024, separately from agricultural years. Rain uses the sum of twelve monthly accumulations; Tmax uses the mean of twelve monthly values. Each series drops an incomplete year independently. Ordinary least-squares slope against the actual years is multiplied by ten; at least two complete years are needed. The cards list all years used and provide an annual audit table. No statistical significance or forecast is claimed. NASA metadata reference: [POWER monthly variable definitions](https://gis.earthdata.nasa.gov/portal/rest/services/POWER/POWER_MONTHLY_METEOROLOGY_LST/ImageServer/multiDimensionalInfo).

`data/demo-satellite.json` is an explicit not-loaded manifest. Replace it with the sourced team dataset described in AGENTS.md §9.4. The loader requires a matching Rajkot location, valid retrieval time and HTTPS/DOI sources, and skips invalid products independently. Cards never apply Rajkot values to another field. IMERG/POWER differences require complete, same-location monthly rain records; SMAP anomalies show supplied units or a missing-unit note; GRACE is total water-storage context, not isolated groundwater or a well measurement. Satellite values do not change scores.

## What-if experiments

Load field weather, select priorities and open What if?. Rain ranges from −50% to +30%; added temperature from 0 to 3 °C affects daily mean/minimum/maximum; seasonal irrigation ranges from 0 to 1500 mm as an absolute amount. These controls operate on copies. Missing values stay missing and soil wetness stays unchanged. No crop-growth or hydrological response is simulated.

The three plans are the baseline current/A/B for the present field and priorities. Their IDs remain fixed during experiments and across all four available agricultural years; a worsening result cannot silently select a replacement. The table applies the active settings in every historical year, retains missing scores and water warnings, and reports best/worst years among available totals. This is sensitivity analysis, not a forecast or yield/profit prediction.

Validated settings are stored separately as `{version:1,scenario:{rain_pct,temperature_c,irrigation_mm}}` under `terraplan.v3.whatif`. Field saving does not reset them. Reset uses the current field irrigation and zero weather change. Invalid stored bytes are preserved with a recovery notice; blocked storage leaves tab edits usable without claiming they were saved. Priority weights remain tab-local.

## Optional map, regional labels and printing

My field includes **Open field map**. Opening it loads integrity-pinned Leaflet 1.9.4 CSS/JS from unpkg and visible map tiles from OpenStreetMap. Those services receive normal browser request details and the viewed map area. No map requests occur before opening, and no geolocation permission is requested. The map has visible attribution and uses normal browser tile caching without bulk downloads. Coordinate entry remains available if the map cannot load.

Click to position the pin, or focus the map, pan with arrow keys and choose **Use map centre as field location**. **Show entered coordinates** centres on the current inputs. Picks change the unsaved form only; Save field still controls persistence. Empty or invalid coordinates never turn into a zero-location pin. Locations outside the map projection keep their typed coordinates and show a coverage message. The pin represents a point, not a field boundary, soil test or NASA grid. Navigation disposes of the map and ignores stale loading results.

The header selector adds Hindi, Gujarati or Marathi navigation and crop names alongside English. This is partial localization; explanations, evidence, warnings and technical terms remain English. Regional names are starter labels and should be reviewed by a local speaker. Labels do not change crop IDs, inputs, scores, priority weights or What-if settings. The language preference uses its own versioned `terraplan.v3.labels` key; invalid stored bytes are retained with a recovery message. Maps remain open and field drafts remain editable during a language change.

**Print this page** uses the browser print/Save as PDF dialog, including Ctrl+P. The print header includes the field, current priority weights, print time and page URL. It keeps decision-support warnings, scores, sources and limitations; comparison confidence and benefit explanations open temporarily and restore after printing or cancellation. Timelines wrap into twelve visible cells; map tiles, navigation and controls are omitted. The comparison printout focuses on current/A/B; full retained/excluded lists remain online. Printing does not change saved fields, labels or experiments. The browser controls paper size, margins and PDF output.

## Deployment and verification

Public site: [TerraPlan V3 on GitHub Pages](https://playxgaming.github.io/terraplan-fieldshift/). Repository source stays private; the existing V2 Site and main branch are preserved. Studio is hosted separately through Sites and does not trigger the existing Pages branch workflow. The workflow publishes the `codex/terraplan-v3` branch after verification. Each deployed artifact includes `build-info.json` with its source commit and version.

`npm run package:site` creates a fresh `.pages-dist` directory containing only allowlisted app modules, public demo JSON, licence and build metadata. It refuses to reuse an existing output directory. No repository history, instructions, tests, credentials or private hosting files are published. All imports and asset URLs are relative so project-site paths work. No build or runtime dependency is required.

The 99-test suite checks prior field/generator/scoring/timeline contracts plus trend arithmetic and units, satellite provenance/location boundaries, scenario validation/storage/purity/fixed IDs, exact historical recalculation and deployment contents. Browser verification covers the demo flow, 360 px reflow, desktop columns, keyboard ranges, native month disclosures, horizontal data regions, glossary dismissal/focus and route/menu labels. Full certification with every screen reader/device is not claimed.

Steps 1–12 are implemented, including the optional map, regional labels and print view. Crop values and satellite observations still need the data/agronomy team; Studio supplies a separate registry of twelve representative crop-image entries, with source and licence links on Evidence. Scientific crop values remain unchanged.

## Honesty and credits

Scores must be relative comparisons from stated rules, never yield/profit predictions. Crop constants need local agricultural validation. NASA/model/satellite/ground sources must be distinguished when their actual integrations are added.

Connected data: NASA POWER (LaRC), with MERRA-2 model soil wetness. Planned satellite credits: GPM IMERG, SMAP and GRACE/GRACE-FO. No V2 photographs or application code are reused. Representative crop images were newly sourced from Commons with their licences retained; the two local fonts include OFL files under assets/fonts. Optional Leaflet 1.9.4 loads from unpkg only when the field map is opened; it is covered by the [BSD-2-Clause licence](https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE). Map tiles are © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Built with help from OpenAI Codex. Team names have not been supplied yet.

Original project software is covered by [LICENSE](LICENSE). Provider data and future photos retain their own terms. Independent hackathon project; no NASA endorsement is claimed.

## Studio design and 3D boundaries

`studio.css` refines the existing route views without replacing engine/data logic. `field-scene.mjs` is an original procedural WebGL scene: no Three.js, model CDN or tracking request. Wind and season appearance affect illustration pixels only. Motion pauses offscreen and on hidden tabs; reduced-motion preferences start paused. Devices without usable WebGL keep a local SVG fallback. All planner routes remain usable. English nav/crop text remains present alongside regional labels.

Crop-photo sources and licences are preserved in `assets/photo-credits.json` and on Evidence. Photographs are representative, not field observations; images may depict a plant, seed or harvested crop. Font licences are in `assets/fonts/OFL-*.txt`. The public packager allowlists all runtime modules and these assets, excluding repository files and review screenshots.
