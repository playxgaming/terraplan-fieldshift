# TerraPlan Field Studio design contract

User requested: recheck all V3, match or improve the earlier UI, add moving 3D models, host separately. Preserve the original Site and Pages publication.

Canonical source: this branch codex/terraplan-v3-studio. Step 12 checkpoint: a4d239b. Site project: appgprj_6af744f668288191bacefdd5c597ee9d. Separate deploy directory: ../terraplan-v3-studio; static output dist.

Direction: a calm agricultural planning workspace with a quiet light sidebar, warm paper surfaces, dark ink, wheat-gold and citrus accents, generous typography, compact toolbars and focused data sections. Match the reference's clear left navigation and field-first dashboard without copying V2 code/data. V3's analytical contract stays intact.

Audience/job: small farmers and hackathon judges; identify the field, load weather, compare current with two alternatives and inspect assumptions. Primary actions: Start planning / Explore Rajkot demo, then load climate and compare.

Hierarchy: slim tool header, persistent decision-support note, a practical overview with interactive 3D illustration and a clear next action. Interior screens retain useful controls, grouped field sections, sourced climate cards, legible three-plan comparison and What-if results. Add crop photography only with licence/attribution.

Memorable detail: an actual WebGL field model with crop rows, soil layers, irrigation and gentle wind; rotate/pause/reset controls, visibility pause, reduced-motion respect and a static fallback. Mark illustration clearly; never represent it as NASA imagery or measured field conditions.

Viewports: 360x800, 1440x1000. Verify labels in all four language modes. Stable dimensions; no body overflow; 44px primary controls; keyboard focus visible; reading contrast; no motion required to use planner.

States: loading shows source progress, empty shows next action, error offers retry, partial labels missing records, success shows real source data, map requests remain opt-in. No login/backend is added to the planner. The separate Site audience defaults owner-private, matching the earlier Site.

Check every route, invalid/saved field, offline bundle, current/A/B, priority edits, scenarios and sensitivity, stale data, language drafts, optional map lifecycle and printing. Scores must remain 56.35/71.42/70.13 for Rajkot default data/weights. All prior tests stay meaningful.
