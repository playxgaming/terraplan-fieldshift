# TerraPlan — complete product and technical handoff for independent AI review

Prepared: November 12, 2026. This document describes the implemented site, its limits and areas to cross-check. It is not a claim that the agricultural model has been scientifically validated. Documentation only was prepared for this handoff; no website changes were made.

## 1. Project identity and review materials

- **Project name:** TerraPlan.
- **Current product release:** V2.1 visual update. The interface still displays V2.
- **Calculation model:** `2.0.0`.
- **Saved-plan schema:** `2`.
- **Source commit reviewed:** `7ff92f242b5b7ff241357edbbff2c40aa6999451`.
- **Published site:** https://terraplan-fieldshift.sarveshsehra1.chatgpt.site/
- **Challenge:** Field Shift: Adapting Farms with NASA Data, NASA Space Apps.
- **Status:** working hackathon exploration prototype; regional agronomic validation is pending.
- **Access:** the published site is owner-private and may require the owner's ChatGPT sign-in. An independent AI may not be able to browse it. Do not infer a broken application from encountering that access gate. Review the supplied source and screenshots instead.
- **Affiliation:** independent project; not a NASA product, partnership or endorsement.

The review pack contains this briefing, the source, public NASA demo data, crop photos, attribution metadata, tests, earlier design/release notes and a screenshot. It excludes private hosting credentials, Git metadata and the owner's browser-saved fields/plans.

## 2. Problem, users and intended value

Farmers and agricultural extension workers need to explore crop-rotation options under different soil, water and temperature conditions. TerraPlan brings historical weather observations, manually supplied field information and explicit scoring assumptions into one interface.

The question it currently answers is:

> Under this field profile, these historical growing windows and these illustrative rules, how do five predefined two-season rotations compare, and what changes if rainfall, temperature or irrigation assumptions change?

It does **not** currently answer which crop will produce the highest yield or profit, which exact date a farmer should plant, or how much water an actual field will save.

Primary users: farmers exploring possibilities and extension workers discussing trade-offs. Secondary users: educators and hackathon judges inspecting the reasoning and NASA-data connection. The intended crop-calendar context is an illustrative Indian seasonal template, with a saved Pune reference location. Regional crop rules have not been validated with local agronomists. Custom coordinates make weather exploration possible elsewhere; they do not make the crop advice globally valid.

## 3. Main user journey

1. Open Welcome or choose the Pune demo.
2. Create/select a field, entering location, area, soil texture, previous crop and default irrigation.
3. Inspect historical weather on Overview.
4. Select a historical crop year and two growing windows in Rotation Planner.
5. Inspect eligible rotations, exclusions, component scores and both-season reasoning.
6. Choose up to three rotations in Compare & Simulate.
7. Change each season's rainfall, heat and irrigation assumptions and compare with the observed baseline.
8. Inspect sensitivity across four historical crop years.
9. Save a named snapshot containing the field, settings, raw data and model result.
10. Reopen, print, export/import or compare two saved snapshots.

The field selector is shared across pages. Draft planning settings are stored per field. Navigation uses hash routes rather than separate server-rendered pages.

## 4. Page-by-page inventory

### Welcome — `#home`

- Product introduction and calls to start a field or open the demo.
- Interactive 3D farm illustration.
- Four-step explanation of the workflow.
- Scrollable gallery of seven real crop photographs.
- Crop-detail dialogs with model water demand, heat threshold and links to photo attribution.
- Links to planner, scenarios and evidence.
- Prototype and validation limitations.

### Overview — `#dashboard`

- Active field name, coordinates and area.
- Crop-year selection: 2021–22 through 2024–25.
- Historical rainfall across the two selected windows.
- Mean temperature calculated across all selected observed days.
- Number of candidates passing calendar/soil rules.
- Number of saved plans for that field.
- Monthly rainfall and mean-temperature charts, with expandable data tables.
- Highest-scoring eligible rotation under the current draft assumptions.
- A text summary of active scenario adjustments so a scenario score is not confused with observed weather.
- Field profile, edit action and compact 3D illustration.

