# Repository Agent Instructions

## Visual work

Before creating or materially redesigning a web page in this repository, read:

`agent-skills/web-design/procedural-visual-system/SKILL.md`

Use the visual primitive library before inventing a new effect.

Current reusable primitive:
- `visual-primitives/reactive-field.js`

Reference implementation:
- `visual-system-demo/index.html`

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
