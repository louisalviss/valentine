# Full-flow design test — SiteOps AI

Date: 2026-08-23

Purpose: compare earlier guided experiments with two pages built from scratch after re-reading the canonical `Web & Landing Page Design Flow v1.1`, repository `procedural-visual-system` skill, and `Leonxlnx/taste-skill`.

## Locked product truth

- Product: SiteOps AI, an AI website operator for WordPress.
- Core mechanism: audit performance, technical SEO, content gaps, and maintenance issues; produce a reviewable action plan before material production changes.
- Primary action: run a read-only audit demo.
- Evidence: illustrative only. No fake metrics, testimonials, logos, urgency, or user counts.
- Control rule: production writes are not implied; review happens before change.

## Canonical sequence used

1. Inspect repo instructions and strongest existing primitive.
2. Establish product truth.
3. Infer Design Read.
4. Set design dials.
5. Define audience / offer / conversion goal.
6. Structure by decision friction.
7. Choose visual-production mode.
8. Derive project-specific visual grammar.
9. Write credible copy.
10. Implement one dominant visual idea.
11. Add responsive and interaction states.
12. Accessibility / performance / metadata / ship QA.
13. Push to main for GitHub Pages deploy.
14. Verify source state; exact live-route HTTP verification remains environment-dependent.

## G — Operating Manual

Design Read: B2B WordPress operator for technical site owners; trust-first; operating-manual/service-record language.

Dials: DESIGN_VARIANCE 5 / MOTION_INTENSITY 2 / VISUAL_DENSITY 5.

Mode: code-first. No decorative visual effect.

Dominant visual idea: the page itself behaves like a controlled operating manual: document index, operating record, scope, procedure, and explicit write gate.

Decision-friction order:
- control premise above feature selling;
- current review record;
- monitoring scope;
- material-change procedure;
- audit action.

Anti-default choices:
- no gradient hero;
- no three floating feature cards;
- no glassmorphism;
- no decorative dashboard chrome;
- no invented proof;
- no motion required to understand content.

## H — Systems Observatory

Design Read: same B2B product for a technical buyer who responds to premium systems-thinking; atmospheric but controlled, with one visual mechanism.

Dials: DESIGN_VARIANCE 8 / MOTION_INTENSITY 5 / VISUAL_DENSITY 3.

Mode: code-first using the repository's curated `reactive-field.js` primitive (`mineral` variant), rather than inventing a new effect.

Dominant visual idea: one procedural field represents a monitored system; the visual remains decorative context and is explicitly separated from factual product proof.

Decision-friction order:
- product mechanism + read-only action;
- control premise;
- current operating record;
- inspect → prioritize → review → verify path;
- final audit action.

Safety / fallback:
- content remains readable if WebGL fails;
- reduced-motion is respected by the primitive;
- continuous render pauses when the tab is hidden;
- mobile recomposes the layout instead of squeezing desktop.

## Source-level acceptance checks

Both pages include:
- semantic header/main/section/footer structure;
- skip-to-content link;
- visible primary CTA;
- mobile breakpoints with recomposed layout;
- no essential hover-only content;
- no horizontal-layout dependency for core content;
- metadata title/description;
- shared A–H switch with bottom safe-area spacing;
- no fake commercial proof.

Live URLs:
- `/flow-ab/full-flow-g/`
- `/flow-ab/full-flow-h/`
