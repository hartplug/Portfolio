# Portfolio redesign — design specification

**Status:** Draft for Sir's review — not approved for implementation.  
**Scope:** Redesign current multi-page portfolio, client-first for Nigerian businesses while also serving UK recruiters.

## Project goals

- Help Nigerian business clients quickly understand Taiwo Philips's AWS and practical IT/automation offer and contact him.
- Provide recruiters a straightforward CV download and direct profile links, without competing with the client-first journey.
- Build trust through clear, accurate, well-labelled proof and polished visual presentation.
- Retain the existing multi-page architecture: Home, Work, AWS case study, Lab, Contact. Keep the separate Lab and case study pages.

## Audience and positioning

- Primary experience: prospective Nigerian small-business clients.
- Secondary route: UK recruiters/hiring teams through CV, LinkedIn and GitHub.
- Services: AWS architecture/setup first; IT solutions and AI/workflow automation alongside.
- Hero headline/value hook: **“I automate what costs you time”** as the primary kicker; put the service list directly beneath it.
- Hero primary CTA: **“Discuss an AWS project”**, linking to Contact.
- Explicit benefit language: secure AWS foundations and reliable deployments.

## Visual direction

- Use warm cream/off-white across the Home page and editorial Work/case-study content. Retain dark ink text with red/cyan accents and occasional restrained amber for demo labels. Keep the Lab/AI Orb environment dark to preserve contrast and its existing state colors; retain the ASCII footer's brown/orange identity where legible.
- Tone: confident, practical, technical, refined; avoid generic enterprise templates.
- Homepage hero wordmark: **“TAIWO” / “PHILIPS”**, stacked on two lines, with a simple entrance reveal. This spelling/order was explicitly confirmed by the user even though it differs from the previously recorded legal name; preserve it exactly for the design pending final content review.
- Hero layout: clear offer/content on left and a large lightweight 3D wireframe globe on the right (mobile adapts to a legible stacked composition).
- Globe: illustrate cloud infrastructure, IT support, and automation with connected routes/nodes; simple label **“CLOUD / SYSTEMS / WORKFLOWS”**. Slow rotation and gentle route glow; pause when off-screen; provide static/reduced-motion fallback and maintain acceptable mobile performance.
- AI Status Orb: brief homepage feature/teaser and full demonstration remains on Lab page; preserve the Orb's own state colours.
- The general IT/automation workflow diagram must be separate from the AWS client case study and labelled as illustrative, not deployment/client evidence.
- No headshot for now.

## Site architecture and content

### Home
1. Client-first hero with stacked “TAIWO PHILIPS” wordmark, tagline, service list, AWS-project CTA, work CTA, and globe animation.
2. Compact About/positioning section explaining client work vs demos/labs.
3. Three service offers: AWS architecture/setup; cloud operations, IAM, backup and monitoring; practical IT and AI/workflow automation.
4. Selected work: anonymised paid-client AWS deployment plus clearly labelled demos and personal lab work.
5. Separate illustrative IT/automation workflow diagram.
6. Brief AI Status Orb teaser linking to Lab.
7. How-we-work steps: understand, scope, build, hand over.
8. Contact CTA and recruiter link(s).

### Work
- Separate anonymised client delivery from personal demos and labs.
- Feature current AWS application-environment client deployment without client identity.
- Include AWS/Claude document-engine and multi-tier AWS disaster-recovery examples only as explicitly labelled demos, not client proof.
- Include a general IT/automation workflow as a labelled illustration, distinct from the AWS case study.

### AWS case study
- Retain the current anonymised client case study and its confirmed scope/components (EC2, RDS, S3, VPC, IAM, deployment, basic backups, CloudWatch).
- No dates, client names, unsupported outcomes, or invented evidence.
- Any separate diagram must be clearly captioned as illustrative unless it is an approved genuine project artifact.

### Lab
- Retain AI Status Orb and personal AWS lab work, clearly labelled.
- Keep Orb colour states and interactions intact.

### Contact and shared navigation/footer
- Contact routes: email plus user-approved WhatsApp click-to-chat using +2348107644501.
- Recruiter access: CV download in header and footer, LinkedIn and GitHub links.
- Use the exact supplied CV PDF as-is, as the user explicitly approved public download, including its phone number and claims.
- Preserve internal relative URLs compatible with `/Portfolio/` GitHub Pages deployment.
- Confirm social preview metadata for WhatsApp/LinkedIn sharing.

## Confirmed assets and claims

- CV: supplied as `Taiwo_Philip_Executive_Resume.pdf`; exact file approved for public download. Project's local copy to be selected from `/root/.hermes/profiles/heartplug/cache/documents/` during implementation.
- LinkedIn: `https://www.linkedin.com/in/taiwo-philips-3166b140a?utm_source=share_via&utm_content=profile&utm_medium=member_ios`
- GitHub: `https://github.com/hartplug`
- Email: `taiwophilip@consultant.com`
- WhatsApp: `+2348107644501` (public click-to-chat explicitly approved).
- Client case study: existing anonymised paid deployment; user approved component scope and confidentiality.
- Two advanced CV project examples are demos/passion projects, not paid-client delivery. The user confirmed the CV metrics are accurate and approved; do not imply demo metrics describe client deployments.
- User requested no dates on the redesigned site. Do not add role, project, or certification dates.
- User approved no certification claims on the site beyond linking the CV/LinkedIn. Do not create a separate certifications section.
- No client naming, testimonials, or client assets unless separately approved. No AgentBook or CloudCareer Buddy.

## Accessibility, motion and performance

- Keep readable contrast on the cream canvas and visible keyboard focus.
- Respect `prefers-reduced-motion`: static globe/wordmark state, no continuous animation.
- Pause globe animation while offscreen; WebGL/context failure must leave a readable static fallback.
- Avoid a full-screen canvas over page content; scope globe to hero visual area.
- Check mobile data/performance and avoid overbuilt 3D effects.

## Release and verification approach

- Build/publish in approved small releases, not one big unreviewed launch.
- Candidate order: (1) visual system + hero wordmark/tagline/globe, (2) services and work/case-study proof, (3) Lab/contact/recruiter links and final polish. User may adjust this order.
- For each release: verify built site on 390px, 768px, and 1440px; check overflow, console/runtime errors, every link and image, contrast, reduced-motion behavior, exact claims, and relevant interactions. Publish with `/root/portfolio/scripts/publish.py`; verify live URL and send phone/desktop screenshots.
- No implementation starts until the user reviews this specification and explicitly says **“approved.”** Each release follows its approved scope and is checked before publication.

## Decisions still requiring review

1. This draft uses the user's expressly confirmed wordmark “TAIWO PHILIPS” rather than the previously recorded legal-name order “PHILIP TAIWO.” Keep the wordmark as requested; confirm legal-name usage for title/metadata/contact copy separately before production copy is finalized.
2. Cream treatment is confirmed for Home and editorial Work/case-study content; Lab/Orb remains dark. Footer adapts to page palette while retaining brown/orange ASCII identity where legible.
3. Confirm release slicing and final content/copy before implementation.
