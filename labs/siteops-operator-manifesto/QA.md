# SiteOps AI — Operator Manifesto canary

**Date:** 2026-11-03 (Asia/Ho_Chi_Minh)  
**Status:** DESIGN_EXPLORATION_CANARY_PASS · no production deployment · no UX or conversion winner.

## User objective

Re-run the previous SiteOps A/B experiment after feedback that **Unslop polish looked the same as A**. Test a materially different architecture, not just typography/contrast patches. Keep product facts and approval model truthful.

## Sources and reproducible design method

- Existing control: `louisalviss/valentine/directions/flow-ab/no-flow/index.html`, `main`, original blob SHA `295827b9a7a889e18ed9fa322bb9745617596721`.
- Previous subtle B: `labs/siteops-unslop-ab/index.html` under `experiment/siteops-unslop-ab-20261103`. Kept in Draft PR #41 for comparison, **not** mutated by this redesign.
- New candidate: `labs/siteops-operator-manifesto/index.html`, `site.css`, `site.js` plus `compare.html` on `experiment/siteops-operator-manifesto-20261103`.
- Exact tested candidate source commit: `3863f4e56e7e4567c97963881d8483d59ab3c51f`.
- Live HTML preview: https://raw.githack.com/louisalviss/valentine/3863f4e56e7e4567c97963881d8483d59ab3c51f/labs/siteops-operator-manifesto/index.html
- Side-by-side/mobile toggle: https://raw.githack.com/louisalviss/valentine/3863f4e56e7e4567c97963881d8483d59ab3c51f/labs/siteops-operator-manifesto/compare.html
- Design authority: `louisalviss/ui-ab-copy/docs/FLOW.md`, **EXPLORE** (not CLONE or TRAFFIC).
- Repo instructions: `AGENTS.md`, `agent-skills/web-design/procedural-visual-system/SKILL.md`.
- External tools read and *actually executed*: Taste Skill v2 `Leonxlnx/taste-skill` `scripts/draw.mjs` via a temporary cloned repo on `runner-vps1`. Input `--sector saas --tone technical --sections showcase,features,how-it-works,cta --options 3`; three candidates returned: `type-only-statement`, `quiet-instrument`, `dense-tiles`. Selected `type-only-statement` and executed `--direction type-only-statement` for full direction sheet. Sheet assigned “Waterline headline”, Schibsted Grotesk and bone/green/chocolate palette.
- Unslop `heydamir/unslop` (CC BY 4.0), `skills/unslop/SKILL.md` and `references/signs.md` used for anti-slop audit discipline. The user explicitly requested a **different design**, so the previous polish-mode preservation of layout/DOM does not apply; this is an exploration rather than an Unslop automatic rewrite.
- Product-specific idea: **review before change becomes the typographic waterline**, followed by a genuinely interactive review desk. No meaningless fake numbers, testimonials, charts, claims of a connected account or silent writes.

## Distinctness from A

| Axis | A (commercial control) | New B (operator manifesto) |
|---|---|---|
| First viewport | Split headline + dashboard mockup | Full-viewport two-colour waterline and 2-line statement |
| DOM / section grammar | SaaS hero → proof bar → feature cards → process → CTA | Manifesto hero → interactive work desk → editorial bands → operating gates → manifesto close |
| Navigation | Conventional nav | Minimal wordmark + compact CTA |
| Interaction | In-page links | Interactive four-finding review selector + in-page links |
| Dominant visual | Product card mockup | Giant type and one broad colour seam |
| Typography | Arial / conventional 58–94px | Schibsted display / huge poster headline |
| Material | Light SaaS cards + dark preview | Bone / forest / chocolate editorial fields |
| Pacing | Dense first-screen SaaS description | One strong statement first, proof and working example later |

These are independently inspectable structural differences. No human-blind vote or production conversion difference was measured.

## Functional and responsive evidence

