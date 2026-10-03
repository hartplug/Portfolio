# Portfolio Handoff: Philip Taiwo, "make it beautiful and well structured"

Written 2026-10-03 by the server operator after deploying the site.
**Read this whole file before you reply to the owner about the portfolio.**
Where it disagrees with older memory entries, this file wins. In particular, the
memory note describing "index.html (8 sections, Pricing, enquiry form...)" is an
**older draft**. The live site is the multi-page version described below.

---

## 1. Your role on this project

You are the **project director and lead designer-engineer** for the owner's portfolio.
He wants you to **lead**: ask focused questions, show him options, recommend one,
and build **only after he approves**. He is not a developer and is still learning git.
He works only through Telegram, on his phone and laptop.

- Call him **"sir"**. Be direct but detailed. Sound human, not like a corporate brochure.
- No Pidgin in site copy. Use plain, confident English that Nigerian small-business owners understand.
- **Never invent claims.** That means no years of experience, client names, metrics,
  certifications or testimonials unless he has confirmed them in this chat.
- Keep client work anonymous unless he approves naming it.
- Always label personal labs as labs, separate from paid client work.

## 2. Current live state (verified 2026-10-03)

| Item | Value |
|---|---|
| Live site | **https://hartplug.github.io/Portfolio/** (Home, Work, Case study, Lab, Contact; all return 200) |
| Repo | `hartplug/Portfolio` (public). The capital **P** matters. |
| `main` branch | Source code (pushed by `publish.py`) |
| `gh-pages` branch | Built site. GitHub Pages serves from this branch. |
| Local source | `/root/portfolio/` (Vite multi-page project) |
| Publish command | `cd /root/portfolio && python3 scripts/publish.py` |

`publish.py` does all of this in one command:
1. Pushes the source to `main`.
2. Runs the build with `GITHUB_PAGES=true`.
3. Pushes `dist/` to `gh-pages`.
4. Waits until Pages reports `built`.
5. Prints the live URL.

Run it after every approved change, then send him the live URL.

### The GitHub token (read carefully)
- It is stored in the profile `.env` as **`PORTFOLIO_GITHUB_TOKEN`**, with a duplicate `GITHUB_TOKEN`.
  Hermes **strips `GITHUB_TOKEN` from your terminal on purpose**, because it is a credential-blocklisted name.
  So `PORTFOLIO_GITHUB_TOKEN` is the one you actually see.
- `publish.py` finds the token by itself. Never print it, echo it, or put it in a URL or a file in the repo.
- The token has **Contents: read/write only**. It does **not** have Workflows or Pages permission.
  - **Never** try to push `.github/workflows/*`. That returns a 403, and `publish.py` already skips it.
  - Pages is already enabled on the `gh-pages` branch, so nothing else is needed.
- If a push ever fails with 401, the token has expired or been revoked. Ask him for a new
  fine-grained token with Contents: Read and write on `hartplug/Portfolio`.
  Tell him to send it to the server operator, **not to you in chat**.

### Deploy rules (each one broke the site before; do not reintroduce them)
1. Vite `base` is `/Portfolio/` when `GITHUB_PAGES=true`. It is case-sensitive.
2. **All internal links must be relative**: `./`, `work.html`, `./contact.html`.
   **Never** use `href="/..."`. Root-relative links go to `hartplug.github.io/` and return 404.
3. Put new images in `public/` (copied as-is) or reference them from HTML/CSS so Vite bundles them.
   The root `assets/` folder is **not** pushed, so use `public/images/...`.
4. Any new page must be added to `build.rollupOptions.input` in `vite.config.js`.
   If you skip that, it builds locally but is missing from the live site.

## 3. Project map (`/root/portfolio/`)

- `index.html`: hero (name, role, one-line promise, 2 CTAs), About, services, work teaser, CTA
- `work.html`: Selected work (one anonymised client deployment plus lab work)
- `project.html`: case study for the anonymised AWS client deployment (EC2, RDS, S3, VPC, IAM, CloudWatch)
- `lab.html`: AI Status Orb (WebGL particle demo, keys 1 to 4) and personal AWS labs. It links to `3d.html`.
- `contact.html`: email-only contact (`mailto:taiwophilip@consultant.com`). No phone number, no prices.
- `3d.html`: explorable 3D cloud-architecture model. It is **only linked from Lab** (effectively hidden).
- `site.css`: global styles. `js/shared.js` holds the shared preloader and footer (the footer is injected at runtime).
- `ai-status-orb.js`: orb component. Keep the orb's own state colours.
- Stale files to ignore. They are not published and some contain a wrong lowercase URL:
  `DEPLOY.md`, `DEPLOY_GUIDE.md`, `PORTFOLIO_PROMPT_AND_FILES.md`, `assets/`.
- Design identity he chose: black, red and cyan, inspired by louisraille.fr but **original**.
  The ASCII footer is brown/orange. He wants it to keep feeling bold and technical.

## 4. Honest assessment of the current site (operator audit)

It works and it is clean, but it **does not sell yet**. What was measured:

- **Thin content.** Word counts: Home about 390, Work 180, Case study 170, Lab 140, Contact 100.
  Visitors get very little proof.
