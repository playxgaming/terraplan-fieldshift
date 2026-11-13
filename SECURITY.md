# Security policy

TerraPlan is a hackathon prototype; no formal security audit or response-time guarantee is claimed. Only the current `main` branch is maintained in this repository.

## Reporting

Use this repository's **Security → Report a vulnerability** option if the owner has enabled private vulnerability reporting. If it is unavailable, open an issue requesting a private reporting channel without including exploit details, credentials, actual field profiles or other sensitive data. Never publish tokens or real user exports in an issue.

## Application boundary

- The application is static and runs in the browser. Profiles/plans are device-local, not cloud-encrypted or synchronized.
- A custom-location request sends its coordinates to NASA POWER. Optional fonts are requested from Google Fonts.
- Imported JSON is user-supplied. Validation and recalculation do not authenticate its observations as NASA originals.
- The local Node preview is a loopback-only development server, not a hardened production server.
- Private hosting credentials, `.openai/` and `.env` files must stay outside this distribution.

Relevant review targets include imported schema validation, text interpolation, coordinate parsing, browser storage, dependency/action updates and resource handling. See `docs/AI-REVIEW-HANDOFF.md` for historical audit questions.
