# Deployment

TerraPlan is a static application. No bundle/build command is required. Publish the **contents of `dist/`**, including its assets and data subdirectories, to a static host that serves `.mjs` as JavaScript and `.json` as JSON.

## Before publishing

1. Run `npm run verify`.
2. Serve `dist/` locally and check the main workflow.
3. Keep photo credits and source records alongside the app.
4. Verify host access settings and NASA request behavior from the deployed origin.

Hash routes work with static hosting without a server-side SPA rewrite. Do not open the app as a `file://` document; it fetches bundled data and metadata.

## Existing live Site

The current demo is hosted separately at:

https://terraplan-fieldshift.sarveshsehra1.chatgpt.site/

It is owner-private. This repository does not include its private Sites configuration or credentials, and its CI does not automatically deploy there. Pushing GitHub changes does not itself update that publication.

## Development preview

`npm start` serves the application at `http://127.0.0.1:3000`. Use `npm start -- --port 8080` for a different port. It binds only to loopback and is intended for development, not production traffic.

There is no service worker, installable PWA or persistent custom-location offline cache. The bundled Pune demo can be served without internet; a hosted reload is not guaranteed offline. Custom-coordinate NASA calls and optional web fonts require their external services.
