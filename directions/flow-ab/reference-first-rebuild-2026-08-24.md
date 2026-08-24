# SiteOps AI A–H — Reference-First Rebuild

Date: 2026-08-24
Status: current design checkpoint

## Why this rebuild exists

The previous A–H set diverged in palette and some interaction patterns but still shared too much model/author DNA: large headline, explanatory block, capability groups, control sequence, final CTA. The user correctly identified that several variants still felt related.

This rebuild applies the canonical `A-B Design Library & Testing Flow`, `Web & Landing Page Design Flow`, repo `procedural-visual-system` skill, and the contextual rules from `Leonxlnx/taste-skill`, but adds a stricter **reference-first medium gate**.

## Locked product truth

Product: SiteOps AI — AI Website Operator for WordPress.

Stable claims across variants:
- audits performance, technical SEO, content gaps, and maintenance issues;
- produces a reviewable plan before material production changes;
- operating model: Inspect → Prioritize → Review → Verify;
- primary concept action: read-only audit;
- no fake metrics, testimonials, logos, user counts, conversion claims, or implied production writes.

Presentation, narrative order, medium, interaction, typography, material and DOM architecture may change radically.

## Reference-learning rule

Do not copy a shot or template. Extract grammar:
- first-impression mechanism;
- grid/composition;
- type scale and hierarchy;
- density/negative space;
- image/object behavior;
- interaction/navigation model;
- material/surface logic;
- what the reference deliberately omits.

Reference families reviewed before this rebuild:
- Dribbble: brutalist/Swiss/editorial explorations with strict grids, oversized type, asymmetry and high contrast;
- Behance: editorial portfolios and “living archive” experiences mixing large-scale typography, motion, 3D and experimental navigation;
- ThemeForest: mainstream current SaaS/product templates used as the commercial/conversion control family;
- Pinterest: dashboard density references and playful neo-brutalist/sticker visual families;
- Awwwards: horizontal layout, unusual navigation, fullscreen, gallery, data visualization, WebGL/Three.js and storytelling categories;
- X: searched as a discovery source, but signal was noisy; no weak X reference is promoted into the final direction matrix.

## New A–H medium matrix

| Variant | Medium | Dominant primitive / architecture | Dials V/M/D |
|---|---|---|---|
| A | Commercial SaaS Control | familiar landing hierarchy + product review queue | 6 / 4 / 4 |
| B | Brutalist Architecture Journal | strict editorial grid + giant type + hard rules | 9 / 4 / 5 |
| C | Immersive 3D Archive | fullscreen scroll-snap scenes + procedural field | 9 / 7 / 2 |
| D | Analog Field Notebook | physical paper/binding/tape/checklist metaphor | 7 / 2 / 4 |
| E | Desktop OS Workspace | windowed app surface + inspector + dock | 6 / 3 / 7 |
| F | Neo-Brutalist Sticker Lab | rotated sticker modules + thick borders + marquee | 10 / 6 / 5 |
| G | Swiss Technical Spec | 12-column specification sheet + typographic discipline | 5 / 1 / 4 |
| H | Spatial Network Canvas | pannable/zoomable node world + floating detail | 9 / 5 / 5 |

## Variant-specific constraints

### A — Commercial SaaS Control
- This is the intentional commercial control, not the experimental target.
- Familiar nav, proposition, product preview, benefit grouping and CTA.
- No AI-purple glow, fake social proof, fake metrics or generic glass cards.

### B — Brutalist Architecture Journal
- Must read as architecture/editorial publication before it reads as SaaS.
- Off-white / black / red.
- 4px rules, monolithic display type, side issue column, manifesto and operating matrix.
- No rounded-card SaaS grammar.

### C — Immersive 3D Archive
- Full viewport scenes are the information architecture.
- Uses repo `reactive-field.js`, `signal` preset, rather than inventing another effect.
- Sparse text + metadata rail + scene navigation.
- Content remains readable if WebGL fails; reduced motion remains usable.

### D — Analog Field Notebook
- Deliberately anti-digital UI.
- Desk, notebook binding, binder holes, ruled paper, tape, sticky notes, handwriting/editorial serif cues.
- No dashboard, glass, app chrome or “premium SaaS” styling.

### E — Desktop OS Workspace
- The website behaves like a desktop workspace, not a landing page.
- Menubar, multiple windows, operating queue, inspector, workflow window and dock.
- Lane selection updates inspector state.
- Mobile stacks windows instead of squeezing a desktop composition.

