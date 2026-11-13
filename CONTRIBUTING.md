# Contributing

TerraPlan welcomes focused improvements to its usability, reproducibility and scientific transparency. The current crop rules are an illustrative Indian seasonal template and need regional validation.

## Development

1. Clone the repository and use Node.js 22+ (CI uses 24).
2. Run `npm start` and open the printed loopback URL.
3. Make a focused change in the tracked `dist/` source or supporting docs/scripts.
4. Run `npm run verify`.
5. For interface changes, manually check desktop/mobile navigation, keyboard focus, errors and relevant workflows.
6. Open a pull request describing the user-visible result, evidence and verification limits.

There are no required application packages. `npm ci` is supported by the lockfile but is not required to run the current app. Do not commit local storage exports with real field coordinates or private hosting configuration.

## Model changes

- Explain the scientific reason and cite authoritative sources with regional scope and units.
- Add meaningful tests for affected seasonal calculations, missing data, ranking or import behavior.
- Bump `MODEL_VERSION` and explain old-plan handling when calculations change. Keep the current strict-version check unless an explicit migration is implemented and tested.
- Update `docs/MODEL.md`, the Evidence Library, fixtures if applicable, and the changelog.
- Do not present tests passing as evidence that an agronomic assumption is validated.
- Do not claim yield, profit, water savings or soil improvement without suitable measurements and evaluation.

## Images and data

Preserve source licenses and attribution. New photos need an original source URL, author and license in the credit metadata. Do not apply the repository's MIT license to third-party photos or NASA/provider data. Avoid large new datasets without a documented purpose, source, retrieval process and completeness checks.

## Reporting problems

Use a bug or feature form. Include browser, relevant settings, expected behavior and steps to reproduce. For scientific concerns, identify the formula/parameter and provide a source. For sensitive vulnerabilities, follow `SECURITY.md` instead of posting data or credentials publicly.
