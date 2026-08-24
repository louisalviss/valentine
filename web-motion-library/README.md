# Web Motion Library

Canonical catalog for reusable motion and interaction patterns in this repository.

Live: `/web-motion-library/`

Data:
- `web-motion-library/library.json` — canonical pattern metadata and canonical `patterns/` routes.
- `web-motion-library/quality.json` — quality evidence and gate state.
- `web-motion-library/quality-gate.mjs` — automated source-verifiable checks.

## Repository relationship

- `patterns/` contains the canonical implementations listed here.
- `directions/` helps choose a visual medium before choosing motion.
- `labs/` contains experiments/candidates that are not canonical patterns yet.
- `primitives/` contains reusable implementation modules.
- old root demo folders are compatibility redirects only.

## Quality decisions

`PROMOTE`: score ≥80 and all critical gates pass.

`CLIENT READY`: score ≥90 plus route integrity, responsive behavior, asset rights, dependencies and performance all pass.

`KEEP AS LAB`: useful grammar but not strong/clean enough for the active pattern catalog.

`REVIEW`: critical evidence is uncertain or another QA/rights pass is required.

`DELETE / SUPERSEDE`: must not remain in the active catalog. Git history preserves the old implementation; a compatibility redirect may preserve a public Pages route.

## Promotion flow

Reference → rebuild → responsive QA → Quality Gate → canonical `patterns/<slug>/` → named primitives → client reuse.

Preserve interaction grammar, not the original brand surface. Replace typography, palette, media, hierarchy and content for the actual client.
