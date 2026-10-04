# Release 2: animated shared footer

## Approved decisions
- Adapt Sir's GSAP/ScrollTrigger/SplitText/Lenis footer animation prompt to the existing portfolio.
- Preserve the four current footer links and current footer sentence/layout.
- Use the existing local hand-left/right illustrations. Preserve the warm cream background and brown/orange ASCII aesthetic.
- Replace the large bottom title with two stacked lines from the approved tagline: “I automate” / “what costs you time”.
- Use only the existing footer trigger. Do not add three full-height `.one/.two/.three` sections.
- Apply the shared footer to all existing pages.
- Responsive canvas sizing: CSS translates existing wrappers for subtle pointer parallax; image-sampled ASCII image created at initial dimensions.
- Release remains unpublished until Sir reviews screenshots and explicitly approves the Release 2 build.

## Implementation plan

1. Update `mountFooter()`/footer markup in `js/shared.js` to expose canvas layers and semantic headline while retaining links/text.
2. Replace generated hand shapes and manual IntersectionObserver footer animation with real local images and Canvas character conversion. Respect requested ramp/colors/hover cluster behavior; choose reasonable initial grid/font based on measured asset sizes, cap DPR to 2; no per-frame rebuild of static cells; only animate RAF while footer is visible and when not reduced-motion.
3. Add pointer parallax driven by mouse/pen, disabled for coarse pointers and reduced-motion; clamp/lerp values and reset on pointer leave.
4. Dynamically load GSAP ScrollTrigger, GSAP SplitText (from installed GSAP), and Lenis only on pages with footer. Integrate Lenis RAF with GSAP ticker and ScrollTrigger updates without duplicate smooth-scroll instances. Check current `js/app.js` page transition semantics; use Lenis on all pages or safely omit Lenis on touch/reduced motion if needed.
5. Build scroll-triggered reveal at the `.footer-revealer`: animate hand wrappers inward, split headline characters from center, reveal nav/text. On leave-back restore state; use cleanup/kill triggers on `pagehide`.
6. Fallback gracefully if GSAP SplitText or canvas/image decode fails: keep all footer text visible; no hidden text and no blocking page.
7. Verify with Vite build and Chromium at 390, 768, 1440 across all 6 HTML pages. Check console, reduced motion, mouse interaction, footer trigger/reverse, canvases and image paths. Capture Home phone/desktop screenshots and at least one dark Lab screenshot.
8. Share screenshots; wait for explicit approval before publishing. Then `python3 scripts/publish.py`, verify the live pages and attachments.

## Out of scope
- No global `.one/.two/.three` page additions.
- No “Blank / Canvas” headline.
- No changes to home hero or body content, other than needed initialization for footer.
- Do not alter artwork source files.
