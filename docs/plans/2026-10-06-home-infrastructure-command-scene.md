# Home Hero Simulated Infrastructure Command Scene — Implementation Plan

> **For Hermes:** Execute task-by-task locally. Do not publish. Final deliverable is the local implementation plus phone/tablet/desktop review screenshots.

**Goal:** Replace the Home orbit completely with an interactive, deterministic Three.js infrastructure request simulation with dynamically projected DOM/CSS labels and HUD.

**Architecture:** Keep accessible Home markup in `index.html`; style the scene and responsive composition in `home-luxe.css`; implement the scene in a dedicated lazy-loaded ES module (replace/refactor `js/home-orbit.js` and update `js/app.js` if needed). Three.js holds all physical infrastructure, data paths, packets, lighting and particles. DOM overlays are projected from actual 3D anchors and repositioned for responsive layouts.

**Tech Stack:** Existing Vite multipage app, Three.js 0.160.0, OrbitControls, native DOM/CSS, existing browser harness.

---

## Constraints
- Approved spec: `docs/specs/2026-10-06-home-infrastructure-command-scene.md`.
- Preserve current Home hero identity, copy/CTAs and all unrelated Home content; leave Lab and non-Home routes unchanged.
- Replace—not reuse—old orbit/sphere/rings/positioning. Do not use the reference image as a background.
- Local implementation only. Do not run `scripts/publish.py` or write remotely.
- Keep dependencies unchanged unless a verified blocker requires change.
- All infrastructure, platforms, paths, packets, lighting and particles are true Three.js, not DOM shapes.
- All numeric demo metrics must be honestly identified as illustrative/simulated, never AWS telemetry.

## Task 1 — Baseline and build gate
- Read `index.html`, `home-luxe.css`, `js/app.js`, `js/home-orbit.js`, `package.json`, `vite.config.js`.
- Save checksums of changed-target files to profile scratch outside project root.
- Run `npm run build`; record output and fail early if broken.
- Start configured Vite app, verify correct Home title/body via HTTP before browser checks.
- Record baseline width/overflow/screenshots at 390, 768 and 1440 in scratch.

## Task 2 — Accessible Home scene shell
- Replace only scene-related markup in `index.html`; retain hero copy, CTAs and content below.
- Add canvas accessible name; semantic DOM anchors with stable `data-node-id`; subtle leader markers/lines; selected-service info; restrained HUD; Reset View; native keyboard-accessible service selector; interaction hints; visible simulated/no-live-AWS disclaimer.
- Provide useful static non-WebGL fallback with service names and honesty label.
- Remove orbit-only labels/control semantics.
- Verify eight required AWS service names plus USER/RESPONSE, disclosure, focusable controls, preserved headline/copy/CTAs, and no legacy orbit markup.

## Task 3 — Actual 3D infrastructure architecture
- Replace old globe/sphere/orbital rings with dimensioned infrastructure scene in `js/home-orbit.js` or a focused new module.
- Build central cloud/workload core and separate service platforms for API Gateway, Lambda, DynamoDB, S3, SNS, IAM, Step Functions, CloudWatch; represent USER/RESPONSE as actual geometry/route anchors.
- Use dark metal, subtle smoked/translucent faces, emissive edges, champagne/gold architectural key light, restrained service accents, realistic depth and sparse particles.
- Define true Three.js route geometry/data for USER → API → Lambda → (DynamoDB/S3/SNS branches) → CloudWatch → response → USER.
- Opening camera is close and composed; rotation/zoom bounded, no pan, reset to start. Adapt camera framing for mobile.
- Share geometry/materials, use low-poly structure and instanced markers/particles where suitable; no costly post-processing.
- Verify distinct rendered services; no old orbit mesh/rings; no random pathways.

## Task 4 — Deterministic continuous simulation
- Implement a deterministic finite-state request cycle over named connection curves. Packets use curve positions; no unrelated paths.
- Lambda dispatches to real modeled data/event branches; branches rejoin into CloudWatch telemetry then response.
- On arrival synchronize node glow, active path intensity and corresponding DOM status (`ACTIVE` then `READY`/appropriate state).
- HUD starts with sample values; evolve conservatively/deterministically and keep clearly simulated. No random “live-looking” telemetry noise.
- Reduced motion shows complete static scene and stable HUD but retains manual interaction.
- Verify stage order, branch destinations, response completion/repeat, and matched overlay/3D activation.

## Task 5 — Projected DOM overlays, selection and responsive mobile
- Project each Object3D node anchor through camera after matrices update to local scene-stage coordinates. Update on scene frames, camera/control changes, resize and zoom; overlays must actually follow orbit/zoom.
- Add leader markers/lines between projected 3D anchor and label; hide behind-camera/offscreen labels correctly.
- Raycast only known service hit volumes. Selection/hover highlights node and connected routes, dims unrelated services, updates info panel; keyboard DOM controls mirror selection.
- Use a deliberate phone arrangement: prominent infrastructure stage with accessible compact selector/detail below or alongside, not scaled desktop label field. Show only non-overlapping projected labels when space allows; keep selected label/status clear with anchor cues and 44px touch controls.
- Verify labels and leader termini against actual 3D anchors after drag/zoom at 390/768/1440; no collisions, obscured core, or horizontal overflow.

## Task 6 — Performance, reduced motion, fallback and cleanup
- Cap pixel ratio approximately 1.25 mobile/1.5 desktop; reduce particles/antialias/geometry on mobile; no real-time reflection/shadow cascades/post-processing.
- Pause animation RAF when offscreen or document hidden; resume safely. ResizeObserver updates renderer/camera/overlays. Under reduced motion, avoid continuous RAF except necessary control/state transitions.
- Handle WebGL creation failure and context loss with a useful accessible static fallback.
- Dispose observers, listeners, RAF, geometries, materials and renderer on teardown/pagehide.
- Keep visible focus, non-color status cues, stage-only announcements, accessible named services.
- Verify reduced motion, pause/resume, WebGL fallback/context loss, cleanup, no console errors.

## Task 7 — Full build and browser tests
- Run production `npm run build`.
- Confirm actual served Home response belongs to portfolio.
- At 390/768/1440: assert no overflow, canvas/stage nonzero, overlay bounds and no collisions, headline/CTAs unoccluded, legible nodes, no page/console errors.
- Exercise pointer + touch drag, wheel/pinch zoom, camera bounds, reset; select every service via raycast and keyboard buttons; assert details/path emphasis/status.
- Assert deterministic full simulation, truthful sample HUD/disclosure, actual packet routes.
- Verify reduced motion, offscreen pause, tab hidden pause/resume, WebGL fallback.
- Check no duplicate Three.js scene initialization and no old orbit geometry/imports remain on Home.

## Task 8 — Review-only handoff (never publish here)
- Capture actual Home/scene at 390 phone, 768 tablet, 1440 desktop in profile scratch/review path that is not included in publish output.
- Inspect screenshots and browser metrics, correct verified issues, rerun relevant checks.
- Do not execute publisher or make external writes.
- Send phone and desktop screenshots (tablet optional) to user and explicitly say local/unpublished. Stop for review; require separate explicit publish approval later.

## Supersedes prior draft
An earlier draft described a smaller hover-pulsing scene; this approved plan supersedes it with the full request simulation, 3D service platforms/paths, camera controls, projected DOM overlays, explicit illustrative HUD, mobile composition, and full verification requirements above.
