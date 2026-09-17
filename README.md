# Character Counter Pro

Character Counter Pro is a Manifest V3 Chrome extension for local text counting and quick SEO length checks. It is designed as a useful repeat-use companion for https://www.character-counter.pro without analytics, tracking or network requests.

## What It Does

- Counts characters, characters without spaces, words, sentences, paragraphs, lines, reading time and speaking time as you type.
- Shows platform limits for X / Twitter, Instagram captions, LinkedIn posts, meta descriptions, SEO titles, SMS, Facebook posts and YouTube titles.
- Saves your draft locally when draft memory is enabled.
- Checks the active page title and meta description with the current tab only.
- Shows title and description length states, an approximate pixel width estimate and a Google-style SERP preview.
- Provides settings for the highlighted limit, reading speed, speaking speed, draft memory and theme.

## Load It Unpacked For Testing

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select this repository folder.
5. Pin Character Counter Pro from the Chrome toolbar menu.

## Chrome Web Store Submission Notes

Single purpose description:

Character Counter Pro counts text length and checks the active page title and meta description so writers, marketers and site owners can prepare content for common platform and SEO limits.

Permission justifications:

`storage`: Saves user preferences and, when enabled, stores the current draft locally so the user does not lose work between popup sessions.

`activeTab`: Allows the extension to check only the current tab after the user clicks the Check this page button.

`scripting`: Runs a small script on the active tab after user action to read `document.title` and the meta description. It does not alter the page.

Privacy statement:

Character Counter Pro runs entirely in the browser. Text, settings and draft content stay on the user's device using Chrome storage. The extension makes no network requests, uses no analytics, includes no remote code and sends no data to Character Counter Pro or any third party.

Remote code statement:

The extension contains only local HTML, CSS, JavaScript and PNG assets. It does not load scripts, styles, fonts or other executable resources from remote servers.

## Development Checks

Run the unit tests:

```sh
node tests/count.test.js
```

Generate the PNG icons:

```sh
python3 tools/make_icons.py
```
