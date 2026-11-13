# TerraPlan V3

NASA Space Apps 2026 · **Field Shift: Adapting Farms with NASA Data**

**TerraPlan supports your decision. It does not replace your judgment or local advice.**

V3 is a fresh build for small farms in western India. The planned workflow starts with the farmer's **current rotation** and compares it with two alternatives using stated rules and clearly labelled NASA evidence.

## Current status: step 1 only

This branch implements the first build step in [AGENTS.md](AGENTS.md): the root-level scaffold, seven routes, mobile navigation, persistent decision-support banner and honest placeholder screens. It does not copy V2 application code or datasets. V2 remains in the `main` branch and the existing release history.

Field entry, saving, demo loading, crop generation, NASA requests, climate metrics, scoring, confidence labels, timelines and scenarios are **not implemented yet**. The Welcome demo button is disabled and explains that loading is added in step 2.

The empty crop table and daily/monthly JSON placeholders deliberately contain no observations or invented values. The optional satellite file is absent. No missing value is shown as zero.

## Run locally

From the repository root:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

On Windows, use `python` instead of `python3` if needed. Open **http://127.0.0.1:8080/#/**. Another option from the specification is `npx serve .`.

With Python on your PATH, `npm start` serves the same root at http://127.0.0.1:3000. There is no build step, bundler, framework, application backend or npm runtime dependency.

## Routes

| Hash | Screen | Step 1 behavior |
| --- | --- | --- |
| `#/` | Welcome | Purpose, Start button and explicit demo availability |
| `#/field` | My field | Field-entry placeholder for step 2 |
| `#/climate` | Your climate (NASA) | Missing/unconnected weather placeholder |
| `#/priorities` | Priorities | Placeholder for scoring priorities |
| `#/compare` | Compare rotations | Your current / Option A / Option B layout; five explanation sections |
| `#/whatif` | What if? | Scenario and sensitivity placeholder |
| `#/evidence` | Evidence | Explicit data/engine readiness and limitations |

Unknown routes provide a return-to-Welcome action. Direct hashes and browser back/forward are supported. Mobile navigation can be expanded/collapsed; each route updates the title, active link and main-content focus. The decision-support message remains outside the routed content.

Two glossary popups explain the terms used by this scaffold: **KVK** and **crop rotation**. They open with click/keyboard and close through the Close button or Escape. The full glossary is scheduled for step 8.

## Files

```text
index.html / style.css     Shared shell and mobile-first presentation
app.mjs                    Hash navigation, menu and glossary wiring
views.mjs                  Seven screen renderers and route resolution
engine.mjs                 Pure, centralized MODEL constants; no scoring yet
data.mjs                   One Rajkot DEMO_FARM and explicit readiness states
glossary.mjs               Scaffold definitions and popup helper
data/crops.json            Empty until step 3
data/demo-power-daily.json Explicit not-loaded placeholder until step 4
data/demo-power-monthly.json Explicit not-loaded placeholder
scripts/fetch-demo.mjs     Non-downloading stub until step 4
tests/                     Scaffold configuration, data and routing checks
AGENTS.md                  User-supplied V3 specification, preserved verbatim
```

The downloader stub exits with a clear message and changes no files. It must not be mistaken for a completed NASA integration.

## Checks

```bash
node --test tests/
npm run check
npm run verify
```

The scaffold contains nine tests. They check route coverage/rendering, unknown-route recovery, the comparison layout's current rotation and explanation order, the shared banner, supported glossary lookups, central constant ranges, the Rajkot definition and honest data placeholders. A small `tests/index.js` entrypoint makes the requested `node --test tests/` command work on Node.js 24.

There are no generator, crop-validation, climate-parsing or scoring tests yet; those implementations belong to later steps. Browser route/menu checks complement these unit checks and are recorded in the step's completion report.

## Next build step

**Step 2:** validated field form, per-season current-rotation pickers (including Bare), Rajkot demo loading and versioned local storage. Field saves must preserve What-if state. Do one build step per prompt, test and check the app, then commit as specified in AGENTS.md.

Public GitHub Pages deployment is scheduled for step 11. This scaffold does not replace the existing V2 live Site.

## Honesty and credits

Future scores must be relative comparisons from stated rules, never yield/profit predictions. Crop constants need local agricultural validation. NASA/model/satellite/ground sources must be distinguished when their actual integrations are added.

Planned data credits: NASA POWER (LaRC), GPM IMERG, SMAP and GRACE/GRACE-FO. None is connected in this step. No V2 photographs or external libraries are bundled in the fresh V3 scaffold. Built with help from OpenAI Codex. Team names have not been supplied yet.

Original project software is covered by [LICENSE](LICENSE). Provider data and future photos retain their own terms. Independent hackathon project; no NASA endorsement is claimed.
