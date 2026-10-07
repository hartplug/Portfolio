# CHECKPOINT-1R-APPROVED

Manual recovery snapshot of the approved and frozen portfolio hero baseline. No working source files were edited to create this snapshot.

## Included
- `source/`: exact source copies for home styling, home document, orbit scene, app and shared scripts.
- `screenshots/desktop-1440.png`: reviewed desktop viewport capture (1440 × 1000).
- `screenshots/mobile-390-full-hero.png`: reviewed full mobile hero capture at 390px viewport width (full-page image).
- `node_check.log`, `build.log`: fresh validation output.
- `runtime.json`: measured viewport/stage/canvas dimensions; camera, globe and orbital/ring transforms; frame counts; overflow and browser errors.
- `runtime-capture.log`: capture runner result.

## Verification
- `node --check js/home-command-scene.js`: exit 0.
- `npm run build`: exit 0.
- Runtime browser errors: [].
- Screenshots are captures from the approved review files.

## Recovery
Restore the snapshot's `source/` files to their matching paths under `/root/portfolio`. Rebuild and verify before any further scene work. This snapshot is not a Git commit.
