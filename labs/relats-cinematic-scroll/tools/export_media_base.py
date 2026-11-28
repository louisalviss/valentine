#!/usr/bin/env python3
"""Export a copy of the approved study using a separate media origin.
This is a build-only utility. No bucket creation, uploads or permission changes.
"""
from pathlib import Path
from urllib.parse import urlsplit
import argparse, hashlib, json, re

def export(lab, dest, origin, rights=None, local_test=False):
    lab, dest = Path(lab), Path(dest)
    origin = origin.rstrip("/") + "/"
    u = urlsplit(origin)
    loopback = u.hostname in ("127.0.0.1", "localhost", "::1")
    if not u.hostname or u.username or u.password or u.query or u.fragment or any(c.isspace() or ord(c) in (34,39,60,62) for c in origin):
        raise ValueError("Invalid media origin")
    if local_test:
        if not loopback or u.scheme not in ("http","https"):
            raise ValueError("Test media origin must be loopback")
    elif u.scheme != "https" or loopback:
        raise ValueError("Public origin must be HTTPS")
    manifest = json.loads((lab/"manifest.json").read_text())
    src = (lab/"source/index.html").read_bytes()
    if hashlib.sha256(src).hexdigest() != manifest["source/index.html"]["sha256"]:
        raise ValueError("Approved source checksum mismatch")
    if not local_test:
        if rights is None:
            raise ValueError("Public export requires rights evidence for each manifest asset")
        records = json.loads(Path(rights).read_text())
        for name, meta in manifest["media"].items():
            record = records.get(name, {})
            if record.get("sha256") != meta["sha256"] or not record.get("permission_reference") or record.get("public_distribution") is not True:
                raise ValueError("Missing matching permission evidence: "+name)
    content = src.decode("utf-8")
    if "media/" not in content:
        raise ValueError("No media paths found")
    # The approved source constructs dynamic asset names from this same prefix.
    # Only a build copy is rewritten, not the archived V12 HTML.
    result = content.replace("media/", origin+"media/")
    dest.mkdir(parents=True, exist_ok=True)
    output = dest/"index.html"
    if output.resolve() == (lab/"source/index.html").resolve():
        raise ValueError("Refusing to overwrite the approved source")
    output.write_text(result, encoding="utf-8")
    return output

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--media-origin", required=True)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--rights", type=Path)
    ap.add_argument("--local-test", action="store_true")
    a = ap.parse_args()
    print(export(Path(__file__).resolve().parents[1], a.output, a.media_origin, a.rights, a.local_test))
