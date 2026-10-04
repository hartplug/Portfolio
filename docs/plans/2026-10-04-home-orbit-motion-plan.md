# Home hero orbital system and obsidian motion background

## Approved scope
- Change Home page only (`index.html`, Home-specific CSS/JS modules). Do not restyle Work, Case Study, Lab, Contact, or the warm ASCII footer.
- Preserve all current Home text, headings, body copy, CTA text and existing layout positions.
- Replace current globe with a premium orbital system: three separate orbit labels **CLOUD**, **WORKFLOWS**, **IT SOLUTIONS** move around a central 3D/cloud systems object. Labels remain readable on desktop and phone.
- Drag interaction rotates the system. Tap a label/node opens a short detail panel; do not invent facts, service claims or metrics. Initial short details can name only the confirmed offer categories; use accurate neutral copy.
- Restyle the whole Home content area with deep obsidian/ink and champagne accent; restrained copper and cool glacier highlights. Use a subtle animated atmospheric motion background across Home only.
- The global Home nav/status bar should be styled for the dark Home theme, while the footer remains cream and brown/orange.
- Reduced motion: freeze globe/orbits and disable drag; maintain a non-animated luxury texture/background and readable labels.
- Add a separate, interactive 3D AWS architecture panel below hero and before About. Show only confirmed services (EC2, RDS, S3, VPC, IAM, backups, CloudWatch), and label clearly "Illustrative architecture" to distinguish it from the anonymised client deployment. Premium but calm movement: route pulses and slow 3D camera/scene drift, with controls/tap for component details.
- Keep the overall Home experience explicitly 3D-motion-rich: rotating orbit plus background light/particle motion and 3D architecture animation; no boring static hero. Keep motion low-key and legible, with no unnecessary fast effects.
- Share phone and desktop screenshots as a preview. Do not publish until Sir explicitly approves.

## Plan
1. Create Home-scoped theme class/tokens in `index.html`/`site.css`; avoid generic `:root.theme-editorial` changes, since those affect other pages.
2. Rebuild hero globe as a Three.js group with luminous core, orbital rings/labels and detail panels. Add pointer/touch drag; support reduced motion; keep copy and CTA positions.
3. Add a distinct Home 3D AWS scene below the hero and before About, labeled "Illustrative architecture". Include only confirmed components; animate data-route pulses and slight scene motion. Provide labels and accessible focus/click detail panel; static fallback.
4. Add Home-only atmospheric lighting/particle motion, and keep orbit/background gentle. Respect reduced-motion and visibility; no heavy, always-running effect when offscreen.
5. Update initialization only for Home. Ensure Home styles do not leak onto Work, Case Study, Lab, Contact or warm ASCII footer.
6. Verify 390/768/1440 in Chromium: drag vs tap details, touch and keyboard, reduced-motion, route links/claims, contrast, console, overflow. Capture hero/architecture close-ups and full phone/desktop views.
7. Send screenshots; hold publication pending Sir approval.

## Out of scope
- No publishing or production source push before preview approval.
- No edits to body text or CTA wording.
- No Home service section content rewrites, extra orbit panels on lower pages, or global restyle of non-Home routes.
- No invented portfolio facts or metrics.
