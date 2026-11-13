# AGENTS.md — TerraPlan V3

**NASA Space Apps 2026 · Challenge: "Field Shift: Adapting Farms with NASA Data"**

You are the only coding agent on this repo. Read this whole file before every task. When this file and a prompt disagree, ask; don't guess. Work one build step at a time (§10). After each step: run the tests, make sure the app still loads, then commit.

---

## 1. What we are building

TerraPlan is a crop-rotation planner for small farmers in western India. A farmer enters their field and their **current rotation**. The app pulls NASA climate data for that location and compares the current rotation with the **two best alternatives**. For each rotation it explains: why, the evidence (NASA numbers), benefits, information gaps, and what to check locally.

Core message, shown on every screen: **"TerraPlan supports your decision. It does not replace your judgment or local advice."**

Scores are **relative comparisons from stated rules**. They are not yield or profit predictions. Never write UI text that suggests otherwise.

---

## 2. Hard rules

1. **Buildless static app.** Plain HTML, CSS and ES modules (`<script type="module">`). No React, no bundler, no npm runtime dependencies. One optional CDN library is allowed later: Leaflet (step 12 only).
2. **Do not copy code from TerraPlan V2.** This is a fresh build from this spec.
3. **Engine is pure.** `engine.mjs` has no DOM, no `fetch`, no `localStorage`. It takes plain objects and returns plain objects. This makes it testable with `node --test`.
4. **Honesty in the UI.** Every number has a source label. Illustrative constants are labelled "illustrative". Model-derived soil wetness (POWER/MERRA-2) is labelled as a model value, not a satellite reading.
5. **Never hide a rotation silently.** Excluded or infeasible rotations are shown with a reason (in a collapsible "Excluded" list).
6. **Validate every number input.** Reject `NaN`, empty and out-of-range values with a visible message. Never store `NaN`.
7. **No secrets, no logins, no backend.** NASA POWER needs no key. Everything else is bundled JSON.
8. **Plain English.** Short sentences. Every technical term gets a glossary popup (§8.3).
9. **Accessible.** Labels on all inputs, buttons are `<button>`, colour is never the only signal, works at 360 px wide.

---

## 3. File layout

```
index.html          shell, nav, <main id="app">, banner
style.css           all styles (mobile-first)
app.mjs             hash router, state, localStorage, wires views to engine/data
views.mjs           one render function per screen, returns HTML strings / DOM
engine.mjs          generator, fit, scoring, feasibility, confidence, timeline, badges (PURE)
data.mjs            NASA POWER fetch, caching, -999 handling, demo fallback, derived climate
glossary.mjs        glossary terms + popup helper
data/crops.json                 crop table (§6)
data/demo-power-daily.json      bundled POWER daily for demo farm (fallback)
data/demo-power-monthly.json    bundled POWER monthly 1991–2024 for demo farm
data/demo-satellite.json        SMAP / IMERG / GRACE summaries (delivered by data person; optional until step 9)
scripts/fetch-demo.mjs          Node script that downloads the two demo POWER files
tests/engine.test.mjs           node --test
tests/data.test.mjs             node --test (parsing, fill values, derived numbers)
README.md                       what it is, how to run, datasets, limitations, credits
```

Run locally: `npx serve .` or `python3 -m http.server`. Tests: `node --test tests/`.

---

## 4. Screens (hash routes)

| Route | Screen | Contents |
|---|---|---|
| `#/` | Welcome | One-line purpose, the "supports, not replaces" line, buttons **Start** and **Load demo farm**. Optional small illustration labelled "illustration". |
| `#/field` | My field | Form from §5.1. Save → localStorage. |
| `#/climate` | Your climate (NASA) | Climate cards (§8.1). |
| `#/priorities` | Priorities | 6 sliders 0–5 (§7.5). Ranking updates live. |
| `#/compare` | Compare rotations (main screen) | 3 columns: **Your current · Option A · Option B** (§8.2). |
| `#/whatif` | What if? | Rain %, +°C, irrigation sliders; 4-year sensitivity table. |
| `#/evidence` | Evidence | All formulas, constants, datasets, request URLs, retrieval times, crop sources, limitations. |

A persistent banner on every screen: "Supports your decision — doesn't replace it. Check with your KVK or agri officer."
Nav works on mobile (bottom bar or collapsible menu).

---

## 5. Data shapes

### 5.1 Field (stored in localStorage key `terraplan.v3.field`)

