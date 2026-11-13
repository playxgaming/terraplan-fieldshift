# Calculation model 2.0.0

This document describes implemented behavior. It does not validate the model for agricultural use.

## Inputs and windows

Manual field inputs: coordinates, hectares, soil texture (loam/clay/sandy), previous crop and default irrigation. Draft inputs: crop year 2021–2024, first start month May–September, second start month September–December, independent irrigation/rainfall/heat adjustments and scoring priority.

Each window covers four calendar months starting on day 1. Both start in the selected calendar year; the second may end in the next year. Defaults: June–September and November–February, 200 mm irrigation in each, no weather adjustments, balanced priority.

## Candidate pairs

Rice → wheat; pearl millet → chickpea; maize → wheat; sorghum → chickpea; maize → mung bean.

## Crop constants

| Crop | Demand (mm) | Context range (mm) | Heat threshold | Demo start months | Soil preference |
| --- | --- | --- | --- | --- | --- |
| Rice | 575 | 450–700 | 35°C | Jun, Jul | Clay |
| Wheat | 550 | 450–650 | 30°C | Oct, Nov | Loam, clay |
| Pearl millet | 550 | 450–650 | 40°C | Jun, Jul | Sandy, loam |
| Chickpea | 300 | Illustrative | 32°C | Oct, Nov | Loam, clay |
| Maize | 650 | 500–800 | 35°C | Jun, Jul | Loam |
| Mung bean | 300 | Illustrative | 35°C | Feb, Mar, Jun, Jul | Loam, sandy |
| Sorghum | 550 | 450–650 | 39°C | Jun, Jul | Loam, clay |

Cereal demand values use midpoints of [FAO's broad ranges](https://www.fao.org/4/S2022E/s2022e07.htm), including the grouped sorghum/millet range. Rice demand excludes additional paddy-system losses. Pulse demands, all heat thresholds, exact start-month lists and soil preferences are illustrative. General [Indian seasonal context](https://ies.gov.in/arthapedia/concept/cropping-seasons-india-kharif-rabi) does not validate these exact rules for a specific farm.

## Exclusions

A candidate is excluded for an unsupported crop start month, overlapping windows, or rice on sandy soil. Excluded candidates have no displayed numerical score. Other soil mismatches reduce the heuristic score. Large water gaps do not trigger hard exclusion.

The mung second-crop example cannot pass any currently offered September–December second-season start; its allowed months do not overlap those choices. This known review target remains unchanged.

## Formulas

For each season:

```text
scenario rain = sum(observed daily rain) × (1 + rain adjustment / 100)
usable water = scenario rain × 0.65 + irrigation
water fit = clamp(usable water / crop demand × 100, 0, 100)
gap = max(0, crop demand − usable water)
hot days = count(observed daily maximum + heat adjustment > crop threshold)
heat fit = 100 × (1 − hot days / observed days)
```

Soil/diversity points: start at 25; add 20 for first-crop soil match, 15 for second-crop match, 25 for a second-season legume and 15 for different families; subtract 15 when the previous and first crop share a family. Clamp to 0–100. The model groups cereals as grasses and chickpea/mung as pulses.

Average each season's water-fit score and each season's heat-fit score. Combine those two averages and the soil/diversity score:

| Priority | Water | Soil/diversity | Heat |
| --- | --- | --- | --- |
| Balanced | 35% | 30% | 35% |
| Water | 60% | 20% | 20% |
| Soil/diversity | 20% | 60% | 20% |

Round the weighted result. Rank eligible candidates by score, then lower combined demand, then rotation identifier.

Combined gap is the sum of season gaps. Area-scaled modeled gap is `gap_mm × hectares × 10` cubic metres. Area does not change per-area score. This volume is not a measured withdrawal or irrigation prescription.

## Interpretation and gaps

Scores are relative heuristics, not probabilities of success. The 65% effective-rain factor is fixed, not a measured soil-water balance. There is no growth-stage model, cold/frost stress, rainfall timing analysis, evapotranspiration, carry-over moisture, salinity, pests, yield or profit estimate.

Sensitivity repeats the same settings over four historical years; its score range is not a calibrated uncertainty interval. The default observed comparison uses unadjusted weather and the field's default irrigation; the hotter/drier preset changes weather and removes irrigation together.

See [the AI review handoff](AI-REVIEW-HANDOFF.md) for worked examples, exact review targets and validation gaps. Any calculation change must update the model version and saved-plan compatibility policy.
