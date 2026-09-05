# Motion Primitives source-import policy

This Valentine reference is built from the pinned upstream `ibelick/motion-primitives` source at commit `92586e62a951eb9b6bfd1cc7c8a4e6e2ab6ba17d` under the upstream MIT license.

The MIT classification applies to the repository software. It is not automatically extended to externally hosted demo media referenced by the upstream application.

For the Valentine static import:

- bundled upstream public assets used by the verified surface remain local under the nested reference path;
- externally hosted demo media from Cosmos, Spotify, and Pinterest is not copied or re-hosted when independent reuse rights are not established;
- those external media URLs are deterministically replaced with a neutral local SVG placeholder;
- OneDollarStats analytics is replaced with a local no-op script;
- outbound navigation links are not rewritten;
- `SANITIZATION.json` is the machine-readable replacement receipt;
- visual fidelity, interaction fidelity, and network self-containment remain independent acceptance gates and must each pass without lowering the 98% fidelity threshold.

A successful network-isolation test only establishes that the accepted Valentine surface runs without an essential origin dependency. It does not grant or infer rights to any excluded upstream demo media.
