# ATELIER — Horology editorial storytelling

User-accepted visual checkpoint: V18 Compact (2026-11-25). KEEP AS LAB / REVIEW; not a promoted pattern or client-ready. Original illustrative watch, no engineering-CAD or validated gear-ratio claim. Reference is a single continuous WebGL object integrated into editorial chapters. Do not replace it with independent viewers, dynamic collision-driven fitting, or clipping.

## Preview
Serve this directory over HTTP, then open index.html. No build required. Three.js 0.180.0 currently loads from jsDelivr via import map. The original 8,569,688-byte GLB is local.

## Source
source/movement.blend is the editable final V5 model with baked materials. The four Python scripts document the original sequential geometry build, with output paths adapted for portability. Run Blender headless in a writable working directory: build.py (creates source.blend), refine_v3.py on source.blend, refine_v4.py on baked-v3.blend, refine_v5.py on baked-v4.blend. Set ATELIER_BUILD_DIR to the same absolute work directory. This replay was not rerun for publication; the exact final Blender and GLB are preserved.

## QA and promotion debt
- WebKit 390x844 and 1440x900: five main poses, no horizontal overflow or JS exceptions in the tested run, color and component selection worked. Final mobile anatomy spacing separately checked.
- Compared with V17, page height reduced from 5776 to 4544 px on mobile and 5344 to 4587 px on desktop.
- QA images are historical evidence, not fresh captures of GitHub Pages.
- Full intermediate text overlap, tablet, complete reduced-motion behavior, physical iPhone frame rate/thermal, WebGL fallback, and reuse in another context still need verification.
- CDN runtime dependency and GLB size exceed current Web Motion Library performance threshold. Do not change thresholds or catalog status to force promotion.
- Repo lab only; canonical pattern library remains unchanged. manifest.json pins published source and captures.

Repository baseline gate: FAIL on existing Aurel assetRights and Living Atlas dependencies claims before this lab. No active catalog or gate change in this branch; main promotion is not authorized by this checkpoint.