The weather cards/charts remain observations. The suggested rotation may use a modified scenario. They must be interpreted separately.

### My Fields — `#fields`

- Create, edit, select and remove field profiles.
- Manual inputs: name, latitude, longitude, hectares, soil texture, previous crop and default irrigation per season.
- Soil choices: loam, clay and sandy.
- Previous crop choices: the seven supported crop definitions.
- A shared active-field selection.
- Removal confirmation; deleting a field preserves independent saved-plan snapshots.
- Local-device storage notice.
- Illustrative field sketches rather than a geographic map or detected boundaries.

Default demo: `Pune demo plot`, latitude 18.52, longitude 73.86, area 2.5 ha, loam, previous crop rice, irrigation 200 mm/season. The field profile is fictional/illustrative; the reference location and downloaded NASA weather record are real.

### Rotation Planner — `#planner`

- Choose crop year, first-season start and second-season start.
- Each growing window has a fixed length of four calendar months.
- First-season start choices: May–September.
- Second-season start choices: September–December of the same starting year; the window can cross into the next year.
- Set irrigation separately for each season, from 0 to 1,000 mm.
- Choose balanced, water or soil/diversity priority.
- View ranked eligible candidates and explicit exclusions.
- View crop photos, crop names, season labels, component bars and detailed water/heat tables.
- Select candidates for comparison and save a plan.

Default windows: June–September and November–February. Unsupported months may produce calendar exclusions. May 2021 also extends before the bundled data start, so data completeness blocks that window.

### Compare & Simulate — `#compare`

- Select up to three of the five rotation pairs.
- Compare scenario score, observed-baseline score and score difference.
- Show water fit, heat fit, soil/diversity score, modeled water gap in mm, and area-scaled gap in cubic metres.
- Show both-season crop/window labels and crop photos.
- Adjust rainfall, heat and irrigation independently for each season.
- Compare the same scenario/settings over all four historical crop years.
- Show min–max model scores over the available years; these are not calibrated confidence intervals.

Presets:

| Preset | Behavior |
| --- | --- |
| Observed baseline | No rainfall/heat adjustment; each season uses the field's default irrigation |
| Hotter + drier | Both seasons: −40% rain, +3°C, irrigation set to zero |
| Less irrigation | No rainfall/heat adjustment; each season gets half the field's default irrigation |

Rainfall sliders: −60% to +30%, normally in 5% steps. Temperature increases: 0°C to +5°C, normally in 0.5°C steps. Cooling scenarios are not offered. These are sensitivity experiments applied to history, not future weather forecasts.

### Evidence Library — `#evidence`

- NASA product, parameters, returned metadata, request coordinates and native returned point geometry.
- Data period and retrieval timestamp.
- Selected-window completeness or a blocked evaluation.
- Exact API request link and downloadable raw source record.
- Water/heat formulas, soil/diversity formula and priority weights.
- Crop assumptions with source context and explicit unvalidated fields.
- Manual-input explanation and scientific limitations.

The interface does not currently expose every native dataset's numerical spatial-resolution specification. Showing point geometry is not a substitute for communicating resolution.

### Saved Plans — `#plans`

- Save and review named snapshots.
- List saved field, year, model version and a summary of the top eligible result.
- Export JSON, import JSON and remove snapshots.
- Choose two saved snapshots for comparison.
- Data stay in this browser/device; there is no cloud synchronization.

### Plan Report — `#plan/<id>`

- Saved field profile, scenario, source URL and model version.
- All candidate results, both-season water/heat tables and exclusions.
- JSON export and browser print/PDF action.
- Current field edits do not overwrite the saved field/settings snapshot.

### Snapshot Comparison — `#snapshots`

- Compare two saved field/season/scenario contexts side by side.
- Display field, area, coordinates, soil, priority, windows, adjustments, scores and gaps.
- Link back to each full report.
- Warn that scores from different assumptions/weights do not prove measured performance differences.

## 5. What the 3D and photos actually do

The original farm diorama is implemented directly in WebGL, without Three.js or a downloaded 3D asset. It includes a raised soil slab, crop rows, paths, water channel, barn, trees, fencing and windmill.

