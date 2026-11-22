# Castle Anatomy Cutaway — Visual QA decision (2026-11-22)

**Status: ART REJECTED. DO NOT PROMOTE.**

Owner reviewed live V03 at https://62-83-35-116.sslip.io/ab-ui/castle-anatomy-cutaway-qa-v03-20261122/ and stated "Quá xấu". This decision supersedes earlier HTTP/JavaScript/WebGL/scroll technical PASS. The QA version remains for reproducibility only.

## Diagnosed mismatch
- The castle is made mainly from procedural box/cylinder/cone shapes, repeated turrets and a small material palette. Additional masonry, shingles and illumination did not meet the artistic quality bar.
- Cutaway Piranha uses a purpose-designed mechanical silhouette, meaningful layered internals, custom parts, material variation and bespoke cinematography; its demo does not establish an equivalent Gothic castle creation pipeline.
- The generated concept image is a static illustration, not a rigged or explodable 3D model. Do not disguise it as real 3D.
- A visually inspected CC0 model at https://tevy.dev/models/castle-keep offers better stone texture but a simpler castle with portcullis-only movement. This does not meet semantic exploded anatomy.

## Next required experiment
1. Obtain or author a professionally detailed, legitimately reusable castle mesh, with high-quality silhouette, genuine PBR texturing, arched interiors, refined facade/roof geometry and intentional lighting.
2. Separate authored semantic components: foundation/underground, gate/bridge, defense, living quarters, palace, observation towers and their connectors. Do not arbitrarily cut one mesh or scatter parts.
3. Perform an **art-only A/B gate** at matched desktop/mobile framing before implementing the scroll animation. Owner acceptance is required. Reject toy-like silhouettes, flat walls, coarse geometry and unreadable breakdown.
4. Only after art approval, reuse patterns/castle-assembly interaction/timeline in a new reviewed version in the existing lab. Test iPhone WebGL/performance and full animation.

## Release rule
Do not promote this lab to patterns/ or web-motion-library/ until art is accepted. Do not alter original Castle Assembly. This review is historical QA, not an additional workflow owner. Canonical: ui-ab-copy/docs/FLOW.md + Dropbox Three.js Exploded Storytelling Flow + valentine/AGENTS.md.