```js
{
  name: "Demo farm, Rajkot",
  lat: 22.30, lon: 70.80,            // -90..90, -180..180, reject NaN
  soil: "black" | "loam" | "sandy" | "clay" | "red",
  soil_tested: false,                // true = farmer has a soil test report
  area_ha: 2,                        // > 0, <= 100
  water_source: "rainfed" | "well" | "canal" | "borewell",
  irrigation_mm: { kharif: 0, rabi: 150, zaid: 0 },   // 0..1500 each
  equipment: "basic" | "machine",
  market_access: "local" | "mandi" | "contract",
  current_rotation: { kharif: "groundnut", rabi: "wheat", zaid: null }  // crop ids or null = bare
}
```

Demo farm = the object above (Rajkot, Saurashtra, semi-arid, water actually limits choices). Keep it in one constant `DEMO_FARM` in `data.mjs` so the team can change the location in one line.

Field save must **not** reset What-if slider state. Saving/loading uses a version key; if parsing fails, show a message and keep the old value.

### 5.2 Climate object (output of `data.mjs`, input to `engine.mjs`)

```js
{
  source: "live" | "cache" | "demo-bundle",
  retrieved_at: ISOString, request_urls: [..],
  grid_note: "NASA POWER ~0.5° × 0.625° grid (about 50 km). Area pattern, not a field measurement.",
  daily: [ { date: "2025-06-01", rain, t2m, tmax, tmin, gwetroot, gwettop } ... ],  // nulls where -999
  ag_year: 2025,             // Jun 2025 → May 2026
  years_available: [2022, 2023, 2024, 2025],
  monthly_trend: { rain_mm_per_decade, tmax_c_per_decade, years: [1991..2024], annual: [...] },
  missing_days: 3
}
```

**Agricultural year** `Y` = 1 Jun `Y` → 31 May `Y+1`. Month 6–12 → calendar year `Y`, month 1–5 → `Y+1`.
Default `Y` = latest complete ag year: if current month ≥ 7 then `currentYear − 1`, else `currentYear − 2`.

---

## 6. Crop table — `data/crops.json`

If `data/crops.json` already exists (from the crops person), use it as-is. Otherwise create a starter with these 12 crops and mark **every** entry `"source_note": "illustrative (AI-drafted, not verified)"` and `"verified": false`. The crops person will replace values.

Crops: rice, wheat, rabi jowar (sorghum), bajra (pearl millet), maize, soybean, groundnut, chickpea, tur (pigeon pea), moong (mung bean), cotton, fodder (lucerne or fodder sorghum — pick one, say which).

```json
{
  "id": "chickpea",
  "name": "Chickpea (chana)",
  "family": "Fabaceae",
  "seasons": ["rabi"],
  "start_months": [10, 11],
  "duration_months": 4,
  "water_need_mm": 300,
  "heat_threshold_c": 35,
  "cold_threshold_c": 2,
  "soils": ["black", "loam", "clay"],
  "roles": ["nitrogen-fixer", "drought-tolerant"],
  "heavy_feeder": false,
  "forage": 4, "n_fixation": 8, "erosion_cover": 4, "organic_matter": 5, "market": 7,
  "equipment": "basic",
  "regional_common": true,
  "how_it_helps_soil": "One plain sentence for farmers.",
  "photo": { "url": "", "credit": "", "licence": "" },
  "source_note": "illustrative (AI-drafted, not verified)",
  "verified": false
}
```

- Attributes are 0–10. Role tags allowed: `nitrogen-fixer`, `cover`, `deep-rooted`, `drought-tolerant`, `forage`.
- Months are 1–12. A crop occupies months `start … start + duration − 1` (wrapping past 12).
- `regional_common` = commonly grown in Gujarat/Maharashtra. Used by confidence.
- Leave `photo.url` empty; the UI shows a crop-initial placeholder until photos are added.
- Validate the file on load (`validateCrops()` in engine): required keys, ranges, known roles. Show errors on the Evidence screen, skip bad rows.

---

## 7. Model

All constants live in one exported object `MODEL` in `engine.mjs` and are printed on the Evidence screen.

```js
export const MODEL = {
  effective_rain_factor: 0.65,      // illustrative
  dry_day_mm: 2.5,
  heavy_rain_mm: 64.5,              // IMD "heavy rain" threshold
  infeasible_gap: 0.40,             // water gap > 40% of need
  cover_possible_fit: 60,           // a season "could hold a crop" if some crop reaches water_fit >= 60
  penalty_same_family: 8,
  bonus_nfixer_after_heavy: 6,
  penalty_bare_when_possible: 6,    // per bare season
  vuln_heat_days: 3, vuln_cold_days: 2, vuln_dry_spell: 10, vuln_heavy_days: 1
};
```

