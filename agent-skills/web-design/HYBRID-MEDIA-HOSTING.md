# Hybrid Media Hosting — Site Library

Approved 2026-11-28. Applies to public runtime assets with verified distribution rights.

- Keep HTML, CSS, JS, SVG and light runtime media (≤ 5,000,000 bytes) in GitHub when working well.
- Move runtime images/video/GIF/GLB above 5,000,000 bytes to the shared Cloudflare Pages static-only origin, https://valentine-site-media.pages.dev/. If total runtime media exceeds 30 MB, prioritize the largest files first.
- Max 25 MiB per Pages file; optimize or split larger media without perceptible quality loss. Editable source (.blend) and QA evidence are not runtime media; keep source in its canonical archive.
- Keep public website URLs on GitHub Pages unchanged. Use immutable hash-versioned media paths. Verify rights, full SHA-256 readback, MIME/CORS, playback/model decode, responsive behavior and actual public page. Hosting is not client-ready certification.
- Direct Upload must preserve the entire previous published media tree plus additions. Never erase existing assets. Preserve canary paths; retain a staging manifest for reconstruction. No R2 public or Pages Functions. Respect free-plan file/deployment limits and bounded attempts.
- Keep rollback in git history; remove redundant runtime binary from active tree only after CF readback and live QA. Keep light assets unchanged.
- Relats third-party study remains on VPS pending redistribution rights. Large synthetic video passed seek tests; HTTP Range returned 200, so do not assume byte-range support.
