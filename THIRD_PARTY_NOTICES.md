# Third-Party / Provenance Notes

This repository is a working design and motion lab. Before using any demo commercially, review the provenance of its code, media and runtime dependencies.

## Repository origin

The repository originally started from the open-source “Will You Be My Valentine?” project by `ivysone`.

The origin notice is preserved in `legacy-valentine/`, and the original implementation remains available through git history. The original MIT license notice remains at the repository root.

## External libraries

Some experiments load libraries such as Three.js from public CDNs. Those libraries retain their own licenses and are not owned by this repository. For client production, prefer pinned versions and bundle/self-host dependencies when practical.

## External reference media

Historical experiments may contain public reference media, including photography or social-media assets. A demo being technically accessible does not imply that its media is cleared for commercial reuse.

Patterns marked `clientReady: false` in `web-motion-library/library.json` require asset/dependency review before adaptation for a client.

## Generated / recreated assets

Self-hosted recreated or generated assets should still be tracked by origin and purpose. Do not infer rights from file location alone.

## Curation policy

Duplicate, superseded, temporary repair and video-playback-only experiments are removed from the active tree when they no longer contribute reusable interaction grammar. Git history remains the technical archive.
