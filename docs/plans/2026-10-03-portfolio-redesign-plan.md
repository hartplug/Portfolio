# Portfolio redesign implementation plan

> **For Hermes:** Follow the approved portfolio redesign spec task-by-task. Ship only the first approved slice, then pause for Sir's review before the next release.

**Goal:** Transform the existing multi-page portfolio into a client-first, polished consulting site with verified proof, a premium cream/red/cyan visual system, recruiter path, and responsive motion.

**Architecture:** Keep the Vite multi-page static site and existing shared navigation/footer/motion primitives. Build the design system and hero first, then content/proof pages, then Lab/contact/recruiter/social-preview integration; reuse Three.js as an asynchronously loaded, low-cost hero globe that pauses offscreen and respects reduced-motion preferences.

**Tech Stack:** Vite 7, vanilla HTML/CSS/JS, existing GSAP/Lenis and Three.js 0.160 dependencies, Playwright/Chromium for viewport and interaction testing, GitHub Pages publisher (`scripts/publish.py`).

---

## Guardrails

- Work in `/root/portfolio/`; the local project is not a conventional Git repository. Do not invent a git commit workflow.
- Read `/root/.hermes/profiles/heartplug/PORTFOLIO_HANDOFF.md` before project work. It is authoritative for deployment and project scope.
- The user approved the design specification; each production release still needs the user's explicit approval of its release scope before publishing. Build the first visual/hero slice, verify it, show screenshots, and wait for feedback before release 2.
- Preserve exactly: hero wordmark `TAIWO` / `PHILIPS`; tagline `I automate what costs you time`; CTA `Discuss an AWS project`; globe label `CLOUD / SYSTEMS / WORKFLOWS`.
- Do not publish client names. Do not confuse demo/lab material with paid client work. Keep AgentBook and CloudCareer Buddy excluded.
- User requested no dates on site and no certification claims beyond linking CV/LinkedIn. Do not create a separate certification section.
- CV is to be copied exactly as supplied and approved; do not edit its contents.
- User approved public WhatsApp `+2348107644501`, email `taiwophilip@consultant.com`, supplied LinkedIn URL and GitHub `https://github.com/hartplug`.
- Do not use root-relative internal paths: deployment runs under `/Portfolio/`; keep HTML links relative. All source images/assets belong in `public/` or Vite-bundled imports.
- Release 1: implement only shared cream/red/cyan editorial tokens and homepage hero/wordmark/globe motion, including responsive/reduced-motion/failure fallback. Do not publish until the owner reviews the release screenshots and approves that release.

## Codebase facts

- Entries: `index.html`, `work.html`, `project.html`, `lab.html`, `contact.html`, `3d.html`.
- Shared styles: `site.css`; shared footer/intro/page transitions: `js/shared.js`; main interactions: `js/app.js`; AI orb: `js/ai-status-orb.js`.
- Current hero 3D/city effect lives in `js/app.js` and dynamically imports Three.js. Replace/rework it for the globe without duplicating Three.js initialization.
- `vite.config.js` sets base to `/Portfolio/` for Pages and prefixes a specific list of root assets; update that list if a new public script or stylesheet path must be prefixed.
- Publish command: `python3 scripts/publish.py` from `/root/portfolio`. Never push `.github/workflows/*`.
- Recent concept screenshots are exploratory only; actual production must be implemented in the real multi-page project and verified on the built output.

## Task 1: Stage verified public assets and make share-preview metadata

**Objective:** Place approved CV in the public asset directory and ensure site links can use the correct relative URL; add correct Open Graph/social preview metadata across pages using one chosen public preview image or a branded SVG.

**Files:**
- Create: `public/files/taiwo-philips-cv.pdf` (exact user-provided PDF copy)
- Create: `public/images/portfolio-social-card.svg` (custom title/brand card, no unsupported claims)
- Modify: `index.html`, `work.html`, `project.html`, `lab.html`, `contact.html`, `3d.html` metadata
- Modify: `vite.config.js` only if deployment asset rewriting requires it

**Steps:**
1. Copy the supplied source PDF from the cache document path into `public/files/` without altering it. Confirm byte-level hash of source and copy match.
2. Create a 1200×630 SVG Open Graph card with exact wordmark “TAIWO PHILIPS,” service positioning, warm cream background, black type, and red/cyan accents. Avoid phone, metrics, dates and unconfirmed claims.
3. Add `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` on every public page, with page-specific titles/descriptions and absolute production preview URL; retain correct canonical path/case.
4. Build and inspect output to confirm PDF, SVG and metadata paths resolve under `/Portfolio/`.
5. Run `npm run build`; check each public route and the actual emitted CV/social-card files.

**Acceptance:** source and copied PDF hashes match; all metadata URLs use exact `Portfolio` case and are externally resolvable; no root-relative page links introduced.

