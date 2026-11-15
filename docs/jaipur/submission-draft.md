# Submission text draft — AEGIS LABS

Project: **TerraPlan · Field Studio**

Team: **AEGIS LABS** — Sarvesh Sehra, Ayush Tyagi, Aditya Rathi and Arshi.

Challenge: Field Shift: Adapting Farms with NASA Data.

Prototype: https://terraplan-v3-studio.sarveshsehra1.chatgpt.site/

Seven-slide presentation: https://terraplan-v3-studio.sarveshsehra1.chatgpt.site/pitch.html

## Short description

TerraPlan helps a farmer explore the current crop rotation and two alternatives using NASA weather history, soil category, crop characteristics and six farmer priorities. It explains the evidence, water constraints, potential benefits, uncertainties and local checks for each plan. Our editable case is near Jobner, Jaipur, with a bajra–wheat baseline and explicitly illustrative soil and irrigation assumptions.

## What we built

A mobile-friendly, buildless web prototype with seven screens, validated farm inputs, browser-local saving, an explainable rotation engine, crop calendars, priority-based ranking, four-year historical sensitivity, and separate What-if experiments. The site includes an original animated 3D farm illustration, licensed representative crop photographs, glossary, regional crop labels, optional map, print view and local JSON decision brief. The bundled Jaipur demonstration needs no live API request.

## How we use NASA data

NASA POWER daily records for 26.97 N, 75.38 E cover June 2022–May 2026. We derive rainfall, hot/cold days, dry spells, heavy-rain counts and model soil wetness inside assumed crop windows. Monthly 1991–2024 records support complete-year historical trends. Request URLs, parameter metadata and retrieval times are visible on Evidence. Fill values remain missing; data for another location cannot silently become this field's evidence. POWER soil wetness is model-derived. SMAP, IMERG and GRACE are optional planned evidence and currently have no supplied observations.

## What makes the approach useful

The farmer can inspect every rule, retain the current plan even when it breaks a rule, see excluded alternatives with reasons, and change priorities without losing the original field. What-if checks evaluate the same plans instead of silently choosing new alternatives. A portable decision brief makes it possible to discuss assumptions with a KVK or agricultural officer.

## Honest limitations and next work

The fifteen crop profiles and scoring constants are illustrative. No local agronomist validation, field trial, price feed, measured soil report or verified well capacity is claimed. Scores are not yield or profit predictions. The Jaipur case is a scenario, not a surveyed farm. The next step is local agronomic review, farmer usability testing, local validation of the three added crop profiles and quality-checked satellite observations.

## AI and other credits

OpenAI Codex assisted coding, research and testing. Starter crop parameters are AI-drafted and labelled unverified. NASA POWER is credited to NASA Langley Research Center. Individual crop photograph licences are listed on Evidence. Optional mapping uses Leaflet and OpenStreetMap. The project makes no NASA or university endorsement claim.

## Owner actions before clicking Submit

- Paste this text into the current official project form, adapting it to its actual fields and limits.
- Add the actual AEGIS LABS team/project URL; the challenge link is not the team's project URL.
- Confirm the four members are registered and linked to the correct local event/challenge.
- Verify the prototype and slide link from a private browser window. Print slides to PDF if the form requires a file or a separately hosted document.
- Review current official submission and Jaipur organizer instructions. Complete submission in the participant account and retain its confirmation. This draft does not submit anything.
