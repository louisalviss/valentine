# Relats — cinematic scroll study

User accepted V12 on 2026-11-28. KEEP AS LAB / REVIEW, not a promoted pattern, not client-ready, not an accepted 1:1 clone.

- [Approved live technical study](https://62-83-35-116.sslip.io/ab-ui/relats-scroll-study-v12-cinematic-20261128/index.html)
- [V10 stable rollback](https://62-83-35-116.sslip.io/ab-ui/relats-scroll-study-v10-stable-20261128/index.html)
- [Original reference](https://toptier.relats.com/)

## Source and reproduction
`source/index.html` is the byte-identical V12 implementation. For an authorized local replay, put the separately held matching reference media under `source/media/` according to manifest.json and serve over HTTP. The public repository intentionally excludes the original Relats videos, images and derived atlas/posters: media rights are unverified. This lab's Pages entry is a reference landing page linking the already deployed technical study, not a standalone copy of the site. Preserve provenance; do not market it as original client work.

## Reusable grammar and implementation rules
- Keep one dominant fullscreen moving object; sticky stage with scroll-driven bidirectional seeking.
- Partition narrative into three travel/hold beats: within each beat ease the local travel interval; change typography at beat boundaries, display progress, retain a normal-flow product-detail section.
- Mobile intro: combine seven moving panels into one H.264 atlas (576x1248, 24 fps, ~1.05 MB), aligned with static poster tiles; one decoding stream instead of seven. Static posters stay visible until decoded video is ready.
- Scrub sources: 24 fps, GOP 6, H.264, faststart, short seek intervals. Avoid seeking while a seek is pending; re-evaluate on next frame. Use separate mobile and desktop framing.
- Always show local poster first; lazy-start video near viewport; do not hide fallback on failed autoplay or missing media. Use small viewport units and responsive widths. Protect the V10 stability baseline; test blocked video independently from normal playback.
- User experience acceptance does not imply identical original geometry: V12 deliberately uses new pinned cinematic scenes.

## QA evidence
WebKit 390x844 and 1440x900 normal media, 320x568 with MP4 blocked: sticky stage held, three beat titles updated, fallback loaded, no horizontal overflow or JS/HTTP exceptions in checked scenes. Retest after mobile GOP optimization: Revitex frames 0.71 / 4.10 / 6.73 / 2.46 sec; X-ray 0.62 / 3.61 / 5.93 / 2.18 sec at scroll 0.12 / 0.49 / 0.82 / 0.22. All eight samples readyState 4 and not seeking. Initial load one video request. V10 separately tested all 12 media sections with blocked MP4 at 320,390,430px. V12 was not exhaustively regression-tested at all sections. Physical iPhone performance, full desktop/mobile QA, Control+Iris gates and commercial asset clearance remain unverified.

No catalog promotion or quality gate changes.

## Separate media origin
See [MEDIA-ORIGIN.md](MEDIA-ORIGIN.md) for the build-only GitHub Pages + media-origin export utility. Public deployment remains blocked pending asset permission and bounded-cost public hosting verification.
