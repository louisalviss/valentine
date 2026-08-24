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

Canonical reusable pattern system:
- live gallery: `web-motion-library/`
- pattern catalog: `web-motion-library/library.json`
- quality evidence/policy: `web-motion-library/quality.json`
- executable gate: `web-motion-library/quality-gate.mjs`
- workflow/docs: `web-motion-library/README.md`

Before calling any pattern client-ready, run:

`node web-motion-library/quality-gate.mjs`

Treat the derived Quality Gate result as canonical. Do not trust or manually promote a legacy `clientReady` boolean in `library.json` when it conflicts with `quality.json`.

Decision policy:
- PROMOTE: score >= 80 and critical gates pass.
- CLIENT READY: score >= 90 plus route, responsive, asset rights, dependencies and performance all pass.
- KEEP AS LAB: useful grammar but score 65–79.
- REVIEW: critical evidence uncertain or score 50–64.
- DELETE: weak grammar / score < 50.
- SUPERSEDE: explicitly replaced by a stronger canonical implementation.

When an approved visual build produces a reusable interaction pattern, evaluate it for the library. Add matching entries to both `library.json` and `quality.json`; the ID sets must remain identical. Never mark source-verifiable gates `pass` without evidence. `distinctGrammar` and `assetRights` require explicit curated judgment.

Do not turn the library into a template dump; preserve interaction systems, not copied brand surfaces. Git history is the archive, so weak, duplicate and superseded working-tree versions should be removed after a canonical winner is proven.

## Live site hosting

- Default home for user-requested live/demo sites: this `louisalviss/valentine` GitHub repository.
- Publish each live site in its own clearly named subfolder so GitHub Pages can serve it directly.
- Prefer self-hosted/static assets in this repository over hotlinking third-party media that can expire, block CORS/range requests, or cause loading hangs.
- Do not use Vercel for these live/demo sites unless the user explicitly asks for Vercel.

## Default workflow

1. Inspect the strongest relevant existing page/reference and the Motion Library before building from zero.
2. Extract layout, hierarchy, typography, palette, motion and interaction grammar.
3. Reuse or extend the narrowest primitive.
4. Produce 2-3 coherent variants rather than random rerolls when exploration is needed.
5. Keep one dominant visual idea per viewport.
6. Test mobile, tablet and desktop.
7. Check reduced motion, resize, visibility pause and WebGL/static fallback where applicable.
8. Run the Web Motion Quality Gate for any library candidate or edited library source.
9. Promote a new primitive only after it works in at least two page contexts.
10. Carry unresolved quality debt into the client build brief and resolve it before launch.

## Avoid

Do not default to generic AI UI patterns: arbitrary glass cards, decorative gradients, excessive glow/particles, random cursor motion, meaningless technical labels, repeated rounded rectangles or animation on every element.
