# TerraPlan V2 — delivered scope

Implemented on November 12, 2026 against the V2 proposal.

## Available now

- Redesigned Welcome page, dashboard and responsive workspace navigation.
- Multiple field profiles, editable area/soil/previous crop/irrigation, browser persistence and field switching.
- Four complete historical crop years for the saved Pune location: June 2021–May 2025. Custom coordinates can request the same period from NASA POWER.
- Monthly rainfall and mean-temperature charts with data-table alternatives.
- Separate four-month screening windows and irrigation settings for both seasons.
- Five candidate pairs, with calendar/soil exclusions explained before ranking.
- Up to three rotation comparisons, independent rainfall/heat adjustments for each season and baseline/hot-dry/low-irrigation presets.
- Four-year sensitivity tables, with score ranges rather than forecast confidence claims.
- Saved snapshots with field inputs, source records, scenario, model version and reproducible results.
- Two-snapshot comparison, JSON export/import, and a browser print view for PDF output.
- Source metadata, formulas, crop assumptions and limitations in the Evidence Library.
- Missing-day checks, bounds validation, timeout/cancellation, stale-response protection and storage failure messages.
- Keyboard focus styles, accessible slider names, mobile navigation focus handling and reduced-motion support.

## Scientific improvements and limits

V1 screened weather for the first crop only. V2 screens both selected windows independently. Cereal demand values now use midpoints of broad FAO water-demand ranges, with links and ranges shown. Chickpea/mung demand and all heat, soil, exact calendar and scoring assumptions remain illustrative.

The engine does not validate a locally optimal planting calendar or exact crop duration. It uses fixed four-month windows, a fixed 65% usable-rain factor and no carry-over soil-water balance. Paddy-system losses are excluded from the rice demand value. No forecast, yield, profit, soil-carbon improvement or measured water-saving claim is made.

Regional agronomic review remains pending. This is the boundary between an implemented exploration tool and validated agricultural advice.

## Verification

Eight automated tests pass, covering:

1. Complete data across four crop years and leap-day handling.
2. Calendar/soil exclusions with no numerical score for excluded options.
3. Both-season water/heat sensitivity behaving in the expected direction.
4. Field-area scaling of total modeled volume without changing scores.
5. Missing observations blocking calculations.
6. Immutable snapshots, imported-score recalculation and coordinate/version rejection.
7. Workspace persistence round trips.
8. Late data responses becoming stale after switching fields.

Browser checks exercised the dashboard, scenario presets, plan saving/reload, JSON export/import, field creation with sandy-soil exclusions, two-snapshot comparison, missing-window handling, and mobile navigation at a 390 px viewport. No console errors appeared during those flows. Browser print-to-PDF and custom-coordinate network availability are not independently certified by these checks.

## Deferred as proposed

- Actual map tiles and field boundary drawing. Current field graphics are explicitly labeled illustrations.
- SMAP and IMERG integrations, pending product selection, quality handling and data-access work.
- Local-language expansion and an optional grounded explanation assistant.
- Cloud accounts/sync, forecasting, sensors, marketplace and payments.

The implementation retains the existing private Sites audience. Local source and a portable source archive are included alongside this release note.
