# TerraPlan V3 Field Studio — UI/UX and regression review

## Scope and preservation

The user requested a whole-site recheck, an interface at least as considered as the earlier TerraPlan experience, moving 3D models, crop photographs, and a separately hosted site. The existing V2 Site and public V3 Pages site are preserved. Implementation is on `codex/terraplan-v3-studio`; the scoring/data engine is unchanged from the tested V3 model. Step 12 is checkpoint commit `a4d239b`.

## Improvements made from rendered review

- Replaced the scaffold presentation with a quiet sidebar, clear workspace header, locally bundled typography, warm paper surfaces and consistent field/data panels. Used the earlier screenshot as a design reference, without copying V2 code or datasets.
- Built an original procedural WebGL farm with moving crop leaves and a turning wind vane. Added rotation, season appearance, pause/reset, keyboard controls, visibility pause, reduced-motion support and a static SVG fallback. The scene is labelled as an illustration, not NASA imagery or a crop simulation.
- Curated twelve representative crop-image entries with original Commons source links and per-image attribution/licence. Kept scientific crop rows and verification flags unchanged. Sources and local JPEG signatures are checked in tests.
- Moved language/print controls into the mobile menu after the first 360-pixel render showed too much header space. Their partial-translation scope remains visible in the menu.
- Shortened the mobile Compare introduction, grouped source/selection details into an accessible disclosure, moved relative scores ahead of detailed crop rows and added current/A/B jump controls. All five explanation sections and all retained/excluded rotations remain accessible.
- Darkened supporting labels that fell below the contrast target in rendered checks. Kept non-colour labels, visible focus and native controls.

## Verified behavior

The regression suite contains 99 passing tests. It covers field validation/storage, crop validation/generation, exact model formulas and boundaries, missing weather, NASA parsing/cache/fallback/provenance, complete-year trends, timelines, satellite missing states, scenarios, optional map/label/print behavior, photo provenance and deployment contents.

Browser checks at 360×800:

- All seven routes: one main heading, zero unlabelled form controls and no document overflow.
- Invalid area 0: visible error, aria-invalid, no field save. Corrected area 2: versioned field save succeeds.
- Bundled Rajkot: 17 climate/satellite cards, 36 comparison month cells, six crop photos and scores 56.35 / 71.42 / 70.13.
- Water priority 5 updates ranking while keeping slider focus. Rain −50% changes scores from 56.19 / 71.87 / 70.30 to 53.69 / 68.66 / 66.41 under that weight, keeping compared IDs and saved field bytes unchanged.
- Saving the field preserves the −50% experiment. Reset restores default scores 56.35 / 71.42 / 70.13.
- Moving the field to another location produces Not scored with zero stale weather markers; restoring matching coordinates permits the original data again.
- Hindi, Gujarati, Marathi and English labels preserve identical comparison scores and have no body overflow.
- The Option A jump moves keyboard focus to its heading. Printing expands required explanations and restores original disclosure states after printing/cancellation.
- A reduced-motion preference starts the supported 3D scene with Play motion. Simulated no-WebGL shows a static illustration, disables scene-only controls and leaves the planner usable.
- Optional map checks at the Step 12 checkpoint verified no external map request before Open, valid attributed Leaflet loading, keyboard centre selection, unsaved coordinates, retained edits and clean navigation disposal.

Desktop review at 1440×1000 covers the sidebar/overview and three-column comparison. Screenshots are retained beside the design evidence record. Normal tested flows have no JavaScript console errors.

## Limits that remain visible

Crop constants are illustrative and unverified. Satellite observations have not been supplied, so the corresponding cards say Not loaded yet. The 3D model is conceptual. Labels are partial and need local-speaker review. Browser checks use emulated viewports, not a certification across every phone, screen reader or printer. The new Site starts owner-private, matching the earlier Site audience.