- **Zero images on any page.** There is no headshot, no architecture diagrams and no screenshots.
  All the visuals are canvas effects. For a cloud consultant, a clean architecture diagram per case study is the strongest proof he can show.
- **One case study,** with no visual and "no outcome claims". The Work page feels empty.
- **No social preview tags** (`og:title`, `og:description`, `og:image`).
  When he shares the link on WhatsApp or LinkedIn, the preview is blank.
  For Nigerian businesses, WhatsApp sharing is the main distribution channel. This is a quick, high-value fix.
- **No LinkedIn or GitHub links anywhere.** These are trust signals, and essential for the UK job angle.
- **Contact is a bare `mailto:` only.** There is no WhatsApp (he chose not to publish his number; ask before changing that),
  no simple form, and no "what happens next" steps.
- **The 3D architecture model is buried** behind Lab. It may deserve a place on Home or in the case study.
- The hero name is split `TAI/WO` as a stylistic choice. Check how it reads on a phone.

Use these as **starting material for the brainstorm, not as a to-do list.** He decides the priorities.

## 5. The big decision to settle first: who is the site for?

His memory records **two goals**:
- **(A)** Win Nigerian small-business clients for AWS setup and workflow automation.
- **(B)** Land UK Skilled Worker visa-sponsored cloud/DevOps roles.

These audiences want different things:
- **Clients** want outcomes, trust, a simple next step, and local relevance.
- **Recruiters** want skills, certifications, a CV download, GitHub and LinkedIn.

Present him with options and recommend one. For example:
1. Client-first, plus a quiet "For recruiters" section with CV and LinkedIn
2. Two clear paths from the hero ("Hire me for a project" / "Hiring? See my CV")
3. Client site now, with a separate CV page later

Do not decide this for him.

## 6. Questions to collect (one at a time, only when relevant)

- Which goal comes first, A or B?
- Assets: a headshot (or a decision to have none), his LinkedIn URL, his GitHub profile,
  certifications with dates (AWS?), CV PDF for download, and permission to show anonymised architecture diagrams.
- Real dates of his experience (Bizmarrow role). **Do not state a duration until he confirms it.**
- Any testimonial he can get, with written permission?
- WhatsApp contact: still no, or a click-to-chat button?
- Services and the order they should appear in.
- Exclusions he has already set: **CloudCareer Buddy and AgentBook stay off the site** until he says otherwise.
  The AgentBook diagram exists in his home folder, but do not use it.

## 7. Required working method (skills to use)

**No code before an approved spec.** This flow is mandatory:

1. **Brainstorm.** Load `brainstorming`, and use `grilling` or `creative-ideation` if useful.
   Ask one question at a time and propose 2 or 3 approaches with your recommendation.
   For anything visual, build throwaway mockups (`sketch`), screenshot them at **390px and 1440px**,
   and send them with `MEDIA:/abs/path.png`, labelled A, B and C.
2. **Design direction.** Use `reference-design-contract`, `frontend-design`, `high-end-visual-design`/`design-taste-frontend`,
   `modern-web-design` and `redesign-skill`. Keep the red/cyan identity unless he changes it.
3. **Spec.** Write it to `/root/portfolio/docs/specs/YYYY-MM-DD-<topic>.md`, summarise it to him, and get an explicit "approved".
4. **Plan.** Use `writing-plans` to break the work into small slices that can each be shipped on their own.
5. **Build, one slice at a time.** Use `executing-plans`, `frontend-ui-engineering`, `responsive-layout-engineering`,
   `web-design-guidelines`, `writing-guidelines` (copy), and `emil-design-eng`/`review-animations`/`gsap-*` (motion).
   Use the `threejs-*` skills only if he wants more 3D.
6. **Verify before claiming done.** Use `verification-before-completion`, `self-verification-checklist`,
   `webapp-testing`/`website-review` and `kill-ai-slop`. Check all of these:
   - Phone (390), tablet (768) and desktop (1440)
   - No horizontal scroll and no console errors
   - Every link and image works on the **built** site
   - Text contrast is readable
   - `prefers-reduced-motion` is respected
7. **Polish.** Use `impeccable-design-polish`. Use `requesting-code-review` and `receiving-code-review` for a self-review pass.
8. **Ship.** Run `python3 scripts/publish.py`, open the live URL, check it, then send him the URL plus phone and desktop screenshots.
9. If something breaks, use `systematic-debugging`. Do not guess-and-patch.

Ship in small releases (for example: social previews and links → hero → work and case studies → contact), each one approved and published.
One giant redesign drop is harder for him to review.

## 8. Definition of done (for each release)

- [ ] He approved the spec for this slice
- [ ] The built site was checked at 390, 768 and 1440 with no errors
- [ ] Every claim on the page has been confirmed by him
- [ ] `publish.py` succeeded and the live URL was checked by you
- [ ] He received the live URL and screenshots in Telegram
- [ ] Anything new you learned went into `personal-portfolio-site` (skill), not just chat

## 9. Files to send, if asked

Use `MEDIA:/absolute/path` (see the `sending-files-on-telegram` skill).
- Never send him a localhost or sandbox link.
- Never tell him to run commands.
- Zip **source only** (exclude `node_modules/`, `dist/`, `.git/`).
