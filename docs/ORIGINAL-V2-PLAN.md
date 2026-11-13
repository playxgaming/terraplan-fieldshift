# TerraPlan V2 — implementation proposal

Status: plan only. The deployed site has not changed.

## Product direction

Turn the existing single-page prototype into a coherent farm-planning workspace. The main journey is **add a field → understand its weather history → compare feasible rotations → test a scenario → save an evidence-backed plan**.

Primary users: farmers exploring options and agricultural extension workers explaining trade-offs. Secondary users: hackathon judges inspecting the data and model.

V2 should offer more depth around that decision, with a consistent visual identity and dependable data. Start with one supported Indian region and explicitly state which crop parameters have been checked. Keep international coordinates available for weather exploration, without implying locally validated crop advice.

## 1. Proposed site structure

| Area | Main content and interactions | Completion criterion |
| --- | --- | --- |
| Home | Strong problem statement, product preview, three-step explanation, real-data provenance, Start planning and Open demo buttons | New visitor can identify the user, problem and action immediately; no invented impact figures or testimonials |
| Dashboard | Active field, observed rainfall/temperature summaries, saved plan previews, history charts, suggested next action | Selecting a field changes all relevant content; empty state guides the first action |
| My fields | Add/edit/delete field, name, coordinates, area, soil texture, irrigation and crop history; list/map view | Fields persist after refresh; area changes totals but never per-hectare scores |
| Rotation planner | Guided inputs, available seasons, previous crop, water budget and priorities; ranked candidates with exclusions explained | Seasonal and soil constraints apply before ranking; no matching option produces a useful empty state |
| Compare & simulate | Compare up to three rotations, monthly calendar, component scores, water assumptions, baseline vs scenario | Tables and charts use identical calculations; changed inputs and unchanged historical observations are visually distinct |
| Evidence library | NASA record metadata, retrieval time, period, resolution, completeness, crop assumptions, references and formulas | A visible result can be traced to its source, inputs and model version |
| Saved plans | Name a plan, reopen its exact snapshot, print a report, download/import JSON, compare versions | A saved plan reproduces the same results; model changes do not silently overwrite it |

Use a persistent desktop sidebar and a compact mobile navigation. Page changes must preserve the selected field and unfinished planning inputs. Use meaningful URLs; browser back/forward should work.

## 2. Visual direction

- Preserve TerraPlan's forest green, warm cream and agricultural illustration identity. Add restrained terracotta for scenario changes and amber for attention states.
- Use larger body text, clearer form labels, spacious layouts and consistent cards, buttons and charts.
- Reserve the hero illustration for Home. Workspace pages prioritize maps, charts and decisions.
- Dashboard: active-field selector at top; observed-weather cards; rainfall/temperature history; saved-plan list.
- Planner: step indicator and inputs beside results on desktop; a single readable column on mobile.
- Comparison: aligned metrics, a calendar and plain-language explanations. Never rely on color alone.
- Provide loading, missing-data, empty, offline and error states. All buttons must perform a useful action.
- Support keyboard navigation, visible focus, dialog focus handling, readable contrast and reduced motion.

## 3. High-value features for the next release

### A. Field profiles

Capture field name, coordinates, area in hectares, soil texture, irrigation assumptions and previous crop. Keep profiles on the device initially. Provide an explicit remove action, export and a notice that browser storage is device-specific. Do not add account creation or cloud sync to this release.

Start with a coordinate picker and location presets. A map pin can follow once a tile provider and its attribution, usage limits and availability have been checked. A pin represents a field reference location, not a field-resolution satellite measurement. Boundary drawing is later work.

### B. Weather history with context

Expand from the current fixed 2024 monsoon to selectable historical seasons and several complete years, subject to successful data retrieval. Show monthly precipitation, temperatures, threshold exceedances and the observation period. Compare like-for-like seasons across years.

