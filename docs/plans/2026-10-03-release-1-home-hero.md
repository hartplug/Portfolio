# Portfolio Release 1: homepage hero

## Scope

Release 1 changes only the homepage hero and the styles/module needed to render it:

- Warm cream/off-white hero surface with dark typography and red/cyan accents.
- Exact stacked wordmark `TAIWO` / `PHILIPS` with a simple entrance reveal.
- Kicker `I automate what costs you time`, followed immediately by the compact service list.
- Primary CTA `Discuss an AWS project` to `contact.html`; secondary CTA to `work.html`.
- Responsive two-column desktop and stacked mobile composition.
- Main right-side visual: low-cost Three.js wireframe globe with routes/nodes for cloud, IT and workflows; visible label `CLOUD / SYSTEMS / WORKFLOWS`.
- Globe pauses offscreen/when tab hidden; static frame for reduced motion; CSS fallback if WebGL or dynamic import fails.

## Explicitly out of scope for this release

- No edits to Work, Case study, Lab, Contact, footer, or shared navigation.
- No CV/social/WhatsApp additions in this slice.
- No publishing until Sir reviews the release screenshots and explicitly approves this release.

## Files expected to change

- `/root/portfolio/index.html`
- `/root/portfolio/site.css`
- `/root/portfolio/js/app.js`
- New `/root/portfolio/js/hero-globe.js`

## Verification checklist

- `npm run build` exits 0.
- Run the actual Vite app and fetch its homepage; ensure correct project title and the new hero content are served.
- Chromium at 390, 768, 1440: no horizontal overflow, no console/page errors, correct CTA targets, exact hero copy, globe ready with fallback hidden.
- Verify `prefers-reduced-motion`: one static render/no RAF loop and entrance reveal disabled.
- Verify visibility pause/resume on scroll and tab visibility, WebGL unavailable/context-lost fallback, renderer/resource cleanup.
- Capture full-page phone and desktop screenshots, inspect visually, and send these screenshots to Sir for feedback.
- Stop before publish; wait for explicit approval of this release.
