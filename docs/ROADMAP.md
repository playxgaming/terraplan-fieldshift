# Roadmap and review priorities

The original [V2 proposal](ORIGINAL-V2-PLAN.md) is historical planning material. [V2 release notes](V2-RELEASE.md), [visual notes](V2.1-VISUALS.md) and the [full handoff](AI-REVIEW-HANDOFF.md) distinguish delivered work from deferred capabilities.

## First: correctness, trust and validation

- Validate crop windows, durations, water demands and stress thresholds for a specific region with agricultural sources and external review.
- Decide whether an always-excluded maize–mung teaching example belongs in the shortlist.
- Review nonfinite/duplicate coordinate parsing in imports and the meaning of imported provenance.
- Review snapshot recalculation/version discipline, stale comparison selections, inconsistent collection limits and corrupted-storage recovery.
- Explain or improve daily water balance, carry-over moisture and the effect of averaging both seasons.
- Define appropriate hard feasibility constraints without pretending heuristic scores predict yield.

These are documented review targets, not a claim that repository packaging fixed them.

## Then: usable decision support

- Farmer/extension-worker usability sessions and a locally relevant language.
- Crop/cultivar-specific stages and calendars.
- Geographic location selection and an honest grid-footprint map.
- Accessible gallery navigation, dialogs, chart alternatives and robust mobile performance.
- Better backups, storage scaling and a clear plan-migration policy.

## Optional, after evidence supports the need

- One additional NASA layer with explicit source, spatial resolution and quality checks.
- Shared extension-worker workflows/cloud sync with a separate access/privacy design.
- A grounded explanation assistant that cites deterministic model inputs.
- PWA/offline support and measured performance improvements.

Yield/profit forecasting, sensor integration, automated irrigation, marketplace and payment systems are outside the current scope. New features should solve a demonstrated user need rather than increase page count.