For a short record, use wording such as “difference from selected years” rather than claiming a long-term climate trend. Display missing days and suppress derived scores when completeness rules fail. Charts should have a readable table alternative.

### C. A more credible rotation engine

The present prototype screens weather only for the first crop and uses illustrative constants. V2 should:

1. Define supported crops using cited regional planting windows, duration ranges, water assumptions and soil tolerances.
2. Screen both seasons against their corresponding historical weather windows.
3. Apply hard feasibility constraints before ranking. Explain excluded candidates.
4. Distinguish a required input that is missing from a genuinely unsuitable crop.
5. Show water, heat, soil match and family-diversity components separately.
6. Keep soil-diversity heuristics separate from measured soil health.
7. Compare candidates against the farmer's current rotation.
8. Evaluate sensitivity across selected historical years and assumptions; show a score range and rank changes without presenting them as calibrated confidence intervals.

If regional crop sources are unavailable, retain clearly marked illustrative mode. Do not relabel that mode as validated advice merely because the interface is more polished.

### D. Scenario laboratory

Offer observed historical baseline, lower rainfall, hotter season and reduced irrigation presets, alongside custom sliders. Allow irrigation and weather adjustments per season. Label assumptions next to each control and show which values changed.

Display side-by-side changes in component scores and modeled water gaps. Never change the observed history to make a scenario appear measured. A stable top-ranked crop is a legitimate result.

### E. Saved reports

Create a print-friendly report containing field inputs, selected rotation, calendar, scenario, alternatives, reasons, source URLs and limitations. Browser printing can produce a PDF without a paid service. Keep structured JSON import/export for reproducibility; validate imported versions and values.

### F. Guided demo

Provide a one-click demo with a prepared field and a reliable saved NASA dataset. Explain “what changed” as the user explores a scenario. Include a judge-friendly evidence panel and a short project story. Label fictional farmer personas as illustrative.

## 4. Data integration sequence

| Order | Data | Role | Integration rule |
| --- | --- | --- | --- |
| First | Existing NASA POWER integration | Rainfall and temperature history across selected seasons | Preserve requests, units, periods, fill values, completeness checks and cached demo records |
| First | Regional crop guidance and manual soil inputs | Crop calendars, water/heat assumptions and feasibility | Every constant needs a source or an explicit illustrative label; never infer measured soil health from texture alone |
| Later | GPM IMERG | A precipitation layer or an independently identified rainfall comparison | Select a product/run and aggregation window; handle units, coverage and provenance; do not simply average it with POWER |
| Later | SMAP enhanced soil moisture | Regional surface-soil-moisture context | Verify product access, quality flags and coverage; show grid resolution and missing pixels; do not portray it as a farm probe or root-zone measurement |

NASA describes IMERG as a merged precipitation product, with documented half-hourly 0.1° fields. SMAP's enhanced L3 catalog describes a daily 9 km grid. Those scales must remain visible when displaying a small field. A rendered map is not sufficient evidence that data have been retrieved and validated.

Do not add several satellite layers merely to fill the navigation. Finish the weather-to-rotation journey first.

## 5. Technical approach

Reuse the current static hosting and working NASA integration for the first stage. Split the growing app into UI components, page controllers, data adapters, validation, storage and a pure scoring engine. Avoid combining a complete framework migration with the science changes.

Suggested logical modules:

```text
pages/       home, dashboard, fields, planner, compare, evidence, plans
components/  navigation, forms, charts, cards, dialogs, notices
data/        NASA adapters, cached records, crop definitions, references
domain/      field validation, seasonal feasibility, scoring, scenarios
storage/     field profiles, immutable plan snapshots, schema migrations
styles/      tokens, shared components, responsive layouts
```

Key data records:

