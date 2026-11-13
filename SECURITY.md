# Security and data boundaries

V3 step 4 is a static app with validated field entry and browser-local persistence. It has no login, backend or user file imports. User-triggered weather requests go to NASA POWER. Field names and loaded metadata are escaped when rendered. Field/cache records are versioned and validated before use. Storage failures show a message instead of claiming success; corrupt records are not deleted by fallback handling.

The field profile, including coordinates, is stored under `terraplan.v3.field` only when Save field is chosen. Choosing Load NASA climate sends latitude/longitude rounded to two decimal places to NASA POWER, along with requested parameters/date ranges. Successful responses are cached under `terraplan.v3.power.v1:` keys. Field saves and weather caches do not change What-if keys. Bundled demo mode fetches local files without contacting NASA.

Anyone with access to this browser profile or scripts running on the same origin may access local storage. Clearing site storage removes saved fields and weather caches. NASA/cache/bundle responses are checked for expected parameter shape, location and period before use. NASA fetches have a 20-second abort/timeout including response-body reads. No secrets or API keys are stored.

Use GitHub private vulnerability reporting if it is enabled for this repository. Otherwise request a private reporting channel without posting sensitive details, tokens or actual field profiles.

Do not add credentials or private hosting files. Future NASA coordinates, browser storage and imported data need explicit handling and honest provenance. No formal security audit is claimed.
