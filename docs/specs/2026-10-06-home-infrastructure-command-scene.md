# Home Hero: Simulated Infrastructure Command Scene

> Status: **APPROVED by the owner for local implementation/review only. Do not publish without a later explicit approval.**

## Goal
Replace the Home hero's decorative orbit completely with a premium interactive Three.js cloud-infrastructure simulation that communicates a real request lifecycle without implying a connection to an AWS account.

## Scope and preservation
- Home hero only. Replace the existing sphere/orbit and its related labels/controls in `index.html`, `home-luxe.css`, and `js/home-orbit.js` (or a focused Home scene module wired through `js/app.js`). Preserve the hero identity, copy, CTAs, all remaining Home content, other routes, shared navigation/footer, and Lab content.
- The deeper Serverless Lab experience is out of scope.
- Implement locally and produce phone/tablet/desktop review previews. Do not publish or change the live site.
- Do not reuse any old orbit/sphere/ring geometry or retain the broken orbit positioning. Do not use the reference image as a background.

## Visual and composition direction
A cinematic, sophisticated infrastructure command scene that reads as the hero visual, not an orbit decoration or dashboard card. Recreate the reference's central infrastructure core, dimensional service platforms, dark metal and restrained smoked/translucent glass, champagne/gold architectural light, restrained blue/green/magenta service accents, glowing data paths, realistic depth and sparse atmospheric particles. Avoid neon, gaming/futuristic clutter, excessive effects and overcrowded labels.

Every infrastructure object, platform, route, packet, light effect and particle must be actual Three.js geometry/rendering. DOM/CSS is only for readable labels, service/status indicators, HUD, controls and information panels.

Create distinguishable infrastructure nodes for API Gateway, Lambda, DynamoDB, S3, SNS, IAM, Step Functions and CloudWatch, plus a USER/request source and response. Opening camera is close, readable and composed; responsive mobile framing deliberately preserves the core and usable service access.

## Simulated request lifecycle
Use explicit deterministic system-state/route data for the continuous flow:

`USER → API GATEWAY → LAMBDA → AWS SERVICES (DynamoDB/S3 and SNS event branch) → CLOUDWATCH → RESPONSE → USER`

Packets visibly follow only their associated Three.js connection curves. At each service arrival, illuminate the node and active connection briefly and update its corresponding DOM status in sync. Events, telemetry and response may have separate, justified routes. Animation should communicate real system states; no free-floating random particles implying live traffic. Sparse ambient particles may remain stationary or communicate explicitly identified environment state.

## DOM labels and HUD
- DOM/CSS service names, status and HUD are crisp and minimal; project each label's corresponding real 3D anchor through the current camera so overlays follow rotation and zoom. Add subtle leader lines/markers as needed.
- Prevent overlap and scene obstruction. At narrow widths use a deliberate mobile label arrangement/selector, not a shrunken desktop label field; all labels/targets remain readable and in bounds.
- Hover/tap/select highlights the node and connected routes, slightly dims unrelated services, and updates the technical information panel. Keyboard-accessible DOM controls mirror node selection.
- Include a restrained system HUD (example sample values for request count, average latency, error rate and events). Make the values explicitly simulated/illustrative and never imply live AWS telemetry.
- Put the clear disclosure in the experience: `ILLUSTRATIVE / SIMULATED ENVIRONMENT — NO LIVE AWS CONNECTION`.

## Interaction and camera
Provide `DRAG TO EXPLORE`, `SCROLL / PINCH TO ZOOM`, `SELECT A SERVICE` and `RESET VIEW`. Allow pointer/touch orbit and zoom with bounded azimuth, polar and distance; no pan that loses the composition and no upside-down flip. Reset returns the opening view. Support natural touch interaction and usable touch targets.

## Performance and accessibility
- Reuse installed Three.js 0.160.0 and existing lazy-loading architecture where appropriate; no new dependency unless necessary.
- Prefer shared/lightweight geometry, instanced markers/particles, capped pixel ratio and efficient lighting. No costly post-processing or real-time reflection/environment capture.
- Pause RAF while off-screen or document hidden; handle resize; honor `prefers-reduced-motion` with a complete static frame and retain manual controls.
- Handle WebGL creation/context failure with an informative accessible static fallback.
- Clean listeners, observers, RAF and GPU resources on teardown. Ensure keyboard selection, visible focus, honest accessible state updates and no horizontal overflow.

## Acceptance / verification
Test the built local site and actual rendered scene at 1440 desktop, 768 tablet and 390 mobile. Verify: no overflow; scene and all labels are readable and in bounds; camera/leader anchors track on drag and zoom; selection/highlights/details work by touch/pointer and keyboard; deterministic lifecycle finishes through response; service statuses/illumination/paths stay in sync; Reset restores initial camera/state; reduced motion works; off-screen pause/resume works; WebGL fallback is useful; no console errors; no old orbit geometry or reference-as-background. Inspect screenshots at phone and desktop widths and send them for review. Fix any detected issue and rerun relevant checks.

## Confirmed decisions
- Home hero only; Lab deep dive stays out of scope.
- Replace the old orbit completely; real Three.js infrastructure is the visual focus.
- Default simulated activity is end-to-end request flow.
- Numeric HUD values are explicitly illustrative simulation values.
- DOM/CSS labels dynamically track actual 3D nodes.
- Implement locally; do not publish pending review and later explicit publish approval.
