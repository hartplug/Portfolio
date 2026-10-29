# Home Hero Orbit — Checkpoint 1 Implementation Plan

**Goal:** Replace only the broken Home hero command-scene artwork with a recognizable, premium Three.js orbital globe matching the user's uploaded reference.

**Architecture:** Keep the existing Home copy, surrounding layout, and hero visual styling. Replace the Home scene mount with a dedicated orbit scene containing only real 3D sphere wire layers, thin inclined rings, lighting, a central AWS core, bounded slow rotation, renderer lifecycle, reduced-motion/static rendering and fallback/context-loss handling. This checkpoint deliberately excludes labels, packets, HUD, inspectors and additional UI. Keep the old command-scene implementation recoverable, do not publish, and stop for visual approval before any later checkpoint.

**Tech Stack:** Existing Vite app, Three.js 0.160, JavaScript modules, local Chromium browser.

## Scope and guards

- Edit only Home-specific assets: `index.html` (hero scene host/canvas only, if needed), `js/app.js` (Home-scene dynamic import only), `js/home-command-scene.js` (replace with the clean checkpoint scene), and `home-luxe.css` (scene sizing/stacking only, if needed).
- Do not edit `site.css`, Work/Lab/FAQ/Contact markup, shared footer, global navigation, copy, content claims or global motion.
- Do not add CDN/dependencies, labels, packet animation, service objects, service navigation, dashboard/UI, bloom, extra post-processing, or architecture diagrams.
- Do not invoke the publishing script. Preserve current production fallback and a source snapshot outside generated `dist/`.
- The user's uploaded screenshot is the authoritative composition: near-black field, enormous fine-wire circular globe, thin champagne rings, tiny quiet central AWS core, sparse points only if part of primary geometry, minimal editorial treatment.

## Task 1: Preserve current Home scene and confirm scope

**Files:**
- Read: `index.html`, `js/app.js`, `js/home-command-scene.js`, `home-luxe.css`
- Create: profile-cache backup of current `js/home-command-scene.js` and exact modified-file hash manifest; keep backup outside `/root/portfolio` so Vite/publisher cannot bundle it.

**Steps:**
1. Record hashes for the four allowed files and copy the current Home scene source into `/root/.hermes/profiles/heartplug/cache/scratch/`.
2. Confirm Home scene initialization is the only code path being replaced; do not change the existing page-content hierarchy.
3. Treat any pre-existing user edits as protected: if hashes/state differ from the inspected baseline, stop and report rather than overwrite.

**Verification:** Backup exists and its hash matches the live source before edits; allowed-file list is explicit; no writes under generated `dist/` and no publish command.

## Task 2: Replace the command visualization with Checkpoint 1 orbit geometry

**Files:**
- Modify: `js/home-command-scene.js`
- Modify only if structurally required: `index.html`, `js/app.js`, `home-luxe.css`

**Scene contents only:**
- `THREE.Scene`, `PerspectiveCamera`, transparent `WebGLRenderer`, actual lighting, real-depth geometry.
- One large primary sphere made from a fine champagne wireframe. Add a second, sparser/dimmer structural sphere layer with different line density/depth to avoid a single generic globe mesh. Ensure selected wires are visible against the black canvas without filling the globe with glow.
- A few thin, low-opacity orbital rings built as actual 3D curves/lines at separate inclinations/depths; avoid oversized nodes or service-object geometry.
- A very small central circular AWS core using restrained warm-white/champagne material and actual geometry; no large logo, cards or HUD.
- Mild independent, slow sphere/ring rotation, bounded and deliberate. No packets or later-checkpoint activity.
- Fit default camera composition to the screenshot and maintain useful depth/perspective; camera and transforms must not cull/hide rendered geometry. Keep all scene renderables and camera layer masks compatible through camera updates.
- Cap renderer pixel ratio; resize from the scene host; stop RAF when off-screen or hidden; obey reduced motion; dispose geometries/materials/listeners on teardown.
- WebGL initialization/context-loss fallback must keep the existing safe Home copy/content visible and not expose a fake-success scene state.

**Steps:**
1. Replace the command-network definitions and mesh-builder with only the globe, structural layers, rings and quiet AWS core. Remove selection/inspector/packet lifecycle from this checkpoint module.
2. Mount the canvas through existing Home hero initialization with no new visible controls or labels.
3. Keep scene dimensions/stacking Home-scoped; preserve surrounding copy and CTA positions.

**Verification:** `node --check js/home-command-scene.js`; verify changed paths are within scope; confirm no new external dependencies, no labels/packet/HUD markup introduced.

## Task 3: Build and inspect the actual local visual output

**Files:** no additional source changes unless a build error blocks verification. If visual quality fails, make only a Checkpoint-1 correction to geometry, camera, lighting, depth or composition, then rebuild and inspect again; do not proceed to the next checkpoint.

**Steps:**
1. Run `npm run build` and report any warning/error without changing unrelated code.
2. Open the local built Home page in Chromium, dismiss any intro overlay, and inspect the actual canvas screenshot at desktop and 390px widths. Verify visible 3D geometry rather than relying on WebGL initialization, scene graph contents or build success.
3. Confirm canvas framebuffer/rendered screenshot shows the globe, wire layers, inclined rings and small central AWS core; verify no console/runtime errors, no page horizontal overflow, and no fallback overlay when WebGL works.
4. Test reduced-motion as a static scene and WebGL/context-loss fallback without publishing.
5. Capture desktop and mobile checkpoint screenshots under profile cache/review storage; do not include review artifacts in the publisher's source tree.

**Acceptance / stop gate:**
- It is immediately recognizable as the screenshot's original orbital concept, not a command center, dashboard, architecture diagram, spinning-Earth asset, flat illustration or generic wireframe demo.
- Actual screenshot visibly shows a large spherical globe, fine layered champagne structure, separate-perspective orbital rings, subtle depth, dark field and small centered AWS core.
- The composition keeps generous negative space and existing homepage identity.
- Build and browser console checks pass; canvas rendering is visibly nonblank.
- Once these conditions are demonstrated, stop and send the local preview screenshots for explicit visual approval. Do not add network points, packets, atmosphere refinements, labels, camera UI or later-checkpoint features until the user approves Checkpoint 1.
- Never publish unless the user separately gives the exact approval `APPROVED TO PUBLISH`.
