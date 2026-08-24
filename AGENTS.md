# Repository Agent Instructions

## Canonical namespaces

New work must live under exactly one role-based namespace:

- `patterns/<slug>/` — approved reusable motion/interaction demos.
- `directions/<slug>/` — art-direction or medium-selection systems.
- `labs/<slug>/` — experiments, candidates and engine studies.
- `primitives/<family>/` — reusable implementation modules.
- `archive/<slug>/` — historical material intentionally outside the active surface.

Do not create new project folders at repository root. Root-level legacy demo folders are compatibility redirects only and must not receive feature work.

Do not create `v2`, `v3`, `final`, `final-final` folders. Git history is version control. Promote one canonical implementation and use redirects when a public route moves.

## Visual work

Before creating or materially redesigning a web page, read:

`agent-skills/web-design/procedural-visual-system/SKILL.md`

Use existing primitives before inventing a new effect.

Current canonical visual primitive:
- `primitives/visual/reactive-field.js`

Reference implementation:
- `labs/visual-system/`

## Web Motion Library

Canonical reusable pattern index:
- live gallery: `web-motion-library/`
- catalog: `web-motion-library/library.json`
- quality evidence: `web-motion-library/quality.json`
- gate: `web-motion-library/quality-gate.mjs`

`quality.json` is authoritative for score/readiness. Do not manually call a pattern client-ready because an old boolean says so.

When an approved build produces reusable interaction grammar:
1. place the canonical build under `patterns/`;
2. add/update its entry in `library.json`;
3. add evidence to `quality.json`;
4. run the quality gate and responsive QA;
5. only then call it client-ready.

If the gate derives `DELETE` or `SUPERSEDE`, remove it from the active catalog. If a public URL already exists, leave only a compatibility redirect at the old route.

## Live site hosting

- Default host: this `louisalviss/valentine` GitHub Pages repository.
- New approved demos go under `patterns/<slug>/`; exploratory work goes under `labs/<slug>/`.
- Prefer self-hosted/static assets over unstable hotlinks.
- Do not use Vercel unless explicitly requested.

## Default workflow

1. Inspect the strongest relevant existing pattern/direction.
2. Extract layout, hierarchy, typography, motion and interaction grammar.
3. Reuse or extend the narrowest primitive.
4. Produce coherent variants only when they test meaningfully different directions.
5. Keep one dominant visual idea per viewport.
6. Test mobile, tablet and desktop.
7. Check reduced motion, resize, visibility pause and WebGL fallback where relevant.
8. Promote to `patterns/` only after Quality Gate evidence supports it.
9. Promote code to `primitives/` only after it is reusable beyond one page context.

## Avoid

Do not default to generic AI UI patterns: arbitrary glass cards, decorative gradients, excessive glow/particles, random cursor motion, meaningless technical labels, repeated rounded rectangles or animation on every element.
