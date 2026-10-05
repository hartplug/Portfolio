# Home → Lab → Infrastructure Observatory — Design Spec

## Approved direction
Use the current portfolio's near-black, restrained champagne/gold visual language with cool accents sparingly. Do not add the older red/cyan treatment. Preserve the shared site navigation/footer and do not publish yet.

## Information architecture
- Home: personal brand, capabilities, work, credibility, and contact. Remove the entire Live Model/3D infrastructure experience and its mount from Home; do not replace it with another large canvas. Keep Home's hero and existing consulting content.
- Lab: an editorial, curated collection rather than a large WebGL demo. Heading: `LAB` / `Experiments in infrastructure.` Support: `Prototypes, systems, and technical experiments exploring cloud architecture, automation, and operational design.`
- Lab featured entry: `INFRASTRUCTURE OBSERVATORY` with concise explanation, strong architectural preview/art direction, and clear `EXPLORE EXPERIMENT` action linking to a dedicated page.
- Retain AI Status Orb and existing serverless learning lab as secondary experiments, reduced visually so neither dominates the Lab page. Keep personal labs clearly distinct from client work.
- Dedicated observatory route: full immersive AWS environment, reached only from Lab via the feature link and with an explicit route back to Lab. Register page in Vite multi-page build.

## Dedicated Infrastructure Observatory
- Move/reuse the existing 3D infrastructure code and six inspection modes/service selection without downgrading functionality.
- Opening view frames the actual architecture at a readable scale; no huge empty canvas or abstract green object.
- Calm, restrained ambient motion; no default auto-rotation. Provide `DRAG TO EXPLORE` and `RESET VIEW` controls.
- Retain component details and WebGL fallback. Respect reduced motion.
- Preserve illustrative/not-client-deployment disclaimer.

## Out of scope
- No redesign of global navigation, Home hero, Work/Case Study, Contact, or global typography/color tokens.
- No publish/deploy while preparing this slice.
- Do not represent the illustrative model as a client deployment.

## Acceptance
1. Home contains no Live Model section, AWS scene canvas, mode controls, or observatory mount; Home still includes its intended consulting sections and intact hero.
2. Lab reads as an editorial experiment index and puts the Observatory first, with a clear route to the dedicated experiment.
3. Full 3D Observatory runs only on its dedicated page; no accidental duplicate initialization, missing module paths, or broken links.
4. Opening scene is readable and framed, drag-to-explore works, reset view works, no automatic spin dominates, all six modes and component selection work.
5. Home, Lab and observatory routes build and render at 390, 768 and 1440px with no horizontal overflow, clear control targets, reduced-motion support and WebGL fallback.
6. Do not publish until owner explicitly asks.
