#!/usr/bin/env python3
"""Build the Chrome Web Store upload zip for Character Counter Pro.

Creates dist/character-counter-pro-<version>.zip containing only the files the
extension needs at runtime, and prints the sha256 so the published build can be
identified later in RELEASES.md.

Usage:
    python3 tools/package.py            # build the zip for the manifest version
    python3 tools/package.py --check    # validate only, write nothing
"""
import argparse
import hashlib
import json
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

# Runtime files only. Dev-only material (docs, tests, tools, README, harnesses)
# stays out of the uploaded package.
INCLUDE_FILES = ["manifest.json", "popup.html", "popup.css", "popup.js",
                 "options.html", "options.js"]
INCLUDE_DIRS = ["shared", "icons"]


def collect():
    files = []
    for name in INCLUDE_FILES:
        p = ROOT / name
        if not p.is_file():
            sys.exit(f"missing required file: {name}")
        files.append(p)
    for d in INCLUDE_DIRS:
        base = ROOT / d
        if not base.is_dir():
            sys.exit(f"missing required directory: {d}")
        files.extend(sorted(p for p in base.rglob("*") if p.is_file()))
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate only")
    args = ap.parse_args()

    manifest = json.loads((ROOT / "manifest.json").read_text())
    version = manifest["version"]
    files = collect()

    if args.check:
        print(f"version {version}, {len(files)} files, package would be built")
        return

    DIST.mkdir(exist_ok=True)
    out = DIST / f"character-counter-pro-{version}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, p.relative_to(ROOT).as_posix())

    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    size = out.stat().st_size
    print(f"wrote {out.relative_to(ROOT)} ({size} bytes, {size / 1024:.2f} KiB)")
    print(f"sha256 {digest}")
    print("record this version, size and hash in RELEASES.md after uploading")


if __name__ == "__main__":
    main()