### 7.1 Seasons

Kharif → Rabi → Zaid (Zaid optional). A season may be **bare** (`null`).

### 7.2 Rotation generator — `generateRotations(crops, field)`

1. For each season, candidate crops = crops whose `seasons` include it, plus `null` (bare). Kharif may be bare only if Rabi is not.
2. For each combination and each allowed start month, keep it only if the windows **don't overlap** and the whole sequence fits inside 12 months from the first crop's start.
3. For each unique crop sequence keep the **earliest valid** start months.
4. **Hard exclusions** (move to `excluded[]` with a reason, don't drop):
   - soil not in `crop.soils` → "Not suited to {soil} soil"
   - rice on sandy soil → "Rice on sandy soil loses too much water"
   - `crop.equipment === "machine"` and field equipment is `basic` → "Needs machinery you don't have"
5. Return `{ rotations: [...], excluded: [...] }`. Each rotation: `{ id, seasons: { kharif: {crop, start, end} | null, rabi: ..., zaid: ... } }`.

The farmer's `current_rotation` is always scored, even if it overlaps or breaks a rule. Show a warning instead of excluding it. Options A and B are never identical to the current rotation.

### 7.3 Per-season climate numbers — `seasonClimate(climate, window, crop)`

For the days inside the crop's window in ag year `Y`:

```
rain_mm        = Σ rain
heat_days      = count(tmax > crop.heat_threshold_c)
cold_days      = count(tmin < crop.cold_threshold_c)
dry_spell_max  = longest run of days with rain < 2.5 mm
heavy_rain     = count(rain ≥ 64.5 mm)
soil_wet_mean  = mean(gwetroot)
days           = days with valid data
missing        = days in window − days
```

Skip null days in counts; report `missing`.

### 7.4 Per-season fit

```
effective_rain = rain_mm × 0.65
usable_water   = effective_rain + field.irrigation_mm[season]
water_fit      = min(100, usable_water ÷ water_need_mm × 100)
heat_fit       = 100 × (1 − heat_days ÷ days)
cold_fit       = 100 × (1 − cold_days ÷ days)
season_fit     = mean(water_fit, heat_fit, cold_fit)
water_gap      = max(0, water_need_mm − usable_water)
```

A bare season has no season_fit (it is left out of the climate mean and min).

### 7.5 Rotation score

```
climate_fit    = 0.5 × mean(season_fit) + 0.5 × min(season_fit)      // the weaker season pulls the score down
priority_i     = mean of crop attribute i over all 3 season slots × 10 // bare slot counts as 0
water_priority = 100 − (rotation_water_need ÷ max_rotation_water_need × 100)
priority_score = Σ(weight_i × priority_i) ÷ Σ(weight_i)               // if all weights 0, use 50
rule_adjust    = − 8 per consecutive same-family pair (incl. zaid → next kharif)
                 + 6 per nitrogen-fixer directly after a heavy feeder
                 − 6 per bare season where some crop could reach water_fit ≥ 60
total          = clamp(0, 100, 0.5 × climate_fit + 0.5 × priority_score + rule_adjust)
```

Six priorities (slider 0–5, default 3): **water use**, **forage**, **nitrogen fixation**, **erosion control** (`erosion_cover`), **organic matter**, **market**.
`max_rotation_water_need` = the largest total water need among all generated rotations.
Every rule adjustment adds a plain-language **reason** to the rotation (e.g. "Groundnut then chickpea: same family, pest cycle not broken (−8)").

### 7.6 Feasibility

If any season has `water_gap > 0.40 × water_need_mm` → `feasible = false`, label **"Not feasible without extra water"**. Infeasible rotations are still listed but can't be picked as Option A/B. If fewer than 2 feasible options exist, fill with the best infeasible ones and keep the label.

### 7.7 Confidence

- **High**: no missing days in any window AND `field.soil_tested` AND every crop `regional_common`
- **Medium**: no missing days, soil type only, every crop `regional_common`
- **Low**: missing days, or any crop not `regional_common`, or any crop outside its listed season / start months, or any crop row `verified: false` *(while the starter table is in use, everything will be Low — that is correct and honest; say so on the Evidence screen)*

Return the reasons, not just the label.

### 7.8 Timeline — `buildTimeline(rotation, climate)`

12 cells, June → May. Each cell: `{ month, crop | null, bare: bool, flags: [] }`.
Flags inside a crop's window (per month):
- `heat` if heat_days in that month ≥ 3, and mark **"heat at flowering"** if it's the flowering month = `start + floor(duration × 0.6)`
- `cold` if cold_days ≥ 2
- `dry` if a dry spell of ≥ 10 days falls in that month
- `flood` if heavy_rain days ≥ 1

### 7.9 Benefit badges — compare each rotation with the current one

| Badge | Rule |
|---|---|
| 💧 Less water | rotation water need ≤ 85% of current's |
| 🌱 Adds nitrogen | contains a `nitrogen-fixer` |
| 🐛 Breaks pest cycle | no consecutive same-family pair AND uses at least one family not in the current rotation |
| 🌧 Better infiltration | has a `deep-rooted` or `cover` crop AND fewer bare months than current |
| ₹ Market | market priority ≥ current's + 10 |

Each badge has a one-line explanation shown on tap/hover.

### 7.10 Information gaps and "Check locally" (generated per rotation)

Information gaps (examples): unverified crop values, missing data days, soil not tested, coarse grid ("rain may differ at your field"), no local price data.
Check locally (examples): "Ask your KVK if {crop} varieties suit {month} sowing here", "Confirm your well can supply {gap} mm in {season}", "Get a soil test for nitrogen and organic carbon".

---

## 8. UI details

### 8.1 Climate cards

One card each: season rainfall, heat days, cold days, longest dry spell, heavy-rain days, soil wetness, 30-year rain trend, 30-year heat trend, groundwater trend (GRACE, demo farm only), satellite soil moisture (SMAP, demo farm only), rain cross-check (IMERG vs POWER, demo farm only).

Each card shows: **value · plain meaning · dataset + resolution · ⓘ glossary**. If data is missing, the card says so; it never shows 0 for missing.

### 8.2 Compare screen

Three columns (stacked on mobile): **Your current · Option A · Option B**. Each column:
1. Crops by season (photo or placeholder) with sowing–harvest months
2. Total score (0–100) + confidence label with reasons
3. Feasibility label if infeasible
4. Badges
5. 12-month timeline strip: crop colours, hatched **bare months**, icons for vulnerable windows
6. Five sections, always in this order: **Why** · **Evidence (NASA numbers)** · **Benefits** · **Information gaps** · **Check locally (KVK / agri officer)**

Below the columns: "See all rotations" (sortable table) and "Excluded" (with reasons).

### 8.3 Glossary (`glossary.mjs`)

At least: kharif, rabi, zaid, rotation, nitrogen fixer, cover crop, deep-rooted, drought-tolerant, heat stress, dry spell, heavy rain, soil wetness, effective rain, grid / resolution, satellite vs model vs ground data, confidence, KVK. One or two plain sentences each. Popups open with click/tap and keyboard, close with Esc.

### 8.4 What if?

Sliders: rain −50%…+30%, temperature +0…+3 °C (adds to tmax, tmin, t2m), irrigation per season. Re-run scoring on modified climate; show how the 3 columns' scores change. 4-year sensitivity table: score of each of the 3 rotations in each available ag year, plus best/worst year.

---

## 9. NASA data

### 9.1 NASA POWER daily (live, no key)

```
https://power.larc.nasa.gov/api/temporal/daily/point
  ?parameters=PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,GWETROOT,GWETTOP
  &community=AG&longitude={lon}&latitude={lat}
  &start={YYYYMMDD}&end={YYYYMMDD}&format=JSON
```

Request one range covering 1 Jun `Y−3` → 31 May `Y+1` (4 ag years: main year + sensitivity). Values are under `properties.parameter.{NAME}.{YYYYMMDD}`. **−999 means missing → null.**

### 9.2 NASA POWER monthly (live, for 30-year trend)

```
https://power.larc.nasa.gov/api/temporal/monthly/point
  ?parameters=PRECTOTCORR_SUM,T2M_MAX
  &community=AG&longitude={lon}&latitude={lat}
  &start=1991&end=2024&format=JSON
```

Keys are `YYYYMM`; **month `13` is the annual value — skip it** when building monthly series. Trend = ordinary least-squares slope of annual totals (rain) / annual means (Tmax), × 10 = per decade. Show the slope and the years used. Don't call a trend "significant" unless you also compute and show a p-value.

### 9.3 Fetch behaviour (`data.mjs`)

- 20 s timeout with `AbortController`
- Cache successful responses in localStorage keyed by `lat,lon,start,end` (round lat/lon to 2 dp)
- On failure: use cache, then for the demo farm use `data/demo-power-*.json`; otherwise show a clear error with a retry button
- Record request URL, retrieval time and `source` for the Evidence screen
- `scripts/fetch-demo.mjs` (Node 18+, uses global fetch) downloads both demo files. If your environment has no network, write the script and tell me to run it.

### 9.4 Satellite evidence (`data/demo-satellite.json`, prepared by the data person)

Expected shape — build the UI against this; show "not loaded yet" if the file is missing:

```json
{
  "location": { "lat": 22.30, "lon": 70.80 },
  "imerg": { "resolution": "0.1° (~10 km)", "monthly_rain_mm": { "2025-06": 0 }, "power_vs_imerg_note": "" },
  "smap":  { "resolution": "9 km", "monthly_anomaly": { "2025-06": 0.0 }, "note": "" },
  "grace": { "resolution": "~300 km (coarse)", "annual_lwe_cm": { "2003": 0 }, "trend_cm_per_year": 0, "note": "" },
  "retrieved_at": "", "sources": [ { "name": "", "doi_or_url": "" } ]
}
```

---

## 10. Build steps

Do one step per prompt. Each step ends with: tests pass (`node --test tests/`), app opens without console errors, `git commit -m "step N: …"`.

| # | Task | Done when |
|---|---|---|
| 1 | Scaffold files from §3. Hash router with the 7 routes in §4, nav, banner. Placeholder content per screen. | Every route opens; no console errors |
| 2 | Field form §5.1 with validation (§2.6) and localStorage. "Load demo farm" fills `DEMO_FARM`. Current-rotation pickers per season (incl. "Bare"). | Form saves, reloads, rejects bad input |
| 3 | `data/crops.json` (§6) + `validateCrops()` + `generateRotations()` §7.2. Tests: no overlaps, exclusions have reasons, current rotation always present. | Tests pass; a test prints rotation count |
| 4 | `data.mjs` §9.1/9.3 + `scripts/fetch-demo.mjs` + `seasonClimate()` §7.3. Tests with a small fixture incl. −999 values and a known dry spell. | Demo farm loads offline from bundle |
| 5 | Scoring §7.4–7.7 + priority sliders. Tests: weaker season caps the score; changing a slider changes the order; infeasible rule; confidence reasons. | Tests pass |
| 6 | Compare screen §8.2 (minus timeline): 3 columns, 5 sections, badges §7.9, gaps/checks §7.10, all-rotations table, excluded list. | Demo farm shows current + A + B |
| 7 | Timeline §7.8 on Compare. | Bare months + vulnerable windows visible |
| **— Saturday 21:00 checkpoint: demo farm → current + 2 options, 5 sections, sliders work —** |||
| 8 | Climate screen §8.1 with POWER cards, monthly trend §9.2, glossary §8.3, resolution notes. | Cards show real numbers |
| 9 | Satellite cards + Evidence entries from `demo-satellite.json` §9.4. | Shown with source labels, or "not loaded yet" |
| 10 | What if? §8.4 + 4-year sensitivity. | Sliders move scores; table fills |
| **— Sunday 12:00 feature freeze —** |||
| 11 | Mobile pass (360 px), keyboard + screen-reader labels, README, deploy to GitHub Pages. | Public link works logged-out on a phone |
| 12 | *(only if ahead)* Leaflet map pin on Field screen; Hindi/Gujarati/Marathi labels for nav + crop names; print view. | Works without breaking 1–11 |

---

## 11. Bugs that must not happen (seen in the previous prototype)

- Importing/parsing coordinates producing `NaN`
- Deleting something leaving stale IDs in comparison state
- Different limits in different places for the same value (keep limits in one constants object)
- Saving the field form resetting What-if slider values

---

## 12. Evidence screen must list

All `MODEL` constants with "illustrative" tags · every formula in §7 · each dataset with resolution and what it was used for · request URLs + retrieval times · crop table with `source_note` per row · limitations:
- Scores are relative comparisons from stated rules, not yield or profit predictions
- Crop values are not yet validated by local agronomists
- POWER ≈ 50 km grid, SMAP 9 km, IMERG ≈ 10 km, GRACE ≈ 300 km: area patterns, not field measurements
- POWER soil wetness comes from the MERRA-2 model, not directly from a satellite

---

## 13. Credits (README + footer)

NASA POWER (LaRC), GPM IMERG, SMAP, GRACE/GRACE-FO · photo licences (e.g. Wikimedia CC BY-SA, with attribution) · libraries used · "Built with help from OpenAI Codex" · team names.