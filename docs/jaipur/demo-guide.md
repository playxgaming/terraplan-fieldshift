# Jaipur demonstration · TerraPlan Field Studio

Open Welcome and choose **Run the Jaipur demo**. It loads local NASA files without an API request. It replaces the editable draft, preserving the saved field and What-if settings. Default priorities are all 3; reset them if demonstrating the baseline below.

## A 90-second story

1. **0–15 seconds — the question.** “Near Jobner, Jaipur, how can a farmer compare next season's rotation when winter irrigation is limited?” The animated field illustrates the idea; it is not a remotely sensed reconstruction.
2. **15–35 seconds — the baseline.** Show the 2 ha, bajra → wheat → Bare scenario. Loam represents a hypothetical sandy-loam field; 150 mm winter irrigation is an assumption. The current score is **50.43**, with a modelled winter water gap of **235.36 mm**.
3. **35–55 seconds — the alternatives.** Option A, fodder sorghum → chickpea → Bare, scores **71.26**. Option B, maize → chickpea → Bare, scores **70.06**. These are relative rule scores, not percentages of yield improvement. A still has a **93.6 mm** winter gap despite passing the illustrative 40% water-gap threshold. Discuss that trade-off openly.
4. **55–75 seconds — test the decision.** Open What if? and change rainfall or irrigation. Compare the same plans, inspect historical-year sensitivity, then reset. Open a crop timeline month to show the daily evidence and assumed crop window.
5. **75–90 seconds — show the proof.** Evidence links NASA requests, retrieval times and local context sources. Expand Data, priorities & decision brief on Compare to download the local JSON snapshot. Close with: “The next step is to validate crop inputs and irrigation assumptions with a local agronomist.”

## Source boundaries

NASA POWER records were freshly retrieved for **26.97 N, 75.38 E**: daily June 2022–May 2026 and monthly 1991–2024. The baseline agricultural year is June 2025–May 2026. These are historical area records, not a future forecast. POWER soil wetness is model-derived.

[SKN Agriculture University thesis (2021)](https://krishikosh.egranth.ac.in/server/api/core/bitstreams/19adae90-cf75-485f-96ef-78fb7476281d/content) describes Jobner's semi-arid setting and loamy-sand to sandy-loam soil context. [ICAR-CRIDA Jaipur contingency plan (2011)](https://www.icar-crida.res.in/CP-2012/statewiseplans/Rajastan%20(Pdf)/RAU,%20Bikaner/RAJ1-Jaipur%203.2.2011.pdf) includes pearl millet–wheat under irrigated coarse soils. These dated sources motivate the scenario; they establish no partnership, field measurement or current recommendation.

All 12 crop rows remain unverified. Original regional flags were designed for Gujarat/Maharashtra and do not verify Jaipur suitability. Mustard, barley and cluster bean are catalogue gaps. Satellite cards deliberately remain Not loaded yet. Prices, yields, profit, variety selection and full soil-water balance are outside this prototype.

## Before presenting

Check the Site opens in the presenting account: it currently retains owner-private access. For a venue Wi-Fi backup, unzip the supplied static package, run `python -m http.server 8080 --bind 127.0.0.1` inside its directory and open `http://127.0.0.1:8080`. Keep the server running. No installation or API key is required. The optional map needs internet; the core bundled demo, photos and fonts are local. Downloaded briefs contain field coordinates; share them intentionally.
