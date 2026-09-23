# Releases

Record of what was uploaded to the Chrome Web Store. Store uploads cannot be
diffed after the fact, so every release records the manifest version, the source
commit, the package hash and the listing state at the time of publishing.

## Published builds

| Version | Published | Source commit | Package sha256 | Store state |
| --- | --- | --- | --- | --- |
| 1.0.0 | 19 September 2026 | 3f5eb54 | not recorded | Published, public |

Listing: https://chromewebstore.google.com/detail/character-counter-pro/hohgmkbomabchlmbblkddfnieefncjno

Store item id `hohgmkbomabchlmbblkddfnieefncjno` is the Chrome Web Store id. It is
not the same as the unpacked extension id derived from this folder path, so local
testing must load the folder itself in developer mode.

### v1.0.0 notes

- First public release. Popup counter with eight platform presets, draft memory,
  reading and speaking time, the page checker with approximate pixel width and a
  Google style preview, an options page and four icon sizes.
- The package was uploaded before this record existed, so no zip hash was kept.
  Commit 3f5eb54 is the repository state the build came from, and the store
  reported a package size of 25.95 KiB.
- Store listing declares no data collection and links the privacy policy hosted at
  https://chameleonpartnership.github.io/character-counter-extension/privacy.html

## Building a package

```sh
python3 tools/package.py
```

Writes `dist/character-counter-pro-<version>.zip` with the runtime files only and
prints the sha256 to record here.