Controls: drag to orbit, arrow keys to rotate, plus/minus keys to zoom, reset view, pause/play motion and switch illustrative green/golden crop colors. Wind and small camera movement create gentle animation. Motion stops when the scene is offscreen or the tab is hidden. Reduced-motion preference starts it paused. A static SVG is used when WebGL is unavailable. GPU resources/listeners are cleaned up when scenes are replaced.

Important: this is decorative/conceptual. It does not reconstruct field coordinates or boundaries, display live satellite imagery, change crops in response to the chosen rotation, show real moisture, or simulate growth/yield under a scenario. The green/golden switch is visual only. It does not change planning inputs or scores.

Seven photos represent rice, wheat, pearl millet, chickpea, maize, sorghum and mung bean. They are reference photographs sourced from Wikimedia Commons, locally served and lazy-loaded. They appear in the gallery and rotation/comparison cards. Credits include authors, original file pages, license links and the CSS display-cropping note in `dist/assets/photo-credits.json`. Licenses include CC0, public domain and CC BY-SA variants. Total original thumbnail payload is approximately 1.86 MB. No responsive `srcset`/AVIF/WebP pipeline is implemented.

## 6. NASA data: exact scope

The only active NASA weather integration is **NASA POWER Daily API**.

| Parameter | Used as |
| --- | --- |
| `PRECTOTCORR` | Daily corrected precipitation, mm/day; summed across days |
| `T2M` | Daily mean temperature at 2 m, °C; averaged across days |
| `T2M_MAX` | Daily maximum temperature at 2 m, °C; used for threshold exceedance counts |

Saved Pune record:

```text
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,PRECTOTCORR&community=AG&longitude=73.86&latitude=18.52&start=20210601&end=20250531&format=JSON
```

- Period: June 1, 2021–May 31, 2025.
- 1,461 daily entries per requested parameter in the saved record.
- Retrieved November 12, 2026, at approximately 12:33 IST; the raw metadata retain the UTC timestamp.
- Response API version: `v2.10.3`.
- Response source labels: `MERRA2`, `POWER`.
- Response time standard: `LST` (local solar time).
- Missing-data fill value in the saved response: `-999`.
- Raw request, requested coordinates, retrieval time and response are bundled in `dist/data/pune-history.json`.

Custom coordinates request the same fixed four-year period directly from NASA in the browser. The adapter has a 60-second timeout, cancellation, in-session memory cache and generation checks to prevent a late response being displayed under a different active field.

Coordinates within 0.0001° of the saved Pune point use the bundled record. Other coordinates depend on internet access, NASA availability and browser CORS behavior. There is no backend proxy, retry/backoff policy, persistent multi-location cache or API quota monitoring.

The default Pune windows pass complete-day checks in all four years, including February 29, 2024. Completeness validation rejects missing/nonfinite/fill values and negative precipitation in either selected window. It does not perform a comprehensive scientific quality-control check on every plausible weather value or require complete data in unused months before displaying selected-window results.

This is regional gridded meteorology, not a field probe. The site does not currently integrate SMAP, GPM IMERG, MODIS NDVI, Landsat, Sentinel, NISAR, ECOSTRESS or a soil survey.

## 7. Crops and predefined rotations

There are seven crop definitions and five fixed pairs. The engine does not search arbitrary crop combinations.

| Crop | Water constant (mm/crop) | Water context range | Heat threshold | Allowed start months in demo | Preferred soils in demo |
| --- | --- | --- | --- | --- | --- |
| Rice | 575 | 450–700, FAO context | 35°C | Jun, Jul | Clay |
| Wheat | 550 | 450–650, FAO context | 30°C | Oct, Nov | Loam, clay |
| Pearl millet | 550 | 450–650, FAO sorghum/millet context | 40°C | Jun, Jul | Sandy, loam |
| Chickpea | 300 | Illustrative constant | 32°C | Oct, Nov | Loam, clay |
| Maize | 650 | 500–800, FAO context | 35°C | Jun, Jul | Loam |
| Mung bean | 300 | Illustrative constant | 35°C | Feb, Mar, Jun, Jul | Loam, sandy |
| Sorghum | 550 | 450–650, FAO sorghum/millet context | 39°C | Jun, Jul | Loam, clay |

