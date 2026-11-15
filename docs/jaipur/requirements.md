> Updated 15 November 2026: mustard, barley and cluster bean are now included as source-researched, unverified profiles. The catalogue has 15 crops. See [current crop review](crop-review.md). The matrix below records the earlier audit; new totals are in the current README.

# TerraPlan requirement audit and completion plan

Audit date: 14 November 2026, India. Team: **AEGIS LABS** — Sarvesh Sehra (owner), Ayush Tyagi, Aditya Rathi, Arshi. This is a software/evidence audit, not confirmation of contest registration or submission.

## Assessment

The requested V3 prototype features are implemented. The project addresses the challenge as a transparent planning demonstration, with real NASA POWER history and illustrative crop assumptions. It is **not yet a scientifically validated farm recommendation system or a confirmed submitted project**. Extra graphics cannot resolve those evidence and submission gaps.

The supplied [official challenge](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=details) asks for NASA Earth observations combined with soil information, crop characteristics and farmer priorities to explore resilient rotations. Its supplied description does not mandate every satellite product. POWER is integrated; optional SMAP/IMERG/GRACE observations are not supplied. No claim is made that all official account-level eligibility checks have passed.

## Original V3 specification

| Requirement | Status | Evidence or boundary |
|---|---|---|
| 1. Seven routes, persistent advice banner, mobile navigation | Implemented | Welcome, Field, Climate, Priorities, Compare, What-if, Evidence |
| 2. Field form, validation, save/reload, Bare seasons | Implemented | Versioned local field record; numeric boundaries and visible errors; restore saved field added |
| 3. Crop schema, generator, exclusions, current plan retained | Implemented | Twelve unverified crop rows; exclusions include reasons; current plan never silently removed |
| 4. NASA daily loader, timeout, cache, local demo | Implemented | Fresh Jobner bundle; live/cache/bundle provenance; wrong-point data rejected |
| 5. Fit, six priorities, rules, water check, confidence | Implemented | Pure engine; priorities now persist independently; all starter confidence Low |
| 6. Current/A/B, five explanations, sortable table | Implemented | Current 50.43; A 71.26; B 70.06 under default Jaipur settings |
| 7. June–May timelines, Bare and vulnerability markers | Implemented | Crop dates are assumptions; markers describe historical thresholds |
| 8. Climate cards, monthly trends, glossary | Implemented | Real NASA numbers, resolution notes, annual tables; history charts added |
| 9. Satellite cards and source labels | UI implemented; data absent | Specification explicitly permits Not loaded yet; no invented satellite observations |
| 10. What-if and four-year sensitivity | Implemented | Fixed baseline plan IDs; missing values preserved; independent scenario storage |
| 11. 360 px, keyboard labels, README and public link | Implemented; public access verified | Owner-authorized public Studio opens without sign-in in an isolated browser; earlier Pages release remains separate |
| 12. Optional map, regional labels and print | Implemented | Map is opt-in; Hindi/Gujarati/Marathi cover navigation and crop labels, not full text |
| 3D moving field and crop photos | Implemented | Original WebGL illustration, motion controls, fallback and local attributed photos |
| Jaipur nearby demo | Implemented | Jobner 26.97 N, 75.38 E; bajra–wheat scenario; local context sources and assumptions visible |
| GitHub repository and deployment | Implemented | Studio branch, CI and static allowlist package; no private source history included in hosting |
| Team credits and AI disclosure | Completed in this release | AEGIS LABS + four supplied names in footer, Evidence and presentation |

## Plan and changes completed in this audit

1. **Correctness first:** withhold old weather/trends on Evidence after location/year changes. Add regression coverage.
2. **Recovery:** add Restore saved field so an unsaved demo need not strand the user. Preserve draft on missing/corrupt saved record.
3. **Continuity:** save priorities under their own versioned key, retaining field and What-if state; show storage failures honestly.
4. **Interpretation:** add accessible historical rainfall/temperature charts with missing-year gaps and an exact-values table.
5. **Presentation:** add `pitch.html`, exactly seven slides, baseline trade-offs, NASA provenance, team credits and AI disclosure. Add a submission-text draft.
6. **Access and release:** publish the updated Studio for judges as explicitly authorized; test without a signed-in account; preserve V2 and the earlier Pages branch.

## Still required outside software implementation

| Gap | Why it cannot be marked complete | Next action |
|---|---|---|
| Crop and soil validation | All crop rows are AI-drafted; no field soil report or expert sign-off exists | Have a local agronomist review crop thresholds, seasons, soils, varieties and water needs; record sources before marking verified |
| Farmer feedback / impact measurement | No interviews, usability study or field trial supplied | Pilot with consent; record confusion points and decision usefulness; do not invent yield/water-saving outcomes |
| Satellite observations | Optional summary JSON has no sourced observations | Obtain same-location, dated, quality-checked data with units and resolution; do not relabel POWER model wetness as SMAP |
| Some local crops | Mustard, barley and cluster bean are outside the catalogue | Add only after crop parameters and agronomic assumptions are reviewed |
| Official team/project submission | Challenge URL is supplied, but actual team project URL, registration and submission confirmation are not | Team owner completes project form, adds public demo/slides, sources and AI use, and verifies submitted status |
| Final submission rules | Official challenge/resources pages could not be fully fetched during audit | Review the current official submission guide in the participant account and any Jaipur organizer instructions |

The [NASA Space Apps Navigator answer](https://github.com/nasa/spaceapps/discussions/1973) describes an English project explanation, public demo (up to 30 seconds video or seven slides), NASA-data explanation and AI disclosure. The prepared seven-slide HTML can be printed to PDF; verify current form requirements and a logged-out public link before submission. No video, registration or submitted status is claimed.

## Click-path state map

| Action | Writes | Preserves / guard |
|---|---|---|
| Run Jaipur demo | Unsaved field draft, field message, climate request | Saved field, priority weights, What-if; latest request ID wins |
| Save field | Field key only after validation | Priorities, What-if, invalid previous bytes on failure |
| Restore saved field | Draft + recovery message | Stored field, priorities, What-if; absent/corrupt record keeps draft |
| Load weather | Climate state, versioned weather cache | Matching location/year required to score; stale Evidence withheld |
| Adjust/reset priorities | Priority state + its own key, ranking preview | Field + What-if; range control stays mounted |
| What-if/reset | Scenario + its own key, experiment results | Saved field + priorities; fixed comparison IDs |
| Sort rotations | Sort key/direction + table region | Scores, field, weather, priorities, What-if |
| Language | Label preference only | Scientific crop IDs, map and inputs |
| Print | Temporarily expands selected details | Restores detail state after printing |
| Brief download | Local Blob and download | No network upload; rejects mismatched field/weather |

No app database, payment flow, secret-bearing backend or messaging service exists. External network boundaries are explicit NASA loading and the optional map. Private Site access was the main presentation blocker identified, not missing app authentication.
