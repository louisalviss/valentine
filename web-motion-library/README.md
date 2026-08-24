# Web Motion Library

Canonical catalog for reusable motion and interaction patterns in this repository.

Live:
`/web-motion-library/`

Catalog data:
`web-motion-library/library.json`

Quality evidence + scoring policy:
`web-motion-library/quality.json`

Executable gate:
`node web-motion-library/quality-gate.mjs`

## Quality Gate V1

Quality is evidence, not a subjective badge. Every active pattern is scored across nine weighted gates totaling 100 points:

- distinct interaction grammar — 18
- route integrity — 8
- responsive behavior — 12
- interaction behavior — 10
- reduced motion — 10
- asset rights/provenance — 14
- dependency stability — 8
- performance — 10
- accessibility — 10

Gate states are `pass`, `review`, or `fail` and are worth 100%, 50%, or 0% of that gate's weight.

Decision policy:
- `PROMOTE`: score >= 80 and all critical gates pass.
- `CLIENT READY`: PROMOTE + score >= 90 + route, responsive, asset rights, dependencies, and performance all pass.
- `KEEP AS LAB`: score 65–79 with useful reusable grammar.
- `REVIEW`: critical evidence is uncertain or score 50–64.
- `DELETE`: weak grammar or score below 50.
- `SUPERSEDE`: another implementation is explicitly canonical.

`quality.json` is the canonical readiness source. The historical `clientReady` boolean still present in some `library.json` records is legacy metadata and must not be used to override the derived Quality Gate result.

CI verifies source-checkable claims. For example, it rejects `reducedMotion: pass` when no explicit reduced-motion path exists, `dependencies: pass` when runtime JavaScript is loaded from an external URL, broken local references, or a `performance: pass` claim with an excessive repository footprint.

`distinctGrammar` and `assetRights` still require curated evidence because source code alone cannot prove originality or commercial asset rights.

## Curation

The active catalog is intentionally selective. Git history is the archive.

Promote a pattern only when:
- it has a strong working demo;
- the interaction grammar is distinct and nameable;
- it can plausibly survive another product/client context;
- its Quality Gate result is PROMOTE;
- unresolved quality debt is carried into any generated client brief.

Remove from the active working tree when:
- it is a duplicate;
- a clearly stronger version supersedes it;
- it exists only for temporary repair/QA;
- the demo is mostly video/image playback rather than reusable web interaction;
- the visual or interaction quality is below the current bar.

## Related surfaces

- `/flow-ab/` — design-direction lab. Choose the medium before choosing motion.
- `/visual-primitives/` — extracted code primitives.
- `/motion-skill-lab/` — choreography experiments.
- `/wow-engine-lab/` — larger motion-engine experiments.

## Reuse rule

Preserve the interaction grammar, not the original brand surface. Change typography, palette, product media, content hierarchy, copy and responsive composition for the client. Resolve every client-specific Quality Gate debt before launch. Do not turn the catalog into a collection of recolored templates.