Cereal water constants use midpoints of broad reference ranges. They are not locally calibrated requirements. Rice demand excludes additional paddy-system losses. Pulse demands, heat thresholds, exact start months, soil preferences and all score weights are illustrative. General Indian season references do not validate these exact month lists for Pune or another location.

Fixed pairs:

1. Rice → wheat: reference baseline.
2. Pearl millet → chickpea: pulse diversification.
3. Maize → wheat: cereal alternative.
4. Sorghum → chickpea: heat-tolerant alternative label.
5. Maize → mung bean: calendar-check example.

Chickpea and mung are classified as pulses/legumes; the remaining crops are grouped as grasses. Species and cultivar differences within those groups are not modeled.

## 8. Exact model calculations

### 8.1 Feasibility exclusions

For each pair, the engine checks whether each crop allows its selected starting month; whether the two four-month windows overlap; and whether the pair includes rice on sandy soil. A failed rule makes the pair ineligible and its displayed score `null`, with the reason shown.

Other soil preferences affect the score rather than exclusion. A water gap does not automatically make a candidate ineligible. The checks are demo rules, not agronomically validated feasibility guarantees.

### 8.2 Per-season water calculations

```text
scenario_rain_mm = sum(observed_daily_rain_mm) × (1 + rainfall_change_percent / 100)
usable_water_mm = scenario_rain_mm × 0.65 + irrigation_mm
water_fit = clamp(usable_water_mm / crop_water_constant_mm × 100, 0, 100)
water_gap_mm = max(0, crop_water_constant_mm − usable_water_mm)
```

The 65% usable-rain factor is fixed and illustrative. Water is aggregated over the full window. Rainfall timing, daily balances, soil storage, evapotranspiration, growth stages, runoff and irrigation efficiency are not calculated.

### 8.3 Per-season heat calculations

```text
hot_day = observed_daily_max_temperature + scenario_heat_increase > crop_threshold
heat_fit = 100 × (1 − hot_day_count / number_of_days_in_window)
```

All days count equally. No cold/frost stress or crop-stage-specific heat sensitivity is included.

### 8.4 Soil/diversity heuristic

```text
Start with 25 points.
+20 if the first crop's preferred-soil list includes the field texture.
+15 if the second crop's preferred-soil list includes the field texture.
+25 if the second crop is a pulse/legume.
+15 if the two crops are from different model families.
−15 if the previous crop and first crop share a model family.
Clamp the result to 0–100.
```

This is not measured soil health, nitrogen fixation, fertility improvement or carbon sequestration.

### 8.5 Combined score

Average the two seasons' water-fit scores. Separately average the two heat-fit scores. Combine those averages with the soil/diversity score using:

| Priority | Water | Soil/diversity | Heat |
| --- | --- | --- | --- |
| Balanced | 35% | 30% | 35% |
| Water | 60% | 20% | 20% |
| Soil/diversity | 20% | 60% | 20% |

Round the weighted total to an integer. Eligible pairs sort by descending rounded score, then ascending combined assumed water demand, then rotation identifier. Excluded pairs are placed after eligible ones.

These 0–100 scores are relative heuristic comparisons, not likelihoods of success or calibrated measures of real-world suitability.

### 8.6 Combined water gap and area

```text
combined_gap_mm = season_1_gap_mm + season_2_gap_mm
total_modeled_gap_m³ = combined_gap_mm × field_area_ha × 10
```

Area scales volume, not per-area scores. The output is a modeled unmet crop-water need under the assumptions, not actual water withdrawal, irrigation advice or demonstrated savings.

### 8.7 Historical sensitivity

Repeat the same field inputs, windows and scenario independently for starting years 2021, 2022, 2023 and 2024. Display each score and the minimum/maximum across valid results. This is neither a forecast model nor a calibrated uncertainty interval or long-term climate-trend analysis.

## 9. Reproducible demo example

