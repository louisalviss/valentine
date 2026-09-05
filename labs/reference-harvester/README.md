# Valentine Reference Harvester

Status: candidate infrastructure for `VALENTINE-HARVEST-001`.

This lab converts strong external web references into locally runnable Valentine candidates without contaminating the canonical `web-motion-library/library.json` pattern catalog.

## Goal

`reference URL -> browser evidence -> source/rebuild decision -> local reconstruction -> fidelity evidence -> reference gallery -> optional pattern promotion`

The target is render fidelity, not source-code identity. When authored source is unavailable, minified, proprietary, or cannot be reused safely, use a clean render-equivalent reconstruction.

## Namespace contract

- `labs/reference-harvester/reference-registry.json` is the candidate/reference registry.
- `labs/reference-harvester/capture-manifest.schema.json` defines evidence expected from each captured/reconstructed reference.
- `labs/references/<slug>/` is the intended home for runnable reconstruction candidates.
- `web-motion-library/references.html` is the browsing surface for reconstructed references.
- `web-motion-library/library.json` remains authoritative only for approved reusable patterns.
- `patterns/` remains untouched until a candidate has reusable interaction grammar and passes the existing Web Motion Library Quality Gate.

## Existing feed rule

The user's existing site-library data must be resolved and connected as the feed authority before creating a second discovery database. Until that happens, `feed_authority.status` remains `unresolved` and the reference registry may legitimately contain zero entries.

Discovery adapters may point at sources such as GetLayers, Curated, 60fps and Swiped, but these source definitions are not harvested design records and do not replace the user's existing feed.

## Reconstruction modes

- `source-import` — authored/public source can be legitimately imported and provenance is recorded.
- `localized-public-source` — browser-delivered public frontend source/assets are localized where reuse is allowed and dependencies are made stable.
- `render-equivalent-rebuild` — clean implementation rebuilt from captured visual, geometry, typography, motion and interaction evidence.

Never label a browser bundle as authored source merely because it is downloadable.

## Fidelity contract

For a supported static state:
- `>= 98` visual fidelity: eligible for PASS.
- `95-97.99`: REVIEW.
- `< 95`: FAIL / continue reconstruction.

Motion and interaction fidelity are separate evidence. A 98+ static score never implies motion PASS.

Minimum viewport evidence:
- 390x844
- 768x1024
- 1440x900

Capture material states such as hero, meaningful scroll positions, hover/focus where applicable, menus/modals, and interaction-complete states.

## Provenance and assets

Public accessibility does not imply commercial reuse rights. Every reference must classify:
- original URL/source;
- code provenance;
- asset provenance;
- license/rights state;
- whether essential media is self-hosted, recreated/replaced, or intentionally omitted.

Do not hotlink essential media for an accepted reconstruction.

## Promotion

A reference candidate can be promoted to `patterns/<slug>/` only when:
1. the local reconstruction is runnable without essential dependence on the origin site;
2. supported-state visual fidelity is >=98 or an explicit exception has been accepted;
3. material motion/interaction states have separate PASS evidence;
4. responsive/touch/reduced-motion behavior is acceptable;
5. provenance and asset rights are classified;
6. reusable interaction grammar exists;
7. existing `web-motion-library/quality-gate.mjs` passes without weakening any gate.
