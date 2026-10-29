# Philip Taiwo — AWS Cloud & IT Solutions Portfolio

Multi-page Vite portfolio with shared navigation, first-visit grid intro, page transition overlay, animated ASCII hand footer, and a Lab-page AI Status Orb. The project copy distinguishes anonymised paid client work from personal labs and does not publish prices or a phone number.

## Pages

- `/` — profile, services, selected work and quote CTA
- `/work.html` — selected work, with client work anonymised
- `/project.html` — AWS deployment case study, with no unsupported outcome metrics
- `/lab.html` — personal labs, Infrastructure Observatory entry, and WebGL AI Status Orb demo
- `/automation-lab.html` — integrated deterministic Automation Discovery Studio; answers stay in page memory and inquiry drafts are visitor-controlled
- `/contact.html` — email-first quote requests
- `/observatory.html` — interactive infrastructure model linked from Lab
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

The project builds to the local `dist/` directory; the build output is generated and should not be hand-edited.

## Notes

- Main palette: near-black, red and cyan. Lab editorial surfaces use warm champagne details; the Orb keeps its own state colors; the ASCII footer uses its separate brown/orange palette.
- The Automation Discovery Studio is a personal lab, not client delivery. It uses deterministic browser logic, not a live AI model; it does not call C2.9, any public backend, or any AI provider.
- Automation Studio answers exist only in page memory while the page is open. The app does not submit or persist answers. A prepared email opens in the visitor's own email app, and is sent only if the visitor chooses. Clipboard failure reveals a selectable manual-copy field.
- The Automation Studio brief separates visitor-supplied information, assumptions to confirm, proposed workflow/architecture, unmeasured potential benefits, and questions before implementation. All recommendations are illustrative, not live integrations, deployments, measured savings, or guarantees.
- Barlow Condensed, DM Mono, and Inter are loaded from Google Fonts. Custom licensed font files were not provided.
- The Orb renders directly with WebGL; its four preview states are manually selected. The site also uses Three.js for selected scenes.
- Heavy effects are lazy-loaded: Three.js only where needed, the particle Orb only on the Lab page, and GSAP/ScrollTrigger only where effects are present.
- The footer hands are generated locally by `scripts/generate-hands.py`; they are stylized generated artwork, not photographs.
- Main Contact uses `mailto:`; there is no server-side form submission. The Automation Studio inquiry is also only a visitor-controlled email draft.
- No real client-project imagery has been supplied. Any case-study visual must be approved, anonymised and accurately labelled.
- Reduced-motion behavior is respected by the shared shell and the Studio's scoped motion styles.

## Before publishing

Review the wording and organization name. Add approved, non-confidential client visuals if available, then test every page, link, mobile view, reduced-motion behavior, and WebGL fallback in target browsers. Local changes are not published until explicitly approved.
