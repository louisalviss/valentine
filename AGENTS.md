# Repository Agent Instructions

## Visual work

Before creating or materially redesigning a web page in this repository, read:

`agent-skills/web-design/procedural-visual-system/SKILL.md`

Use the visual primitive library before inventing a new effect.

Current reusable primitive:
- `visual-primitives/reactive-field.js`

Reference implementation:
- `visual-system-demo/index.html`

## Web Motion Library

Canonical reusable pattern index:
- live gallery: `web-motion-library/`
- data: `web-motion-library/library.json`
- workflow/docs: `web-motion-library/README.md`

When an approved visual build produces a reusable interaction pattern, evaluate it for the library.
Promote it only after responsive QA and only when the interaction grammar can survive another page/client context.
Store the live demo + named primitives + responsive behavior + acceptance checks in `library.json`.
Do not turn the library into a template dump; preserve interaction systems, not copied brand surfaces.

## Live site hosting

- Default home for user-requested live/demo sites: this `louisalviss/valentine` GitHub repository.
- Publish each live site in its own clearly named subfolder so GitHub Pages can serve it directly.
- Prefer self-hosted/static assets in this repository over hotlinking third-party media that can expire, block CORS/range requests, or cause loading hangs.
- Do not use Vercel for these live/demo sites unless the user explicitly asks for Vercel.

## Default workflow

1. Inspect the strongest relevant existing page/reference.
2. Extract layout, hierarchy, typography, palette, motion and interaction grammar.
3. Reuse or extend the narrowest primitive.
4. Produce 2-3 coherent variants rather than random rerolls.
5. Keep one dominant visual idea per viewport.
6. Test mobile, tablet and desktop.
7. Check reduced motion, resize, visibility pause and WebGL fallback.
8. Promote a new primitive only after it works in at least two page contexts.

## Avoid

Do not default to generic AI UI patterns: arbitrary glass cards, decorative gradients, excessive glow/particles, random cursor motion, meaningless technical labels, repeated rounded rectangles or animation on every element.