Use Pune demo, loam, previous rice, 2.5 ha, balanced priority, starting year 2024, June and November starts, 200 mm irrigation each season, no rain/heat adjustment.

Observed season 1: 122 days, rainfall 2,417.46 mm, mean temperature about 24.39°C. Observed season 2: 120 days, rainfall 6.24 mm, mean temperature about 21.00°C.

| Pair | Default score | Hotter/drier preset score |
| --- | --- | --- |
| Pearl millet → chickpea | 86 | 72 |
| Sorghum → chickpea | 86 | 72 |
| Maize → wheat | 67 | 53 |
| Rice → wheat | 61 | 47 |
| Maize → mung bean | Excluded | Excluded |

Under default inputs, the modeled combined water gap is about 95.944 mm for either chickpea pair and 345.944 mm for either wheat pair. These values follow the simplified engine; they are not validated farm outcomes. The hotter/drier preset combines lower rain, higher heat and zero irrigation, so its score change cannot be attributed to temperature or rainfall alone.

## 10. Technology and code structure

The application is a buildless static single-page app using HTML, CSS and native JavaScript ES modules. There is no React/Next.js runtime, server application, database, trained ML model or LLM API. SVG is used for charts/icons/sketches; custom WebGL handles the diorama. Google Fonts has system-font fallbacks.

```text
dist/
  index.html               Application shell, navigation, dialog and import control
  app.mjs                  Routes, event handlers, state and workflow coordination
  views.mjs                Page templates, forms, charts, reports and dialogs
  engine.mjs               Crop definitions, validation, windows, exclusions and scoring
  data.mjs                 NASA requests, memory cache, cancellation and staleness checks
  storage.mjs              Browser persistence, schema checks and snapshot creation
  field3d.mjs              WebGL geometry, shaders, animation, controls and cleanup
  photos.mjs               Photo gallery/card templates, alternative text and credits
  style.css                Visual system, responsive rules and print styles
  farm.svg                 Static fallback illustration
  favicon.svg
  data/pune-history.json   Four-year saved NASA record
  data/pune-2024.json      Legacy V1 dataset; not the V2 active record
  assets/crops/*.jpg       Seven reference photographs
  assets/photo-credits.json
README.md
test.mjs
```

Hosting uses the existing private Sites deployment. Private hosting access is separate from application-level accounts: the app itself has no farmer account system, tenant model, roles, backend authorization or cloud data synchronization.

Local run, from the source project folder:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8080`. Direct `file://` opening is not supported because dataset fetches may be blocked. A local HTTP server can serve the bundled demo without an internet connection. The hosted site has no service-worker/PWA offline installation or guaranteed offline reload.

## 11. Persistence, import/export and validation

Storage is `localStorage` under `terraplan.workspace.v2`. It contains field profiles, the active field identifier, per-field draft settings, comparison selection, saved snapshots and snapshot-comparison selections.

A plan includes its identifier, name, creation timestamp, schema/model version, copied field/settings, copied raw NASA record and copied result. Snapshot creation uses deep copies. Restoring a plan through validation recalculates its result under the current code for model 2.0.0. Therefore these are independent input/data snapshots, not cryptographically immutable records. Reproducibility depends on correct model-version discipline.

Normal UI limits: 20 fields and 20 plans. Imports are limited to 2,000,000 bytes. Read-state validation permits larger collections up to 100; this discrepancy deserves review. Raw weather is duplicated in snapshots, so browser quota can be reached before the UI count limit. Creation/removal operations roll state back on persistence failure; some draft changes remain session-only and show a warning if persistence fails.

Import checks the schema/model, metadata, field/settings, NASA origin/path and coordinate query, and recomputes scores from the imported data. It does not verify that the supplied weather observations really came from NASA, digitally sign files, fetch the original source to compare it, or preserve support for V1 exports. Imported plans receive a fresh identifier.

HTML text is generally escaped before template insertion, but the UI uses `innerHTML` and imports user-supplied JSON. A reviewer should examine all interpolation and schema boundaries rather than treating escaping as a completed security audit.

## 12. Verification performed and what it establishes

Eight automated Node tests were last run successfully for the visual release:

