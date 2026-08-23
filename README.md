# Valentine — Web Experience Lab

A curated repository of web motion, interaction, visual-system and design-direction experiments used for personal work and client builds.

Live hub:
`https://louisalviss.github.io/valentine/`

## Canonical surfaces

- `web-motion-library/` — reusable interaction and motion patterns.
- `flow-ab/` — A–H design-direction comparator; use it to choose a medium before building.
- `visual-primitives/` — reusable code primitives that have survived multiple contexts.
- `motion-skill-lab/`, `wow-engine-lab/`, `visual-system-demo/` — labs for testing choreography and visual primitives.

## Curation rule

The working tree is not the archive. Git history is.

Keep a build only when it is at least one of:
1. a current strong demo with distinct interaction grammar;
2. a reusable lab;
3. a canonical primitive;
4. required publishing/QA infrastructure.

Delete or supersede:
- duplicate pages;
- weak/intermediate versions once a clear winner exists;
- temporary repair chunks and trigger files;
- one-off QA/import workflows after the problem is resolved;
- runtime dependencies on unstable third-party media when a self-hosted replacement is practical.

## Client use

Do not copy a demo surface literally. Reuse the interaction grammar, then re-compose typography, copy, assets, palette, information architecture and responsive behavior for the client.

A library entry can be marked `clientReady: true` only after its asset/dependency policy is understood and its responsive behavior is acceptable.

## Origin and licensing

This repository originally started from the open-source “Will You Be My Valentine?” project by `ivysone`. The origin notice is preserved under `legacy-valentine/`; the original files remain recoverable from git history.

The root `LICENSE` is the original MIT license notice. Do **not** assume every later visual asset, external reference image, generated asset or third-party dependency in this repository is automatically covered by that license. See `THIRD_PARTY_NOTICES.md` and review asset provenance before commercial/client use.
