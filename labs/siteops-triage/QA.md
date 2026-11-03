# SiteOps AI — Evidence Desk A/B visual canary

Date: 2026-11-03 (Asia/Ho_Chi_Minh)  
Mode: **EXPLORE** via `louisalviss/ui-ab-copy/docs/FLOW.md`.  
Status: **technical browser canary PASS; human blind visual review and live traffic not run; no production change**.

## Design research (different from A1/UI Syntax)

Primary library: [SaaSUI real product screenshots](https://www.saasui.design/application/linear), 23 Linear screens documented. Inspiration is the **structural grammar** of a two-pane Linear triage (list stays in view when reviewing a selected issue), confirmed also by [Linear's own Triage changelog](https://linear.app/changelog/page/14). Secondary reference is [SaaSUI's command palette UX guide](https://www.saasui.design/blog/saas-search-command-palette-ux-patterns), for keyboard search/arrow/Enter/Escape interactions. Screens were studied as **references**; no external HTML, CSS, images, branded assets or proprietary code was copied. All visual implementation code is authored for SiteOps.

**Chosen art direction:** *Editorial evidence desk*, not another site topology graph. Graph-first orientation from the previous B was replaced with an evidence-first triage journey. Major intentional decisions: acid-orange editorial masthead with large black text, cream paper-like ledger area, two/three-column issue queue → evidence → human approval gate, black closing process section, and a real in-memory Ctrl/⌘ K search.

## Product truth

Four standing review areas only: performance, technical SEO, content and maintenance. The four issue records are fictional examples, not findings from a connected domain. Status text says unverified and illustrative. Nothing in this HTML/JS can inspect or modify a production website. 'Mark for review' changes only in-memory UI state.

## Files and identities

- Control A: `directions/flow-ab/no-flow/index.html` (main) — conventional SaaS landing.
- Previous B: `labs/siteops-observatory/` on `experiment/siteops-observatory-ai-library-20261103`, PR #43, fixed source commit `ce94e6201568acd230321f3f5b95b17af368b5e9`.
- This candidate: `labs/siteops-triage/index.html`, `site.css`, `responsive.css`, `site.js`, `compare.html`, `compare-previous.html` on `experiment/siteops-evidence-triage-20261103`.
- Exact UI source state tested with Chromium/Impeccable: `1c0ed194fed835fa266b1d5c4a238c21a7cd4e83`.
- Original A vs new B viewer: `labs/siteops-triage/compare.html`.
- Previous B dark map vs new B editorial triage viewer: `labs/siteops-triage/compare-previous.html`.

## EXPLORE divergence — provisional structural rubric

Compared with previous B, the new B changes seven clearly visible axes: first-screen composition (map vs giant editorial masthead), page DOM (graph vs queue/record/decision), navigation (app sidebar vs issue filter/search), focal object (site network vs evidence sheet), main interaction (node inspection vs issue triage and keyboard search), typography/material (dark neon app vs cream/orange printed ledger), and pacing/content (graph oriented vs decision oriented). Shared product truth is intentionally unchanged. This is author/source assessment, **not** a blind user-preference score.

## Measured browser QA on runner-vps1

Engine: `Chromium 156.0.8078.73`, non-root `uiab` with sandbox enabled, CDP, disposable browser profile, DPR=1. The HTML/CSS/JS used local copies fetched from the pinned source commit. Sizes: 390×844, 768×1024 and 1440×900.

All three sizes:
- Horizontal document overflow: **false**.
- H1 right-edge clipping: **false**.
- Broken internal anchor references: **0**.
- Runtime JavaScript exceptions: **0**.
- Four example issues and five category filters visible in the DOM.
- Selecting SEO entry changes focused detail and leaves exactly one issue selected.
- Filtering to SEO shows exactly one relevant issue and selects it.
- 'Mark for review' toggles the selected record to local demo status.
- Keyboard `Ctrl+K` opens search; query `plugin` finds the maintenance record by identifier, Enter selects it and closes search.
- Side-by-side comparison viewer includes two iframes; on mobile A/B toggle changes selection.

Screenshot view: the old A is a light, green-highlighted SaaS hero; new B has an orange full-width typographic opening and a paper triage ledger. The screenshot bytes were rendered and visually inspected but **not yet archived to private R2 with GET/SHA readback and D1 checkpoint**.

## Impeccable diagnostic

Ran pinned `impeccable@4.8.0 detect --json` on four exact source assets at commit `1c0ed194fed835fa266b1d5c4a238c21a7cd4e83`: exit 2 (findings), JSON array valid.

| Detector | Findings |
|---|---:|
| A original, prior measured source state | 43 |
| New B initial attempt | 20 |
| New B after mobile label/contrast repairs | **9** |

Remaining nine: `tiny-text` 5 warnings, `numbered-section-labels` 2 advisory, `cramped-padding` 1 warning and `cream-palette` 1 warning. Not a proof of WCAG compliance or visual preference. No rule suppressions. Previous B's detector score is not directly part of this A→B comparison.

## Live links

- A: https://louisalviss.github.io/valentine/directions/flow-ab/no-flow/
- B current: https://raw.githack.com/louisalviss/valentine/experiment/siteops-evidence-triage-20261103/labs/siteops-triage/index.html
- Compare original A/B: https://raw.githack.com/louisalviss/valentine/experiment/siteops-evidence-triage-20261103/labs/siteops-triage/compare.html
- Compare old B/new B: https://raw.githack.com/louisalviss/valentine/experiment/siteops-evidence-triage-20261103/labs/siteops-triage/compare-previous.html

## Pending gates

No blind user aesthetic judgment, independent engine/Iris check, full WCAG keyboard/focus/assistive audit, real traffic A/B, actual audit backend, screenshots durably shipped to R2 or D1 readback. Keep PR Draft; do not deploy or merge to production without those checks and explicit authorization.
