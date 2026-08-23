# Web Motion Library

Canonical live index for reusable motion / interaction patterns in this repository.

Live route:
`/web-motion-library/`

Canonical data:
`web-motion-library/library.json`

## What belongs here

Promote a pattern only when:
- it already exists in a working page or approved reference rebuild;
- the interaction can be named and explained as a small reusable primitive;
- mobile / tablet / desktop behavior is known;
- core content remains understandable without the interaction;
- unstable third-party media is not required at runtime.

Do not treat this as a generic template dump. A full page can contain several reusable primitives; only promote the interaction grammar that can survive another client context.

## Entry schema

Each `library.json` pattern should include:
- `id`, `index`, `title`;
- `family` and `tags` for filtering;
- `live` and `source`;
- one-sentence `description`;
- `bestFor`, `stack`;
- named `primitives` with one clear purpose each;
- responsive notes;
- acceptance checks.

## Workflow

`reference -> rebuild -> QA -> extract primitives -> approve -> add to library.json -> reuse`

When reusing a pattern for client work:
1. Preserve the interaction grammar, not the original brand surface.
2. Replace copy, product media, palette and supporting content.
3. Re-compose for the client's product rather than merely recoloring the demo.
4. Re-run responsive QA.
5. If a new primitive survives at least two page contexts, promote it into the reusable primitive layer.

## Seed pattern

`001 / Scroll Product Story`

Production implementation:
`../aura-eclipse-scroll/`

Current reusable concepts:
- `ScrollProduct`
- `SceneWipe`
- `ProductMaskText`
- `FeatureHotspot`
