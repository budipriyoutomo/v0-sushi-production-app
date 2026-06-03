# PWA Strategy

## Installability

The app is configured with `next-pwa`, `public/manifest.json`, standalone display mode, app icons, theme color metadata, and Apple web app metadata.

## Runtime caching

Cache First:

- Next static assets
- fonts
- images

Network First:

- API data
- production data
- kitchen queue data
- inventory-style operational data

The offline document fallback is `/offline`, which prevents a blank screen when navigation happens during an outage.

## Generated files

`next-pwa` writes the service worker into `public/` during builds. Treat `public/sw.js`, `public/workbox-*.js`, and `public/fallback-*.js` as generated artifacts.
