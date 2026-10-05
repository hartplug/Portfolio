# Home → Lab → Observatory implementation plan

Scope approved: remove Home Live Model, build editorial Lab index with Infrastructure Observatory featured first, move the full existing observatory to its own page, calm camera behavior, add drag/reset. Preserve the current near-black/champagne design and existing site shell. Do not publish.

## Task 1 — Save recovery point
Before touching source, snapshot current Home, Lab, 3D page, relevant CSS/JS, and Vite config. Record file list and restore method. Done before edits.

## Task 2 — Extract and refine observatory page
Create dedicated `observatory.html`, reusing 3D system components/mode metadata from Home. Update copy/top chrome to name Infrastructure Observatory, add clear back-to-Lab navigation and illustrative disclaimer; retain WebGL fallback and all component inspection. Frame actual model with an opening camera position tuned for model bounds; remove default auto-spin and replace old toggle with `DRAG TO EXPLORE`, `RESET VIEW`. Preserve reduced-motion behavior.

## Task 3 — Rework Home
Remove the Home observatory section and its dedicated scene import/mount from Home only; ensure shared `app.js` still mounts all unrelated Home/route features. Tighten the transition into About or following content; do not insert a substitute canvas.

## Task 4 — Recompose Lab
New editorial header using approved exact copy. Featured Observatory entry receives largest type and strong static/HTML architectural preview; action routes to `observatory.html`. Rehouse existing AI Status Orb and serverless learning into quiet secondary experiment entries without losing the orb interaction or personal-lab disclaimer. Avoid generic uniform cards.

## Task 5 — Route/build and responsive styling
Add page to Vite multi-page input, check GitHub Pages base/relative links and asset paths. Make styles route-specific where possible.

## Task 6 — Verify, no publish
Build, run syntax checks; browser inspect Home/Lab/Observatory at 390, 768, 1440 widths; inspect all links, canvas mount counts, scene state, control actions, fallback, reduced motion, and no overflow. Fix findings. Do not run publish.py until owner separately requests it.

Acceptance mirrors `docs/specs/2026-10-06-home-lab-observatory.md`.
