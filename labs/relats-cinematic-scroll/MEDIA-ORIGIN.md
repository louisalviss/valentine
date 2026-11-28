# Separate static media origin — GitHub Pages + R2

Status: BUILD_READY / PUBLIC_MEDIA_BLOCKED. The approved V12 source remains byte-identical. The build utility only rewrites relative media URLs in a separate output; it does not create cloud resources, upload media or change access permissions.

## Intended topology

GitHub Pages serves HTML/CSS/JS. A dedicated public media hostname serves rights-cleared static media in the same manifest-relative tree. Use a versioned prefix and immutable URLs, correct Content-Type and byte-range responses for MP4. Posters are still available before video playback; lazy loading and short-GOP scrub are unchanged.

Public distribution requires explicit asset rights evidence and separate approved cost/quota limits. The private 72-hour delivery flow is not modified or reused as a public origin. Never expose a private artifact bucket. Do not publish reference footage without verified permission. No R2 resource has been changed.

## Build (once assets are cleared)

`python3 tools/export_media_base.py --media-origin https://YOUR-APPROVED-MEDIA-HOST/V12 --rights /path/to/rights.json --output /path/to/staging`

The rights file is a JSON object keyed by each exact manifest media path. Each record includes its matching SHA-256, a permission_reference identifying the verified permission, and public_distribution: true. The script checks completeness; it does not independently authenticate legal rights. Keep private permission records out of public source. The result must pass HTTP, content-type, video Range, poster and scroll forward/backward checks before linking from the library. R2 billing and public bandwidth controls need separate verification.

## Test only

Use --local-test with a loopback origin; this cannot build a public URL. Test the generated page using a second loopback media server. Do not deploy the loopback artifact.

The existing approved VPS preview remains the active library link until a rights-cleared public export is actually verified.
