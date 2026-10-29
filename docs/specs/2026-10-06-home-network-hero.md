# Home Network Hero and Request Lifecycle

## Goal
Replace the current Home hero infrastructure visualization with an original, polished 3D miniature inspired by the user's supplied cloud-network reference. Animate one complete simulated request/response lifecycle over the displayed architecture. Preserve the existing hero copy, CTA buttons, overall page composition, and the rest of Home. Do not publish.

## Confirmed direction
- Use the supplied image as visual reference only; recreate rather than use the image itself.
- Compose a polished 3D miniature with depth, dark architectural surfaces, and restrained light accents, fitting the established black/red/cyan site identity.
- Depict a representative generic web architecture: **USER → INTERNET DNS → LOAD BALANCER → WEB & APPLICATION SERVERS → DATABASE and OBJECT STORAGE → RESPONSE to USER**.
- Keep lifecycle nodes and traffic coherent with visible connections. Database and Object Storage may be shown as separate branches from the application tier; both complete before response returns through the load balancer and DNS to the user.
- No extra controls or HUD. Use the existing hero's labels/overlays only if already part of the Home composition; avoid adding new UI.
- Preserve the name, role, promise, CTA buttons, current hero dimensions/hierarchy, and the rest of the page.
- Local review only; no remote writes or publishing.

## Visual behavior
- Dark, subdued architecture is the resting state.
- Small bright directional packets travel on the corresponding actual route curves; a short, subtle trailing bloom clarifies travel direction.
- On arrival, briefly activate only the destination node with a controlled gold/champagne glow and return it to its resting appearance before/while the next packet proceeds.
- Sequence: User → DNS → Load Balancer → Web/App → parallel Database and Object Storage requests → service completion/rejoin → response via Load Balancer → DNS → User.
- Keep unused routes subdued. Avoid simultaneous all-line glow, giant glowing cables, neon/gaming styling, invented telemetry or uptime metrics.
- Maintain reduced-motion behavior: static diagram, no moving packets or flashes, with semantic state still available.

## Technical scope
- Replace/refactor the current Home command-scene module and only the Home-specific markup/styles needed for this architecture. Preserve other routes and the underlying portfolio.
- Use existing Three.js/Vite dependencies. No new dependencies.
- Use deterministic route data and a clock that advances from a single RAF-owned monotonic timestamp; manual renders (resize, pointer, selection) must not advance/reset lifecycle time. Pause when offscreen/hidden and resume without a jump.
- Keep semantic names/status accessible without requiring color alone. Maintain WebGL fallback and cleanup behavior.
- The shown system is illustrative, not live infrastructure. Do not imply 99.9% uptime or live traffic from the reference image.

## Acceptance checks
1. `node --check js/home-command-scene.js` and `GITHUB_PAGES=false npm run build` pass.
2. Browser run sees the ordered states: USER→DNS, DNS→LOAD BALANCER, LOAD BALANCER→WEB/APP, WEB/APP→DATABASE & OBJECT STORAGE, service completion, response through load balancer, DNS, and User completion; the cycle repeats.
3. A full captured recording shows one complete request/response. Confirm by recorded inspector/semantic states (or a test-only state trace) and review representative rendered frames.
4. Packets visibly move along their respective routes; arrival activates only the destination node; unrelated routes remain subdued. No simultaneous whole-network glowing wires.
5. No browser errors, no horizontal overflow, and readable/uncropped scene and name at 390px, 768px, and 1440px.
6. Reduced-motion mode has no traveling packets/flashes and still identifies the lifecycle.
7. Send sir desktop and mobile screenshots plus the verified complete-cycle recording. Leave unpublished.

## Out of scope
- Publishing, editing any non-Home page, redesigning the site's overall hero copy/layout, adding a new traffic graph/uptime metric/HUD, or including literal artwork from the supplied image.