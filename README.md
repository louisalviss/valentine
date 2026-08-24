# Valentine — Web Experience Lab

Curated repository for reusable web motion, interaction and design systems used in personal and client work.

## Canonical structure

- `patterns/` — quality-gated reusable demos. These are the canonical implementations referenced by the Motion Library.
- `directions/` — art-direction comparators and medium-selection experiments.
- `labs/` — promising experiments that are not yet canonical patterns or primitives.
- `primitives/` — implementation-level reusable modules.
- `web-motion-library/` — live catalog, metadata and Quality Gate.
- `archive/` — historical material intentionally removed from the active surface.
- `agent-skills/` — repository-specific instructions for design/build agents.

Old root demo routes may remain as tiny compatibility redirects so existing GitHub Pages links keep working. They are not canonical source locations.

## Live surfaces

- `/` — Web Experience Lab hub
- `/web-motion-library/` — quality-gated pattern library
- `/directions/flow-ab/` — A–H Direction Lab

## Curation rule

Git history is the archive. The active tree keeps only work that has a clear role.

A build belongs in `patterns/` only when its interaction grammar is distinct, reusable in another client context and accepted by `web-motion-library/quality-gate.mjs`.

A build belongs in `labs/` when the idea is promising but still has unresolved quality, asset, dependency or reuse debt.

A primitive belongs in `primitives/` only after the implementation is genuinely reusable rather than merely extracted from one page.

Do not create version folders such as `v2`, `v3`, `final`, or `final-final` as a substitute for git history.

## Hosting

GitHub Pages is the default host for static demo sites in this repository. Prefer self-hosted assets and repository-local dependencies when practical. External runtime dependencies or third-party media must be reflected honestly in the Quality Gate before client use.
