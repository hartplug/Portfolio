# Reconstructed Accepted Orbit — Functional Implementation Plan

> New isolated implementation from preserved specification and test evidence. This is not recovered original source. Do not publish, merge, checkpoint as final, or touch protected trees/files.

## Protected scope
- Build only in a fresh directory under `/root/portfolio/snapshots/experiments/`.
- Never modify `/root/portfolio/snapshots/PRESENTATION-BUILD-2026-10-07`, any approved snapshot, `/root/portfolio/js/app.js`, or any `js/ai-status-orb.js`.
- Clone the experiment's required Vite app shell, CSS/assets/config into the new directory from known presentation layout support, then replace only that copy's home page and Orbit scene. Preserve one canvas and prevent file paths escaping the new directory.
- Required nodes: USER, API GATEWAY, LAMBDA, DYNAMODB, S3, SNS, CLOUDWATCH, RESPONSE. Exactly eight; no IAM/Step Functions.
- All node geometry and hit targets are Three.js. Explicit `clickTargets` carry each service ID; real raycaster performs hover/select.
- Routes: 11 total including USER→API, API→LAMBDA, LAMBDA→DynamoDB/S3/SNS, service-to-service/telemetry paths, service→CloudWatch, CloudWatch→Response, Response→User. Data-driven curves are the sole packet routes.
- Packet lifecycle: six stages exactly `RECEIVED, INVOKED, PROCESSING, TELEMETRY, OBSERVED, COMPLETE`, each 1000 ms, 6000 ms cycle. Deterministic formulas from user spec. Map stages to the six packet routes: user→api, api→lambda, lambda→service branches (deterministically selected per cycle/stage), service→cloudwatch, cloudwatch→response, response→user. The exact single stage-2 branch route policy is not specified by surviving evidence; pick one explicit stable policy and document it in the isolated reconstruction. No concurrent packets.
- Clock has one `performance.now()` mount-time origin. Start/resume must preserve elapsed semantics and never silently reinitialize. Only explicit Reset reassigns origin; Reset state is USER/cycle0/progress0 and sets packet hidden when reduced motion is active.
- Reduced motion: stop continuous RAF; static scene, hidden packet, functional select/inspector/Reset.
- Fallback: catch renderer creation/context loss, show a single architecture summary, hide unusable canvas/overlays; no uncaught error except the deliberate renderer failure diagnostic.
- Teardown/pagehide: cancel RAF + queued resize RAF, disconnect both observers, remove every listener, dispose all owned geometry/materials/renderer, delete inspect hook; support teardown then remount without duplicates.
- `__orbitInspect` only production/test-relevant fields listed by user; no probes or global controllers.
- Do not perform visual refinement until all required functional gates are actually verified.

## Implementation slices (test-first)
1. **New isolated app shell and pure lifecycle test** — copy required local support files into a new directory; create a lifecycle module and 12-case deterministic test first. Run RED, implement exact state function, run GREEN.
2. **3D geometry and 8-node inventory** — create explicit node data/descriptions, physical component geometry, route curves, one renderer/canvas and fallback shell. Browser-assert exactly eight IDs and hit targets; no extra nodes.
3. **Packet path** — one state snapshot per RAF, route selection and curve position derived from it, metadata from same state. Assert stage-route-position agreement; no second packet clock.
4. **Interaction/inspector** — desktop raycast hover/click, labels only on hover/selection, route emphasis, touch drag/tap with native scrolling outside canvas. Test all eight descriptions.
5. **Reset and reduced motion** — Reset orientation/selection/hover/state/clock; reduced Reset keeps packet hidden and no active RAF.
6. **Fallback and teardown/remount** — forced WebGL failure, context loss, pagehide cleanup, fresh mount and no duplicates.
7. **Responsive + final functional verification** — syntax checks, build, 12 lifecycle cases, browser gates: Reset, fallback, teardown/remount, desktop interaction, mobile interaction, all 8 nodes, reduced motion, responsive layout. Report actual evidence/incomplete assertions honestly.

## Acceptance evidence rules
- Run `node --check` on new Orbit source and test; run `npm run build` inside isolated reconstruction only.
- The 12 deterministic cases use timestamps 0, 500, 999, 1000, 1500, 2000, 3000, 4000, 5000, 5999, 6000, 7000 ms with expected stages/progress/cycle from user spec.
- Browser tests use actual mouse and touch input. Project current transformed Three.js hit target world positions before selecting; verify inspector identity and connected route emphasis.
- For lifecycle progression, observe the normal RAF without manually invoking updater/renderer; sample sufficiently densely to confirm ordered stages over two cycles. Check packet metadata and world position against same state.
- Verify no console/resource errors in normal WebGL; document the expected forced-WebGL context creation error separately.
- Measure overflow and scene/control availability at 390, 768, 1024, 1280, 1440. Do not claim visual-refinement approval; this phase is functional only.
- Hash the protected presentation and approved snapshots before and after. Require byte identity. No final checkpoint/publish.

## Known uncertainty
Surviving source fragments support the 8 node identities, route concepts, six named packet stages, 1000ms stage length, 6000ms cycle, reset-clock intent, and required behaviors. Exact original mesh dimensions, node coordinates, route geometry, lighting, stage-2 branch selection, and historical UI wording are not fully preserved. Implement explicit, restrained choices as a reconstruction and label them as such; never claim byte/source fidelity to the lost version.