- **Field:** id, name, latitude, longitude, hectares, soil texture, previous crops, irrigation assumptions, units, schema version.
- **Dataset:** product, request URL, requested location, period, parameters, units, retrieval timestamp, completeness and raw record reference.
- **Crop definition:** regional scope, calendar windows, duration and parameter ranges, references, validation status and version.
- **Plan snapshot:** field snapshot, both season definitions, scenario inputs, dataset references, crop-definition version, model version, rankings and creation timestamp.

Keep API credentials out of browser files. If an authenticated NASA source or language model is later added, introduce a server adapter with request validation, caching and bounded usage. Account sync needs a separate access and data-retention design.

## 6. Build order and release gates

| Stage | Work | Gate before moving on |
| --- | --- | --- |
| 1 — Product foundation | Navigation, responsive design system, Home, Dashboard and field profiles; reuse the current engine with its limitations visible | Field creation/editing/persistence and route navigation work on mobile and desktop |
| 2 — Evidence and science | Historical charts, seasonal windows, cited crop definitions, both-season feasibility, complete-data rules and model versioning | Every score is reproducible and traceable; infeasible or incomplete cases produce appropriate states |
| 3 — Decision workflow | Compare three rotations, scenario laboratory, baseline comparison, save/reopen plans and printable reports | Saving/reopening/exporting a plan preserves its inputs and calculated results |
| 4 — Presentation and reliability | Guided demo, evidence/story content, accessibility, responsive QA and deployment | Demo works with saved data; all navigation and actions work; no illustrative data are mislabeled |
| 5 — Optional extensions | One additional NASA product, one locally relevant language, then a grounded explanation assistant if useful | Each addition solves a demonstrated user need and passes its own data/quality checks |

Stage 1 is the recommended next implementation scope. Stages 2 and 3 are the substantive product upgrade. Stage 4 completes the hackathon presentation. Stage 5 is optional and should not block a finished core demo.

## 7. Verification plan

- Test seasonal date boundaries, units, missing NASA values, infeasible rotations, both-season calculations and deterministic ranking.
- Check that increasing water cannot worsen water fit and increasing heat cannot improve heat fit under the same thresholds.
- Verify save/reopen and JSON import/export round trips, including older or malformed schemas.
- Verify that changing fields or slow overlapping data requests cannot show another field's results under the current field's label.
- Check map location and data grid labels, chart axes, units and accessible table equivalents.
- Exercise the full add-field → compare → scenario → save → reopen → export path on desktop and mobile.
- Confirm every modeled benefit is labeled as modeled; do not show invented yield, profit, soil-carbon gains or measured water savings.
- Request external agronomic review before declaring local crop advice validated; report that review separately from software test results.

## 8. Defer until after the core release

Marketplace, payments, social feed, live sensor integration, yield/profit forecasts, pest diagnosis from photos, automated irrigation control, real-time alerts and open-ended AI chat. Each needs additional data, validation or operating infrastructure. A later assistant should explain the selected plan and cite its inputs; the deterministic engine remains the source of calculated scores.

## 9. Proposed success criteria

1. A new user can create a field and reach a rotation comparison without assistance.
2. Every displayed recommendation includes reasons, provenance, limitations and season coverage.
3. A judge can reproduce a saved result from the exported inputs and model version.
4. The demo remains usable when NASA requests fail.
5. Changing soil, season, water or priority produces consistent, explainable changes.

Measure usability with actual sessions; do not claim a time-to-completion or farmer benefit until it has been observed.

## Sources

- [NASA POWER daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/)
- [NASA GPM IMERG overview](https://gpm.nasa.gov/data/imerg)
- [NASA IMERG V07 technical documentation](https://gpm.nasa.gov/resources/documents/imerg-v07-technical-documentation)
- [NASA SMAP enhanced L3 daily 9 km catalog](https://data.nasa.gov/dataset/smap-enhanced-l3-radiometer-global-and-polar-grid-daily-9-km-ease-grid-soil-moisture-v006-3df00)

Product priorities and architecture above are proposed design decisions, not claims of implemented features.
