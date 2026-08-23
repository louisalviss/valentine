# Web Motion Library

Canonical catalog for reusable motion and interaction patterns in this repository.

Live:
`/web-motion-library/`

Data:
`web-motion-library/library.json`

## Curation

The active catalog is intentionally selective. Git history is the archive.

Promote a pattern only when:
- it has a strong working demo;
- the interaction grammar is distinct and nameable;
- it can plausibly survive another product/client context;
- mobile/tablet/desktop behavior is understood;
- asset and dependency provenance is known enough to decide whether it is client-ready.

Remove from the active working tree when:
- it is a duplicate;
- a clearly stronger version supersedes it;
- it exists only for temporary repair/QA;
- the demo is mostly a video/image playback rather than reusable web interaction;
- the visual quality is below the current bar.

## Status

`production`: strong current demo and interaction grammar.

`candidate`: strong enough to keep in the catalog, but needs asset/dependency review or another QA pass before client reuse.

`clientReady: true`: safe starting point for client work after normal brand/content adaptation.

## Related surfaces

- `/flow-ab/` — design-direction lab. Choose the medium before choosing motion.
- `/visual-primitives/` — extracted code primitives.
- `/motion-skill-lab/` — choreography experiments.
- `/wow-engine-lab/` — larger motion-engine experiments.

## Reuse rule

Preserve the interaction grammar, not the original brand surface. Change typography, palette, product media, content hierarchy, copy and responsive composition for the client. Do not turn the catalog into a collection of recolored templates.