## Task 2: Define cream editorial tokens while keeping Lab dark

**Objective:** Establish a premium warm-cream editorial system for Home, Work and case study without washing out the dark Lab/orb experience.

**Files:**
- Modify: `site.css`
- Modify: page body wrapper/classes in `index.html`, `work.html`, `project.html` as needed
- Review: `lab.html`, `contact.html`, `3d.html`

**Steps:**
1. Create scoped tokens, e.g. `.theme-editorial { --bg: #f0ece4; --ink: #171819; --mute: #545c60; --red: #dc1723; --cyan: #008caa; }`, retaining enough contrast for body/eyebrow text.
2. Scope warm cream to Home, Work and case-study pages; keep Lab dark to preserve Orb state colours. Contact palette should transition coherently from cream but remain legible and consistent.
3. Redesign global nav, focus rings, buttons, links, status bar, cards, and footer colors against the new backgrounds; keep existing ASCII art brown/orange identity visible and readable.
4. Keep reduced-motion rules and keyboard focus indicators intact.
5. Capture representative Home, Work, case-study, Lab and Contact screenshots at 390/768/1440; test contrast and horizontal overflow.

**Acceptance:** no page inherits unreadable text colors; Lab Orb colors remain unchanged; no horizontal overflow; visible focus remains; footer links contrast on both light/dark backgrounds.

## Task 3: Build responsive homepage hero and wordmark entrance

**Objective:** Replace the current stylized split name hero with an offer-led hero and the approved stacked wordmark.

**Files:**
- Modify: `index.html` hero only
- Modify: `site.css` hero and responsive rules
- Modify: `js/app.js` only for entry reveal if CSS-only animation is insufficient

**Exact content:**
- Name: `TAIWO` on line one, `PHILIPS` on line two.
- Primary kicker: `I automate what costs you time`.
- Service list directly beneath: AWS architecture, IT solutions, AI & workflow automation.
- Headline/sub-copy must include secure AWS foundations and reliable deployments, without inventing delivery promises or service breadth.
- CTA: `Discuss an AWS project` → `contact.html`; secondary link → `work.html`.

**Steps:**
1. Implement a two-column desktop hero with left content, right animation stage, and warm grid/technical visual treatment.
2. Implement a simple staggered wordmark entrance reveal; disable motion with `prefers-reduced-motion`.
3. On mobile, stack content first then globe; keep title, services and CTA above the animation and comfortably tappable.
4. Ensure correct accessible heading semantics and link labels; make the graphic decorative where its text equivalent is redundant.
5. Test 390/768/1440 in browser and inspect screenshots.

**Acceptance:** exact approved text; no unsupported stats/dates; mobile CTA visible and legible; no overlap/overflow; reduced-motion disables reveal.

## Task 4: Add the lightweight hero wireframe globe

**Objective:** Animate a 3D globe with routes/nodes representing cloud, IT and workflows.

**Files:**
- Create: `js/hero-globe.js`
- Modify: `index.html` add hero mount and a static accessible fallback
- Modify: `js/app.js` dynamically import hero-globe module only when mount exists
- Modify: `site.css` for responsive stage and reduced-motion fallback

**Implementation requirements:**
1. Reuse installed Three.js; dynamic import it only on pages containing `[data-hero-globe]`.
2. Use low geometry and restrained particle/node count; cap DPR (≤1.5 phone, ≤1.75 desktop) and disable antialias on phone.
3. Render wireframe/sphere with highlighted routes and nodes using red/cyan; label outside canvas: `CLOUD / SYSTEMS / WORKFLOWS`.
4. Slow steady rotation and gentle route glow; avoid fast, flashy transitions. Respect reduced motion by rendering a static frame only.
5. Pause RAF when offscreen and while `document.hidden`; resume when visible. Clean up observers, listeners, geometry, material, renderer on `pagehide`.
6. On WebGL init failure or `webglcontextlost`, hide canvas and show CSS/static fallback; never throw an unhandled error.
7. Test state via own `ready`/fallback classes and browser console; do not rely on WebGL1 probe/pixel sampling. Visually inspect screenshot to confirm globe exists.

**Acceptance:** no console errors; accessible fallback visible on failure; no duplicated rendering; offscreen/document-hidden pause works; reduced motion produces a single static render; phone/desktop performance acceptable.

## Task 5: Release 1 verification and review gate

**Objective:** Verify and present the hero/visual foundation as the first small release without publishing until the user approves the release.

**Checks:**
- Run `npm run build`.
- Start the actual Vite app on a free chosen port; verify HTTP title/body for `/`, `/work.html`, `/project.html`, `/lab.html`, `/contact.html`.
- Use browser at 390, 768 and 1440; check horizontal scroll, load-time/runtime console errors, nav and CTA links, wordmark exact text, globe state/fallback, reduced-motion behavior, contrast, screenshot appearance.
- Capture phone and desktop screenshots of the actual project.
- Show owner the phone/desktop release screenshots and summary; wait for his explicit release approval before running publisher.
- After approval, run `python3 scripts/publish.py`; check each live route and screenshot live phone/desktop Home. Send live URL and screenshots.

