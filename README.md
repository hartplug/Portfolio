# Philip Taiwo — AWS Cloud & IT Solutions Portfolio

Multi-page Vite portfolio with shared navigation, first-visit grid intro, page transition overlay, animated ASCII hand footer, and a Lab-page AI Status Orb. The project copy distinguishes anonymised paid client work from personal labs and does not publish prices or a phone number.

## Pages

- `/` — profile, services, selected work and quote CTA
- `/work.html` — selected work, with client work anonymised
- `/project.html` — AWS deployment case study, with no unsupported outcome metrics
- `/lab.html` — personal labs and WebGL AI Status Orb demo
- `/contact.html` — email-first quote requests
- `/3d.html` — earlier standalone 3D architecture demonstration; not yet integrated into the shared portfolio shell

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Production build:

```sh
npm run build
npm run preview
```

The site deploys to GitHub Pages automatically: pushing to `main` triggers `.github/workflows/pages.yml`, which builds with `GITHUB_PAGES=true` (Vite `base` `/Portfolio/`) and publishes to **https://hartplug.github.io/Portfolio/**. No manual hosting steps are needed. If the first run fails with a Pages-source error, open the repo's **Settings → Pages** once and set **Source: GitHub Actions**.

## Notes

- Main palette: near-black, red and cyan. The Orb uses its own state colors; the ASCII footer uses its separate brown/orange palette.
- Barlow Condensed, DM Mono, Geist Mono, and Inter are currently loaded from Google Fonts. Custom licensed font files were not provided.
- The Orb renders directly with WebGL 1 because current Three.js versions removed WebGL 1 renderer support. Three.js stays available for the site’s cityscape.
- Heavy effects are lazy-loaded: Three.js only for the home cityscape; the particle Orb only on the Lab page; GSAP/ScrollTrigger only where an SVG ring exists. No single JS output chunk exceeds 75 KB minified in the current build.
- The footer hands are generated locally by `scripts/generate-hands.py`; they are stylized generated artwork, not photographs.
- Contact uses `mailto:`; there is no server-side form submission.
- No real client-project imagery has been supplied. Any case-study visual must be approved, anonymised and accurately labelled.
- The 12-cell intro provides Enter and Skip controls. Native browser back/forward is preserved. Reduced-motion users skip animated overlays.
- GSAP core, Lenis and ScrollTrigger are installed. No licensed SplitText plugin is assumed.

## Before publishing

Review the wording and organization name. Add approved, non-confidential client visuals if available, then test every page, link, mobile view, reduced-motion behavior, and WebGL fallback in target browsers. This has not been deployed.
