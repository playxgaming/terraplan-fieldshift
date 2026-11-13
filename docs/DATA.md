# Data provenance and assets

## Active NASA integration

NASA POWER Daily API parameters: `PRECTOTCORR` (mm/day), `T2M` (°C) and `T2M_MAX` (°C). Precipitation is summed over each window; daily mean temperature is averaged; daily maxima are compared against illustrative thresholds.

The bundled Pune record is in `dist/data/pune-history.json`:

```text
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,PRECTOTCORR&community=AG&longitude=73.86&latitude=18.52&start=20210601&end=20250531&format=JSON
```

It covers June 1, 2021–May 31, 2025, with 1,461 daily entries per requested parameter. The file retains the exact request, coordinates, UTC retrieval timestamp, original response and native metadata. The response uses LST, API version `v2.10.3`, source labels `MERRA2`/`POWER`, and fill value `-999`.

Custom coordinates use the same historical period. The client selects the bundled reference within a 0.0001° coordinate tolerance, otherwise requests NASA directly. It has an in-memory cache, a 60-second timeout, cancellation and stale-response guards. The source products' native resolution remains important: a requested point does not make observations field-resolution measurements.

The legacy `dist/data/pune-2024.json` is retained from V1 but is not the active V2 dataset.

## Data checks

Selected windows require a finite value for every date and parameter; fill values and negative precipitation block evaluation. This is completeness validation rather than comprehensive scientific quality control. Importing a plan does not authenticate its raw observations against NASA.

Four complete default crop years, including the 2024 leap day, are checked by automated tests. Four years are not enough to establish a long-term climate trend. Soil texture, field area, crop history and irrigation are manual inputs.

## Photography

Seven reference photographs are bundled under `dist/assets/crops/`. Exact authors, original pages, licenses and display-change notes are in `dist/assets/photo-credits.json` and [third-party notices](../THIRD_PARTY_NOTICES.md).

Photos are not images of the selected field and do not provide evidence of its current crop condition. They are served locally with lazy loading; Google Fonts is the app's optional remote presentation dependency.

## Extending or refreshing data

Document the product, location, dates, parameter names, units, time standard, quality flags and retrieval timestamp. Keep the original source record and reproducible request. Verify model/window compatibility before replacing the fixed-period fixture. New data integrations must not be implied by a cosmetic map or illustration.

NASA/provider data retain applicable source terms; the code's MIT license does not claim ownership or relicense them. Refer to [NASA POWER documentation](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) and original product terms when redistributing or using new data.
