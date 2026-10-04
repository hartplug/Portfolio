# Visual polish implementation plan

> For Hermes: execute in small, reviewed changes; do not publish before owner review.

**Goal:** Apply the approved visual and wording refinements to Philip Taiwo's multi-page portfolio.

**Architecture:** Keep changes in the existing Vite multi-page site. Adjust global nav/footer CSS, home hero/orbit/illustration CSS and JS, and the standalone 3D page copy/model presentation. Remove any actual portrait markup only if found; otherwise ensure no portrait appears. Preserve the illustrative label and existing service meaning.

**Tech Stack:** HTML, CSS, JavaScript, Vite, Three.js CDN.

---

### Task 1: Inspect 3D page and actual portrait references

**Objective:** Confirm the exact elements and 3D controls before editing.

**Files:** `3d.html`, `site.css`, `js/shared.js`, `js/home-orbit.js`, `js/aws-architecture.js`, `js/app.js`, all source HTML pages.

**Steps:** Search source files for portrait markup, the current hint text, model labels, scene camera/framing, mobile footer and nav rules. Record whether any portrait is present and identify all relevant source CSS/JS selectors. Do not modify generated `dist/` directly.

### Task 2: Apply hero copy, name motion, and glass navigation

**Objective:** Match the exact tagline and add tasteful accessible character motion and consistent liquid-glass navigation.

**Files:** `index.html`, `site.css`, `home-luxe.css`, shared nav markup if needed.

**Steps:** Set exact tagline “I automate what costs you time” in sentence case. Add a restrained stagger/vertical or brief fade motion to one alphabet character in the hero name. Use CSS keyframes and disable animation for `prefers-reduced-motion`. Apply liquid-glass surfaces to Home/Work/Lab/Contact links across all pages, with focus-visible and readable contrast states.

### Task 3: Improve orbit dimensionality and clarify controls

**Objective:** Make the hero orbit feel more 3D/floating and eliminate confusing interaction instructions.

**Files:** `index.html`, `home-luxe.css`, `js/home-orbit.js`.

**Steps:** Refine motion, depth, lighting/materials and layering without adding unnecessary features. Remove the ambiguous “Drag to explore”/similar instruction text; retain accessible canvas label and discoverable service buttons. Preserve click/tap and keyboard paths and reduced-motion behavior.

### Task 4: Remove unwanted model wording and fit the AWS map

**Objective:** Remove the confusing cloud/system/workflow copy on the standalone model and ensure the illustrative AWS scene is visibly framed.

**Files:** `3d.html`, relevant 3D CSS/module; `home-luxe.css`, `js/aws-architecture.js`.

**Steps:** Remove “Drag to rotate · click a node to inspect it” and related description/hint text per scope, without removing legitimate service descriptions elsewhere. Tune model camera/object scale and responsive stage sizing; preserve explicit illustrative-not-client label and accessible fallback. Test small phone, tablet and desktop dimensions.

### Task 5: Reduce mobile footer bulk and remove any portrait

**Objective:** Keep the mobile footer compact and ensure the old headshot is absent.

**Files:** `index.html`, all relevant portrait-containing source pages if any, `home-luxe.css`, `site.css`, `js/shared.js`.

**Steps:** Remove portrait image/figure if present; do not insert a placeholder photo. Adjust mobile footer typography, spacing, and canvas imagery without hiding key links/content. Ensure no horizontal overflow.

### Task 6: Build and verify for owner review

**Objective:** Validate the changes locally and present the result without publishing.

**Files:** Production build output under `dist/` only (generated).

**Steps:** Run `npm run build`; serve the actual built output and verify pages at 390px, 768px, and 1440px; check console errors, links, image/illustration visibility, nav interaction, no horizontal scroll, orbit initialization/fallback, and reduced-motion behavior. Capture screenshots for the owner. Do not run `scripts/publish.py` until the owner explicitly approves the finished preview.
