# Security and data boundaries

V3 steps 1–12 is a static app with validated field entry, browser-local persistence and locally computed scores/comparisons. It has no login, backend or user file imports. User-triggered weather requests go to NASA POWER. Field names and loaded metadata are escaped when rendered. Field/cache records are versioned and validated before use. Storage failures show a message instead of claiming success; corrupt records are not deleted by fallback handling.

Priority weights are validated whole numbers from 0 to 5 and are held in tab memory. Slider changes make no remote requests and write no browser storage. They reuse already loaded weather; missing/stale weather is not silently scored. Priority changes, field saves and weather caching leave What-if storage alone.

Comparison options are derived from the latest scoring result rather than persisted IDs. Table sort keys are restricted to the shared supported-column list, and sorting does not write storage or change selection. Comparison text and badge explanations are escaped before HTML rendering. The current crop table has empty photo URLs; no external crop images are fetched.

The field profile, including coordinates, is stored under `terraplan.v3.field` only when Save field is chosen. Choosing Load NASA climate sends latitude/longitude rounded to two decimal places to NASA POWER, along with requested parameters/date ranges. Successful responses are cached under `terraplan.v3.power.v1:` keys. Field saves and weather caches do not change What-if keys. Bundled demo mode fetches local files without contacting NASA.

Anyone with access to this browser profile or scripts running on the same origin may access local storage. Clearing site storage removes saved fields and weather caches. NASA/cache/bundle responses are checked for expected parameter shape, location and period before use. NASA fetches have a 20-second abort/timeout including response-body reads. No secrets or API keys are stored.

Use GitHub private vulnerability reporting if it is enabled for this repository. Otherwise request a private reporting channel without posting sensitive details, tokens or actual field profiles.

Do not add credentials or private hosting files. Future NASA coordinates, browser storage and imported data need explicit handling and honest provenance. No formal security audit is claimed.

What-if settings are validated and stored only under `terraplan.v3.whatif` in a versioned envelope. Experiments work on copies of historical records; missing values and original observations are retained. These settings do not write the field profile or trigger network requests. Invalid persisted settings remain stored until a deliberate edit/reset replaces them. Scenario field saves do not reset settings.

Satellite summaries require demo-location, retrieval-time and HTTPS/DOI provenance checks before values are exposed. Invalid products are independently skipped. These summaries never alter rotation scores. The checked-in manifest contains no satellite observations.

The Pages workflow verifies tests before publishing an allowlist of runtime modules, public demo data, licence and build metadata. It excludes repository history, instructions, tests and private files. Deployment permissions are confined to the deployment job; actions are pinned to commits. The public artifact has no user field profiles, credentials or browser caches. Repository visibility remains private.

The optional field map loads only after an explicit Open field map click. It loads integrity-pinned Leaflet 1.9.4 from unpkg and visible HTTPS map tiles from OpenStreetMap; those providers receive normal request metadata and the map area. There is no geolocation request or automatic NASA fetch. Map coordinates update a draft and are saved only by the existing Save field action. Coordinate validation uses the same field limits; stale route loads are discarded and maps are disposed on navigation.

Regional labels are static text inserted with DOM text APIs. Language preferences write only `terraplan.v3.labels`; full crop records and scores are never translated or mutated. Printing uses the browser and does not send a document to another service. Print expansion is temporary and restored on afterprint. The public allowlist includes the three optional feature modules.

The Studio field illustration uses locally served WebGL code and a local fallback; it never reads or modifies field/scoring state. Representative crop images and font files are served locally. Photo source/licence links open explicitly from Evidence. The separate Studio audience defaults owner-private; no existing Site access is changed.
