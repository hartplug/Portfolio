# CHECKPOINT-2A-APPROVED

Immutable manual recovery snapshot after explicit approval of Step A. Working scene was not modified while making this snapshot.

## Contents
- `source/`: modified orbit source plus directly related home HTML, CSS and app/shared JS.
- `screenshots/desktop-1440.png`: approved Step A desktop capture, viewport 1440 × 1000.
- `screenshots/mobile-390-full-hero.png`: approved Step A mobile capture, viewport 390 × 844; full-page height 2122 px.
- `node-check.log`: fresh `node --check js/home-command-scene.js` output (exit 0).
- `build.log`: fresh `npm run build` output (exit 0).
- `runtime-verification.json`: 15-second motion observation, viewport/stage dimensions, camera/globe/ring transforms, overflow, and browser errors.
- `MANIFEST.json`: byte sizes and SHA-256 hashes for all snapshot payload files.

## Baseline identity
Scene source SHA-256: `c27a4b70ca70dcf3cd4b7987c27ce6b1794f99f813148097af864c036f7b4261`
Checkpoint 1R rollback remains at `../CHECKPOINT-1R-APPROVED/`.
No Step B changes are included.