## Task 6: Strengthen service, case study, proof and diagram content

**Objective:** Turn the selected work into a clear, honest proof section/page.

**Files:**
- Modify: `index.html`, `work.html`, `project.html`, `site.css`
- Create: `public/images/it-automation-workflow.svg` (simple custom illustration)

**Steps:**
1. Use a consistent `CLIENT DELIVERY` label for the existing anonymised AWS project and preserve only its confirmed scope: EC2, RDS, S3, VPC, IAM, deployment, basic backups and CloudWatch.
2. Keep multi-tier AWS and Claude document engine explicitly labelled `DEMO / PASSION PROJECT`; retain user-confirmed metrics only with precise attribution to those demos, never the client engagement.
3. Preserve personal serverless learning as `PERSONAL LAB`, not client delivery.
4. Create a general IT/automation workflow diagram, label it `Illustrative workflow — not client evidence`, and keep it separate from the AWS case study.
5. Put meaningful alt text/captions and link cards to case details.
6. Verify every claim against the approved spec/current site/resume evidence ledger; omit uncertain outcomes and durations.

**Acceptance:** clear separation of client work/demo/lab/illustration; no client names or dates; diagram caption distinguishes illustration; every card links to correct page/anchor.

## Task 7: Homepage content hierarchy and Orb teaser

**Objective:** Add practical service detail, trust explanation, process and Orb teaser without cluttering the homepage.

**Files:**
- Modify: `index.html`, `site.css`

**Steps:**
1. Present three offers in order: AWS architecture/setup; cloud operations/access/backup/monitoring; IT plus workflow automation.
2. Add a compact proof-status key (client delivery, demo, lab) and ensure all work items carry matching labels.
3. Add four-step process: understand, scope, build, hand over; only use realistic language without unconfirmed response time/availability guarantees.
4. Add a brief Orb teaser using an efficient static preview or reduced-cost effect, linked to `lab.html`; do not load a second full 3D effect unnecessarily.
5. Test headings/reading flow on mobile and desktop.

**Acceptance:** visitors can scan offer, proof and next action in order; Orb retains signature role and full Lab interactivity remains on Lab; no invented testimonial/guarantee.

## Task 8: CV, contact, social links, footer and final integration

**Objective:** Complete recruiter and client paths across shared site elements.

**Files:**
- Modify: `js/shared.js`, `index.html`, `work.html`, `project.html`, `lab.html`, `contact.html`, `site.css`
- Reuse: CV and approved LinkedIn/GitHub/WhatsApp details

**Steps:**
1. Ensure CV download is present in shared header and footer using the exact public PDF URL.
2. Add LinkedIn and GitHub links to footer and relevant contact/recruiter route.
3. Add WhatsApp link `https://wa.me/2348107644501` and email `mailto:taiwophilip@consultant.com`; clearly label both routes.
4. Update runtime-injected footer markup in `js/shared.js` as well as any static footers to avoid page mismatch.
5. Check navigation and generated links remain relative where internal; external links use sensible `rel` when opening a new tab.
6. Test CV download, email mailto URL encoding, WhatsApp click-to-chat destination, profile links, social previews, and footer on cream and dark pages.

**Acceptance:** CV served unchanged; contact/profile links open correct targets; same shared footer on all routes; no personal phone beyond the explicitly approved WhatsApp/CV; no placeholders.

## Task 9: Full regression, polish, publish release(s)

**Objective:** Verify the approved redesigned site and ship each reviewed slice.

**Checks:**
- `npm run build`.
- Browser widths 390, 768, 1440 for every page including `3d.html` and Lab Orb.
- No horizontal overflow, uncaught console/runtime errors, broken assets/routes, weak contrast, broken focus states, reduced-motion failures or misleading labels.
- `og:*` metadata complete; generated social-card and CV HTTP 200 on built/live paths.
- Check internal routes in built output; all are relative and use case-sensitive `/Portfolio/` base.
- Lab Orb retains controls and colors; globe performance/fallback tested.
- Capture final screenshots for each release at phone and desktop.
- Only publish a release after Sir approves that slice; after publish, check live site and report verified URL plus screenshots.

## Plan self-review

- The plan separates releases and protects against a big unreviewed production launch.
- User-approved wordmark spelling is preserved as requested; legal name may still be used for factual metadata where necessary only after confirmation.
- The “cream editorial / dark Lab” palette division is explicit.
- 3D globe requirements include reduced motion, performance caps, offscreen pause, cleanup and fallback.
- Assets must be copied without modification; client/demo/lab evidence remains clearly separated.
- A review checkpoint precedes every publish operation.
