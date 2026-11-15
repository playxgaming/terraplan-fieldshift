# Fifteen-crop release · 15 November 2026

The owner requested mustard, barley and cluster bean, a polished repository, an interactive project guide and GitHub Pages publication. This extends the preserved twelve-crop AGENTS.md specification. The original twelve scientific rows are unchanged.

## Review status

**Literature review completed; local agronomist validation remains pending.** Every crop has `verified: false`. This is an implementation of source-researched prototype profiles, not a claim of expert approval. New rows carry source metadata and a clear assumption note in `data/crops.json`; Evidence and the interactive guide display them. All scores retain Low confidence.

| Crop | Source-supported context | Explicit prototype assumptions |
|---|---|---|
| Indian mustard, *Brassica juncea*, Brassicaceae | ICAR-DRMR varieties include Rajasthan-growing zones and variety-dependent maturity; ICAR rabi guidance supplies sowing context | October/November start bins, five-month duration, 300 mm seasonal water proxy, 32/2 °C thresholds, broad soils, roles, nutrient-demand flag and 0–10 attributes are not locally validated |
| Barley, *Hordeum vulgare*, Poaceae | NFSM package describes October–November sowing and soil context; FAO provides indicative 120–150-day duration and 450–650 mm seasonal water need | Five-month bins, 500 mm within that indicative range, 32/0 °C thresholds, soil categories and all role/attribute values require local review |
| Cluster bean/guar, *Cyamopsis tetragonoloba*, Fabaceae | Directorate of Pulses Development and ICAR kharif/CAZRI research establish crop and seasonal/regional context | July-only start, four-month grain-crop window, 350 mm seasonal water proxy, 40/12 °C thresholds, broad soils, nitrogen/cover/market scores and other attributes remain illustrative |

Water proxies are **total seasonal model crop needs**, not recommended irrigation amounts. Do not substitute an irrigation experiment's applied water or monsoon rainfall range for crop evapotranspiration. Variety, sowing date, soil and local weather change actual demand. No pesticide/fertilizer advice from source documents is copied into the product.

`regional_common` is false conservatively for the additions until local validation is documented; it does not mean the crops are absent from Rajasthan. The flag originally represented Gujarat/Maharashtra and must not be treated as a Jaipur suitability proof.

## Primary references

- [ICAR-DRMR mustard varieties](https://drmr.res.in/rm_varieties.php): crop identity, zones and variety-dependent maturity.
- [ICAR rabi agro-advisory 2021–22](https://www.icar.gov.in/sites/default/files/2022-09/Rabi-Agro-Advisory-2021-22_0.pdf): regional rabi context; not validation of numeric prototype scores.
- [Government NFSM package](https://nfsm.gov.in/ReadyReckoner/NFSM_Package.pdf): barley sowing and soil context.
- [FAO crop water needs](https://www.fao.org/4/s2022e/s2022e02.htm): indicative barley duration/water ranges and the need to adapt to local conditions.
- [Directorate of Pulses Development clusterbean](https://www.dpd.gov.in/CLUSTERBEAN.PDF), [ICAR-CAZRI research](https://epubs.icar.org.in/index.php/AAZ/article/download/92240/37307/487522), [ICAR-IIPR kharif pulses](https://www.icar-iipr.org.in/aicrp-kharif-pulses/): crop/seasonal research context. Some government PDFs were slow to fetch during review; the catalogue does not claim every numerical field was extracted from them.

## Changed model outputs

With the same Jobner weather and default weights, the new catalogue gives **141 retained rotations, 57 exclusions, 130 scored alternatives and 10 unavailable totals**. Current/A/B exact totals are 50.59039725672878 / 71.41463435990337 / 70.23201406778558. Alternatives remain fodder–chickpea–Bare and maize–chickpea–Bare. Winter water gaps remain 235.36 / 93.60 / 93.60 mm.

The slight score movement comes from normalization across a larger crop catalogue, not improved weather, measured yields or a changed scoring formula. The presentation and current README use the new numbers. Earlier dated audit reports remain historical records.

## Software validation and release

`npm run verify`: 110 tests, including new-profile selection, source metadata rejection, Low confidence, current-plan retention, gallery filters, empty matches and safe rendering. Licensed local photos are supplied for all fifteen crop IDs. The guide reuses the original controllable WebGL illustration and local fallback. Public packaging includes the guide, all imported modules, photos and fonts.

The active branch is `codex/terraplan-v3-studio`; Pages now deploys that branch after verification, replacing the previous Pages build as requested. V2 `main` and older V3 source remain preserved. Repository visibility changes only under the owner's explicit authorization in this chat. GitHub README links to the interactive site because GitHub does not execute embedded JavaScript in README files.

Browser checks: guide gallery loaded all 15 cards; research filter returned 3, combined rabi filter 2, empty search showed 0, Reset restored 15. Architecture and tour controls worked. At 360 px both guide and planner fit without page overflow; a saved guar–mustard current plan appeared in Compare with source reviews on Evidence. No browser console warnings/errors on the recovered successful flows. Screenshot capture was unreliable in the ECC session, so no new screenshot evidence is claimed. A credential-pattern scan across all 16 prior Git revisions found no matching paths before public release.