### F — Neo-Brutalist Sticker Lab
- Playful and loud rather than editorial-serious.
- Yellow / pink / blue / mint, thick black borders, hard shadows, rotated issue stickers, marquee.
- Copy tone is intentionally more colloquial while product truth remains unchanged.

### G — Swiss Technical Spec
- Strict, quiet, systematic.
- 12-column desktop grammar, monochrome base + one red signal accent.
- No rounded cards, decoration, WebGL, stickers or atmospheric effects.
- Type/grid does the design work.

### H — Spatial Network Canvas
- No stacked landing sections.
- One fullscreen pannable world acts as the navigation and explanatory model.
- Core node, four drift nodes, satellites, floating detail, zoom/reset controls.
- Bright cream/cobalt/coral/green deliberately separates it from dark spatial/3D C.

## Cross-variant acceptance gate

A pair is rejected if it shares too much of the following:
1. first-viewport silhouette;
2. DOM section skeleton;
3. navigation model;
4. primary interaction;
5. dominant primitive;
6. typography category/scale behavior;
7. material/surface language;
8. narrative order.

Target: every pair should diverge on at least 5/8 axes. Strong pairs should diverge on 7–8/8.

### Silhouette gate

At 390×844 and 1440×900:
- grayscale thumbnails must still be distinguishable;
- remove color mentally: if two pages still have the same headline/block/card silhouette, reject one;
- a different background effect does not count as a different architecture.

## Library / QA surface

Current comparison route:
`/flow-ab/`

Canonical UX retained:
- Library default;
- Full / 2 / 3 / 4 vertical density selector;
- 390 / 1280 viewport preview;
- click/tap entire card to select;
- selected = bold 3px border;
- maximum 2 selected; third selection evicts oldest;
- Pair mode for detailed two-up comparison;
- embedded `.experiment` dock hidden;
- iframe scaling uses one uniform scale factor only.

## Current code paths

```text
flow-ab/index.html                 # Reference Library + Pair compare
flow-ab/no-flow/index.html         # A Commercial SaaS Control
flow-ab/with-flow/index.html       # B Brutalist Architecture Journal
flow-ab/flow-c/index.html          # C Immersive 3D Archive
flow-ab/flow-d/index.html          # D Analog Field Notebook
flow-ab/flow-e/index.html          # E Desktop OS Workspace
flow-ab/flow-f/index.html          # F Neo-Brutalist Sticker Lab
flow-ab/full-flow-g/index.html     # G Swiss Technical Spec
flow-ab/full-flow-h/index.html     # H Spatial Network Canvas
flow-ab/switch.js                  # shared A-H switch labels
```

## Rebuild commits

```text
A 8859dafb0b66fa10c21272e1d256fa6cd4497165
B 412e1a4feb08f3d27f3de94b83cc2e83793d5a57
C 619696461a5a9fcd6344a8bd4cdc8a9bbb8cb6b2
D 871f614b1bb73d3a559faca21a9c4714b289aeb6
E 42c17ca6b189ec657808cd6d5357fc00841bc9d0
F 03be806e02303577d827d3b9020810985b058953
G 3a5a448a7a5000f113e9bce122af42fdfd099bef
H 34998447527f0236454a46e93373a30a6dab08d9
switch c1df2b999b2c9d1f0c66a39d652e7c37a2306617
library 357232af369115d566e0a5fc53b15c9cceb2f1a7
```

## QA checklist before calling the set finished

- source for A–H exists on `main`;
- Library labels match rebuilt variants;
- 390×844: no clipped primary headline, no horizontal overflow that is not intentional, touch interaction works;
- 1280×900 and 1440×900: first-viewport silhouette reads correctly;
- C: WebGL failure leaves readable content; hidden tab pauses field through primitive contract;
- E: interactive inspector works and mobile stacks windows;
- F: `prefers-reduced-motion` disables marquee animation;
- H: drag, node selection, +/− and reset work; mobile starts at a useful canvas position;
- no fabricated proof;
- compare Library preserves uniform iframe scaling;
- live GitHub Pages route is verified separately before claiming live PASS.

## Next evolution rule

Do not add I/J/K by choosing another color palette. Pick a new medium not already represented, for example:
- image-first cinematic photography story;
- hand-drawn technical blueprint;
- product configurator/simulator;
- ecommerce/catalog grammar;
- timeline/history archive;
- mobile-native vertical story;
- data newspaper;
- game/menu interface.

Then run the same reference → grammar extraction → medium gate → implementation → silhouette QA loop.