Tool: real Chromium **156.0.8078.73** on `runner-vps1`, CDP, disposable profile running as non-root `uiab`, no `--no-sandbox`. Viewports are CSS `390×844`, `768×1024` and `1440×900`, DPR 1. Input HTML, CSS and JS were downloaded from the immutable Git commit. **Offline QA CSS removed only the external Google Fonts `@import`** to avoid network/font timing stalls; fallback typography was used. Thus font-specific reflow across every client/browser remains a separate live check.

| Check | 390 | 768 | 1440 |
|---|---:|---:|---:|
| Horizontal overflow | None | None | None |
| Clipped first headline | None | None | None |
| Broken in-page anchors | 0 | 0 | 0 |
| Main sections | 5 | 5 | 5 |
| Interactive finding buttons | 4 | 4 | 4 |
| Selection stays single | PASS | PASS | PASS |
| Clicking SEO changes detail | PASS | PASS | PASS |
| JavaScript exceptions | 0 | 0 | 0 |

Separate comparison-viewer functional smoke: mobile `A` button toggles `body[data-mode]` to `a`, `aria-pressed=true`; viewer includes both A/B iframes. HTTP 200 and HTML responses verified for control, new candidate and viewer. Response headers did not advertise X-Frame-Options or restrictive CSP. Browser QA was on a local copy; this does not assert that all third-party browser/privacy settings permit embedded frames.

**Content truth:** 4 disciplines: performance, technical SEO, content and maintenance. Approval model: Inspect → Prioritize → Review → Verify. Queue entries are explicitly **illustrative**; clicking them only updates the local example in JavaScript. There are no network calls, automatic site writes or claims of actual findings.

## Impeccable 4.8.0 pinned source detector

Exact three source assets read via the **immutable commit URL**, not a possibly stale mutable branch CDN:

- `index.html` SHA256 `c9ae493515cf61dcbf8b24ea791723501c9b27323a3d02c07e2003ff606d1f43`.
- `site.css` SHA256 `ff5dcd4445d443136130c7203dd88fdf3b7f73c4d915f028318cb5ae3373854f`.
- `site.js` SHA256 `5171fde62515b9baccceeaccf1c02d9453308df9bc6c3dcd5cb2c54e92dadf34`.

`npx --yes --package=impeccable@4.8.0 impeccable detect --json <isolated-directory>`

- A historic source detector result: 43 findings (from prior control test).
- New B source detector: **4 findings**; exit 2, valid JSON array.
- Breakdown: `low-contrast` ×3 and `cream-palette` ×1.
- The source detector treats `#f5f1e8` text as if directly placed on the bone `#e5e1d8` rather than the foreground's positioned forest field `#456f3a`. Actual intended contrast of paper on forest is about **5.19:1**; chocolate on bone about **12.51:1** based on palette luminance. Treat the three static warnings as **requires rendered contrast verification**, not automatically PASS or accepted false positives.
- `cream-palette` is a subjective style warning in direct conflict with the Taste Skill palette, not proof of an accessibility issue.
- Initial report of 7 findings came from a mutable CDN source before the latest style update. Always prefer the pinned-source count **4**. No detector ignore file or relaxed thresholds were used.

## Limitations and promotion gate

- **Not done:** exhaustive keyboard/assistive-technology/WCAG audit, full-page or independent-engine visual capture, independent human blind comparison, true live traffic A/B, statistical conversion study.
- **Not done:** Screenshot binary archival to private R2 with GET SHA256 readback and D1 checkpoint; screenshot previews were used transiently in manual visual assessment. Do **not** say screenshot delivery is complete.
- **Production:** unchanged. This experiment remains under `labs/`; do not auto-merge.
- **Preferred next test:** user judges the two **live links** with the mobile A/B switch and desktop side-by-side. This tests a real choice of art direction, not an internal detector policy score.

## Independent user-visible checkpoints

A: https://louisalviss.github.io/valentine/directions/flow-ab/no-flow/  
New B: https://raw.githack.com/louisalviss/valentine/3863f4e56e7e4567c97963881d8483d59ab3c51f/labs/siteops-operator-manifesto/index.html  
Viewer: https://raw.githack.com/louisalviss/valentine/3863f4e56e7e4567c97963881d8483d59ab3c51f/labs/siteops-operator-manifesto/compare.html
