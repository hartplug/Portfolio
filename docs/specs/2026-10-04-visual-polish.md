# Visual polish — approved scope

## Intent
Apply the user's requested UI fixes to the live multi-page portfolio, preserve accurate portfolio claims, and show the finished local preview for review before publishing.

## Approved changes
- Remove the current profile/headshot image, if present; keep the portrait area empty until the user supplies a replacement.
- Make the hero line read exactly “I automate what costs you time” in sentence case.
- Animate a character in “TAIWO PHILIPS” with a restrained vertical motion or brief disappearance/reappearance; respect reduced-motion preferences.
- Give the Home, Work, Lab and Contact navigation items a consistent liquid-glass style.
- Improve the home orbit's 3D depth and floating motion while preserving controls and its service meaning.
- Remove instructional “Drag to explore” copy and the unwanted “cloud/system/workflow” label/copy where it refers to that specific 3D model, without removing accurate descriptions of services elsewhere.
- Keep the AWS system-map illustration, explicitly illustrative; resize its scene/camera/object fit and mobile height so the visualization is visible and contained.
- Reduce the oversized footer treatment on mobile without removing footer navigation or essential content.

## Implementation and review
Modify the source project only; do not publish until the user reviews and explicitly approves the finished changes. Build and inspect the local production output at phone (390px), tablet (768px), and desktop (1440px); check overflow, navigation, 3D initialization/fallback and reduced motion. Then present the local changes through screenshots/summary and request review. Publishing remains a separate approval gate.

## Out of scope
No replacement photo yet; no new factual claims; no changes to client identity, work history, pricing, contact details, or site-wide service claims.