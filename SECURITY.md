# Security and data boundaries

V3 step 2 is a static app with validated field entry and browser-local persistence. It has no login, backend, file imports or remote data requests. Field names are escaped when rendered. Stored records are versioned and validated before use; corrupt records are preserved until a valid replacement is explicitly saved. Storage failures show a message instead of claiming success.

The field profile, including coordinates, is stored under `terraplan.v3.field` only when Save field is chosen. Anyone with access to this browser profile or scripts running on the same origin may access local storage. Clearing site storage removes the saved field. No coordinates are transmitted in this step; future NASA requests must explain their actual behavior.

Use GitHub private vulnerability reporting if it is enabled for this repository. Otherwise request a private reporting channel without posting sensitive details, tokens or actual field profiles.

Do not add credentials or private hosting files. Future NASA coordinates, browser storage and imported data need explicit handling and honest provenance. No formal security audit is claimed.
