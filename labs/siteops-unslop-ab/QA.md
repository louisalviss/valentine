# SiteOps AI — A/B Unslop canary QA checkpoint

**Date:** 2026-11-03 (Asia/Ho_Chi_Minh)  
**Status:** TECHNICAL_CANARY_PASS · **NO** human visual-preference winner, **NO** production promotion.

## Identity and scope

- **A:** `directions/flow-ab/no-flow/index.html` on `main`; Git blob `295827b9a7a889e18ed9fa322bb9745617596721`.
- **B:** `labs/siteops-unslop-ab/index.html` on `experiment/siteops-unslop-ab-20261103`; Git blob `bebe203b8388db8ef93c4a068549dd73aba9ac5a`; candidate fix commit `01a9ad8c6fc200b92eb9fac70f235a9df965010e`.
- Design basis: [Unslop by Damir Sokolovsky](https://github.com/heydamir/unslop) (CC BY 4.0). No paid visuals, generated images, external fonts, framework migration or production changes.
- Unified implementation authority remains `louisalviss/ui-ab-copy/docs/FLOW.md` in BUILD/polish mode; this document is **run evidence**, not another canonical flow.

## Exact source-detector run

- Tool: pinned `impeccable@4.8.0 detect --json <local-html-file>`.
- Runtime: `runner-vps1`, isolated ephemeral folder, dedicated non-root `uiab` user, `npm_config_ignore_scripts=true`, no hooks, no Live/Apply, no user credentials, same detector version for A and B.
- Both outputs were valid JSON arrays. Exit `2` means detected findings, exit `0` means none.

| Detector finding scope | A | B |
|---|---:|---:|
| Total | 43 | 0 |
| Warnings | 36 | 0 |
| Advisory | 7 | 0 |

A's principal findings included `undersized-ui-text`, `low-contrast`, `cramped-padding`, `tiny-text`, `hero-eyebrow-chip`, `overused-font`. B's initial six findings (five `cramped-padding`, one `side-tab`) were repaired; no ignores or detector policy changes were used. **This is a detector-specific result, not a blinded UX or conversion result.**

## Browser QA on the final B blob

- Browser: Chromium **156.0.8078.73**, Debian GNU/Linux 13; CDP `Emulation.setDeviceMetricsOverride`; DPR `1`; standard `mobile=false` desktop emulation at exact viewport dimensions; headless; dedicated non-root `uiab` with sandbox enabled; fresh disposable profile. No `--no-sandbox`.
- Inputs: exact GitHub source snapshots loaded locally as `file://`; unrelated A design-variant switch assets suppressed in **both** temporary QA copies; original GitHub files remain unchanged.
- Viewports: `390×844`, `768×1024`, `1440×900`.
- For every viewport: A and B share **identical main HTML** (SHA-256 `a00eb7b18acd2dfe878b70250a562a783fa6002424748fd2b443236f43016c63`) and identical header/main links (SHA-256 `f6cf5d0c121474c95a28bdb05d29cf87235fd94d87d2e7b28b51d53b1763e834`), five content sections, no broken in-page anchors, no JS exceptions, no horizontal overflow, no clipped headline.

| Check | A at all three viewports | Final B at all three viewports |
|---|---:|---:|
| Sampled text labels under 11px | 12 | 0 |
| Sampled text labels with contrast under 4.5:1 | 9 | 0 |
| Smallest CTA height | 42px | 45px |
| Horizontal overflow | No | No |
| Broken in-page anchors | 0 | 0 |
| JavaScript runtime exceptions | 0 | 0 |

*Counts are from selected UI text selectors, not exhaustive WCAG accessibility coverage. Exact contents and CTA targets were held constant. Full-page user-interaction and visual-preference evaluations remain pending.*

### First-viewport PNG screenshot identity (transient QA images)

| Viewport | A screenshot SHA-256 | B screenshot SHA-256 |
|---|---|---|
| 390×844 | `0c32f7ae15fa8bb0c7069387de962f9aea1ad612938362ba894985c0dcf9f2f8` | `c243a1c190b49fa4b15e0fc1785dc8d72c432eb436a7c578712f24726eb84cd6` |
| 768×1024 | `875b289e4305946ba421a50150e38c902c90c23310197cfcd7ed8863486021c2` | `8289c679892f4bca2050ce7cc5f3c4b8ee8b03df77ac453ce3c986d1123bf746` |
| 1440×900 | `9f1b7bfa9fd962d7e8154d33f797803ab964a49caeee6996f7cc5657095dba5f` | `368c4842ee5423b0cd1a134f48194a2a16f2af67d6d5e0a6cec15e8573dd6dc6` |

These hashes were computed on screenshots during the browser QA run; **the screenshot binary files were not durably uploaded to R2 in this run**. Do not treat hashes alone as retained visual evidence or mark the canonical artifact-completion gate satisfied.

## Corrected defect

Original B used two desktop hero columns on mobile because a later non-media CSS rule overrode the earlier mobile breakpoint. On 390px its `.product` reached right edge `413px` and caused horizontal scrolling. Commit `29dc96ac3e0e0127182a2b530f2e89f82e752008` restored a one-column hero at `max-width:820px`; commit `01a9ad8` addressed padding and the heavy card side tab. Both source-detector and browser checks were independently rerun after those commits.

## Terminal boundaries / next gate

- **PASS:** exact source-detection canary, matched-content responsive browser regression at the three specified sizes.
- **NOT RUN:** Impeccable hosted/URL scan, full WCAG audit, independent Iris engine, user-blind visual ratings, live 50/50 conversion experiment.
- **NOT PUBLISHED:** screenshot binaries to private R2 with GET hash readback and D1 checkpoint, production deploy, traffic changes.
- **Decision:** retain B as candidate only. Do not merge or auto-promote based on the detector score. The next meaningful gate is blind visual preference and additional accessibility testing, then durable screenshot evidence through the existing R2/D1 owner if sharing artifacts.