1. Four complete default crop-year windows, with leap-day handling.
2. Calendar/soil exclusion and no displayed numerical score for excluded candidates.
3. Lower water/higher heat do not improve their corresponding fit in either season.
4. Area scales modeled total volume without changing scores/order.
5. Missing observations block calculations, including season 2.
6. Snapshot deep copies, imported-score recalculation, source-coordinate mismatch rejection and unsupported-version rejection.
7. Workspace serialization/restoration.
8. Late data responses are marked stale after field switching.

Syntax checks passed for application modules. Browser checks exercised dashboard, planner, presets, save/reload, export/import, sandy-soil field creation, snapshot comparison, missing-window states, mobile navigation, 3D rendering/control buttons, keyboard orbit, photo dialogs and credits. Desktop and 390 px mobile layouts were inspected; no console errors appeared in those checked flows.

These were bounded implementation checks, not exhaustive QA or an agricultural validation study. The browser checks are not a committed automated end-to-end suite. Reduced-motion/unavailable-WebGL behavior was code-reviewed rather than simulated in browser settings. Browser print-to-PDF output, broad device/browser compatibility, custom-location network availability, performance metrics, contrast compliance and screen-reader behavior have not been comprehensively certified. The tests do not establish that chosen agronomic constants or model rankings are correct.

## 13. Known scientific and product gaps

- No local agronomist validation, farmer trial or documented user study.
- Fixed four-month windows rather than crop/cultivar-specific stages and duration.
- Broad cereal ranges and illustrative pulse/heat/soil/calendar parameters.
- No daily soil-water balance, root depth, evapotranspiration, irrigation efficiency or carry-over moisture.
- No cold stress, frost, photoperiod, salinity, drainage, waterlogging or pest/disease model.
- Seasonal rainfall totals can hide damaging dry spells and excess-water events.
- Arithmetic averaging can hide a poor second season behind a strong first season.
- No hard water-feasibility constraint despite possible large modeled gaps.
- The family/legume bonus is a heuristic, not measured soil improvement.
- Only five predefined pairs; no arbitrary crop/rotation generation or constrained optimizer.
- Four historical years and one saved location; no validated future outlook or climate-trend inference.
- Global coordinates paired with an Indian demo calendar rather than location-specific rules.
- No price, cost, market, labor, farmer-income, yield or profit analysis.
- Previous crop is recorded, but the farmer's full current rotation is not. Rice–wheat is a fixed reference baseline, not necessarily the user's actual practice.
- No real satellite map, field-boundary drawing, geocoding/location search or geographic grid-footprint overlay.
- The 3D farm is cosmetic and not connected to the field geometry or scenario model.
- English-only interface; no local-language/voice/low-literacy workflow.
- Device-only storage; no account sync, shared extension-worker workspace or public shareable saved-plan URL.
- No PWA, persistent custom-location offline cache, weather alerts or sensor integration.
- No trained AI/ML or explanation chatbot. Adding one would be a new integration, not enabling a hidden existing feature.

Some are appropriate later-stage features, not necessarily hackathon blockers. The independent reviewer should prioritize them according to the target demo and intended user risk.

## 14. Specific code/design questions for an independent reviewer

These are concrete review targets, not a complete list of verified defects:

