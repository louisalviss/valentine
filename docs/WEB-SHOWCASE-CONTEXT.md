# Valentine Web Showcase Context

This file is the human-readable context map for the repository's web-design surfaces. It exists so future agents can recover the correct site family before browsing or changing code.

## What the user means by common phrases

- **"web showcase" / "site showcase" / "motion library"** → open `web-motion-library/`. This is the curated gallery of reusable motion and interaction systems.
- **"site so sánh" / "compare site" / "A-H"** → open `directions/flow-ab/`. This is the design-direction comparator used to choose a visual medium/art direction.
- **"site mẫu" / "pattern" / "demo đẹp"** → inspect `web-motion-library/library.json`, then open the matching canonical build under `patterns/`.
- **"dùng cho khách hàng" / "client-ready"** → consult `web-motion-library/quality.json`; do not infer readiness from appearance alone.
- **"lab" / "thử nghiệm"** → inspect `labs/`. Labs can be good references but are not automatically production/client-ready.
- **"primitive" / "effect tái sử dụng"** → inspect `primitives/`. A primitive is reusable implementation code, not merely a named effect inside one demo.
- **"repo Valentine"** → start at the root hub and this context map, not at legacy root-level redirect folders.

## Canonical surfaces

### 1. Web Motion Library — showcase / reusable pattern catalog

Path: `web-motion-library/`

Purpose: browse strong patterns, filter by use case, inspect quality debt, open live demos and select a starting point for personal or client work.

Authoritative data:
- `web-motion-library/library.json` — pattern catalog, names, families, best-for, canonical live/source paths and named primitives.
- `web-motion-library/quality.json` — quality evidence and readiness.
- `web-motion-library/quality-gate.mjs` — machine-enforced curation gate.

Do not create another pattern database elsewhere.

### 2. A-H Direction Lab — site comparison surface

Path: `directions/flow-ab/`

Purpose: compare fundamentally different visual directions/mediums before choosing a final design system. It is for questions like "which direction suits this client/product?" rather than "which scroll primitive should I reuse?"

The A-H set is intentionally architectural: variants should differ in layout, navigation, primary interaction, typography, material and narrative order, not just palette.

QA lives under `directions/flow-ab/qa/`.

### 3. Patterns — canonical showcase implementations

Path: `patterns/`

Current canonical family includes AURA, IRIS, Castle, AUREL, Mira, Signal, Living Atlas, Last House, VANTA, Sword, Nocturne, Vokie, Preflight and KAIZEN.

Detailed metadata is intentionally not duplicated here; always read `web-motion-library/library.json` for the current list and paths.

### 4. Labs — experiments and candidates

Path: `labs/`

Current lab families include Motion Skill, WOW Engine, Visual System, Orbital Shrine, Scroll 3D, UMBRA Editorial and PRMPT.

A lab may be visually strong but should not be presented as a client-ready pattern unless it is promoted through the quality gate.

### 5. Primitives — reusable implementation code

Path: `primitives/`

Current canonical visual primitive: `primitives/visual/reactive-field.js`.

Promote code here only after the implementation is genuinely reusable beyond one page context.

### 6. Archive and legacy URLs

`archive/` holds historical material intentionally outside the active design surface. Root-level folders such as old AURA/IRIS/etc. routes may remain only as compatibility redirects. Never edit a redirect shim when changing a canonical demo; edit the matching `patterns/`, `directions/` or `labs/` source.

## Decision sequence for future work

When asked to make or compare a new site:

1. Read this file and `docs/site-registry.json`.
2. If choosing art direction, inspect `directions/flow-ab/` first.
3. If choosing interaction grammar, search `web-motion-library/library.json`.
4. Check `web-motion-library/quality.json` before recommending a pattern for client reuse.
5. Reuse the narrowest existing primitive where possible.
6. Build exploratory work under `labs/`; promote only proven work to `patterns/`.
7. Keep Git history as version control; do not create v2/v3/final-final folders.

## Core objective

The repository serves two related uses: a personal web-design/motion reference system and a production toolkit for client work. The library should remain selective. A new demo is valuable only if it improves the available design direction, introduces a reusable interaction grammar, or provides a stronger implementation than an existing pattern.