1. **Unreachable crop pair:** mung's allowed months are February/March/June/July, but season 2 only permits September–December. The maize–mung example is therefore excluded for every supported UI second-season start. Decide whether an always-excluded teaching example belongs in the shortlist.
2. **Numeric URL parsing:** import coordinate checks use `Number(...)` and a tolerance comparison. Explicitly test nonnumeric, empty and duplicate query values and reject nonfinite results; do not assume a `> tolerance` comparison rejects `NaN`.
3. **Imported provenance:** ensure the UI clearly distinguishes an imported, user-supplied record from a freshly fetched or bundled NASA record.
4. **Snapshot integrity/versioning:** loading calls validation that recalculates stored results. Check whether the immutable-snapshot wording is precise and whether model changes always receive a new version.
5. **Stale selections:** deleting a plan does not visibly remove its identifier from `comparePlanIds`; inspect whether hidden stale identifiers prevent choosing two new snapshots.
6. **Collection limits:** compare 20-item UI limits, 100-item restore limits, demo restoration and direct JSON mutation paths.
7. **Recovery from invalid local storage:** reading invalid state preserves the original stored string at that moment, but later saves may overwrite it with the demo state. Decide whether a recovery/export path is needed.
8. **Field editing semantics:** saving a field resets both draft irrigation values to its default, including changes made for a scenario. Evaluate whether that surprises users.
9. **Same-location handling:** assess tolerance matching, exact-coordinate cache keys, native grid-cell reuse, API rate-limit behavior and the need to explain the difference between a requested point and true data resolution.
10. **Performance:** inspect repeated full renders, repeated historical calculations, snapshot duplication, WebGL context teardown/recreation and seven-image payload. Measure real devices before claiming speed.
11. **Accessibility:** test gallery discovery beyond the first visible photos, range controls, focus return after dialogs/renders, keyboard navigation, screen-reader chart alternatives and text contrast.
12. **WebGL failure handling:** test unavailable graphics, context loss/restoration, touch scrolling, reduced motion and offscreen behavior. Fallback exists; restoration and performance require broader testing.
13. **Reports and audit trail:** test print/PDF pagination, units, source completeness, second-season calendar display and the visibility of every assumption in exported material.
14. **Data robustness:** test plausible-but-wrong temperatures, header inconsistencies, missing/invalid metadata, malformed JSON, duplicate dates/query parameters, unsupported schemas and partially complete multi-year records.
15. **Trust and product claims:** determine whether polished 3D imagery or labels such as “heat-tolerant alternative” could imply validation beyond what the engine supports.

## 15. Source references used by this implementation

- [Official Field Shift challenge](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/).
- [NASA POWER daily API documentation](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).
- [FAO crop water-needs reference](https://www.fao.org/4/S2022E/s2022e07.htm).
- [Indian Economic Service seasonal context](https://ies.gov.in/arthapedia/concept/cropping-seasons-india-kharif-rabi).
- Individual photo authors/licenses/source pages are in `dist/assets/photo-credits.json` and the supplied visual release note.

References provide context; they do not validate the complete TerraPlan model. The reviewer should independently check exact source interpretation, regional applicability, product resolution, data terms and photo-license obligations.

## 16. Copy-and-paste prompt for the independent AI

> Review TerraPlan independently as a NASA Space Apps Field Shift hackathon project. I am providing a factual handoff, source files, a saved NASA record, tests and screenshots. Treat the handoff as a description to verify, not proof that the system is complete or scientifically valid.
>
> First inspect the supplied code and identify what is actually implemented. Separate confirmed findings from claims you could not verify. If the private live URL is inaccessible, say so and continue with the files; do not claim you inspected the deployed site.
>
> Evaluate: challenge alignment; farmer/extension-worker usefulness; NASA-data authenticity, units, time standard, spatial resolution and missing-data handling; agronomic assumptions and both-season scoring; scenario/baseline interpretation; saved-plan reproducibility and import security; architecture and error recovery; accessibility/mobile/performance; 3D/photo usefulness and licensing; and hackathon demo clarity.
>
> Cross-check every formula and the seven crop definitions. Pay special attention to fixed four-month windows, the 65% usable-rain factor, averaged season scores, pulse/soil bonuses, unmet-water gaps and the difference between a heuristic score and a prediction. Check the specific review targets in section 14, including the always-excluded mung pair, numeric coordinate parsing, stale snapshot selections, limits and snapshot recalculation.
>
> Return (1) confirmed working features, (2) confirmed bugs with file/function evidence and reproducible steps, (3) scientific weaknesses with authoritative sources where available, (4) missing capabilities grouped into hackathon must-haves and later product ideas, (5) the ten highest-priority improvements ranked by impact and effort, (6) specific meaningful tests to add, and (7) a practical next-release plan. State what evidence would be needed to validate recommendations. Do not invent user studies, savings, yield gains, partnerships or data integrations. Do not recommend feature bloat merely to increase the page count. Do not modify the project unless I separately ask you to implement fixes.
