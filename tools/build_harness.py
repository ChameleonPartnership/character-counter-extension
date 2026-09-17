#!/usr/bin/env python3
"""Build stubbed runtime harnesses for the extension popup and options pages.

Injects a fake chrome.* API before the extension scripts so popup.js and options.js can be driven
in a plain headless Chrome page. Verification only; the generated _harness_*.html files are
gitignored and are never shipped in the extension.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

STUB = r"""
<script>
window.__store = { local: {}, sync: {} };
function makeArea(name) {
  return {
    get: function (keys, cb) {
      var out = {};
      if (keys === null || keys === undefined) {
        out = Object.assign({}, window.__store[name]);
      } else if (typeof keys === "string") {
        out[keys] = window.__store[name][keys];
      } else if (Array.isArray(keys)) {
        keys.forEach(function (k) { out[k] = window.__store[name][k]; });
      } else {
        Object.keys(keys).forEach(function (k) {
          out[k] = window.__store[name][k] !== undefined ? window.__store[name][k] : keys[k];
        });
      }
      if (cb) { cb(out); }
    },
    set: function (obj, cb) {
      Object.keys(obj).forEach(function (k) { window.__store[name][k] = obj[k]; });
      if (cb) { cb(); }
    }
  };
}
window.chrome = {
  storage: { local: makeArea("local"), sync: makeArea("sync") },
  tabs: { query: function (q, cb) { cb([{ id: 1 }]); } },
  scripting: {
    executeScript: function (opts, cb) {
      cb([{ result: {
        title: "Extremely Long Example Page Title Designed To Overflow The Sixty Character Preview Limit",
        description: "A sample meta description used for verification purposes.",
        url: "https://example.com/a/very/long/path"
      } }]);
    }
  },
  runtime: { lastError: null, getURL: function (p) { return p; } }
};
</script>
"""

HARNESS_HEAD = r"""
<script>
window.__results = [];
function log(s) { window.__results.push(s); }
function done() {
  var pre = document.createElement("pre");
  pre.id = "RESULTS";
  pre.textContent = "@@EXT@@\n" + window.__results.join("\n") + "\n@@EXTEND@@";
  document.body.appendChild(pre);
}
</script>
"""

POPUP_DRIVER = r"""
<script>
window.addEventListener("load", function () {
  setTimeout(function () {
    try {
      var textarea = document.getElementById("draftText");
      var counts = document.getElementById("counts");
      var limits = document.getElementById("limits");
      if (!textarea) { log("FAIL draftText missing"); done(); return; }

      textarea.value = "Hello world. This is a verification test of the extension popup!";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      log("COUNTS: " + counts.innerText.replace(/\s+/g, " ").trim());

      log("LIMIT PRESETS PRESENT: " + /280/.test(limits.innerText) + " / totalRows=" + limits.querySelectorAll(".limit-row").length);
      textarea.value = "x".repeat(300);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      log("OVER-LIMIT STATE: " + /over/.test(limits.innerText));

      document.getElementById("checkPage").click();
      setTimeout(function () {
        var pr = document.getElementById("pageResult");
        log("PAGE RESULT: " + pr.innerText.replace(/\s+/g, " ").trim());
        log("SERP PREVIEW RENDERED: " + /Google search result preview/i.test(pr.innerHTML));
        log("NO RAW SCRIPT TAG INJECTED: " + (pr.innerHTML.indexOf("<script") === -1));
        log("LOCAL STORAGE KEYS: " + JSON.stringify(Object.keys(window.__store.local)));
        var ds = document.getElementById("draftStatus");
        log("DRAFT STATUS: " + (ds ? JSON.stringify(ds.textContent.trim()) : "missing"));
        done();
      }, 2500);
    } catch (e) { log("ERROR: " + e.message); done(); }
  }, 800);
});
</script>
"""

OPTIONS_DRIVER = r"""
<script>
window.addEventListener("load", function () {
  setTimeout(function () {
    try {
      var preset = document.getElementById("defaultPreset");
      log("PRESET OPTIONS: " + (preset ? preset.options.length : "MISSING"));
      log("PRESET VALUES: " + (preset ? Array.from(preset.options).map(function (o) { return o.value; }).join(",") : ""));

      var form = document.getElementById("settingsForm");
      if (!form) { log("FAIL settingsForm missing"); done(); return; }

      if (preset) { preset.value = preset.options[2] ? preset.options[2].value : preset.value; }
      var rw = document.getElementById("readingWpm");
      if (rw) { rw.value = "200"; }
      var sw = document.getElementById("speakingWpm");
      if (sw) { sw.value = "130"; }
      var rd = document.getElementById("rememberDraft");
      if (rd) { rd.checked = true; }
      var th = document.getElementById("theme");
      if (th) { th.value = th.options[1] ? th.options[1].value : th.value; }

      if (typeof form.requestSubmit === "function") { form.requestSubmit(); } else { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }

      setTimeout(function () {
        log("SYNC KEYS AFTER SAVE: " + JSON.stringify(window.__store.sync));
        log("LOCAL KEYS AFTER SAVE: " + JSON.stringify(Object.keys(window.__store.local)));
        var st = document.getElementById("saveStatus");
        log("SAVE STATUS: " + (st ? JSON.stringify(st.textContent.trim()) : "missing"));
        done();
      }, 1200);
    } catch (e) { log("ERROR: " + e.message); done(); }
  }, 800);
});
</script>
"""

PAGES = {"popup.html": POPUP_DRIVER, "options.html": OPTIONS_DRIVER}

for page, driver in PAGES.items():
    src = (ROOT / page).read_text()
    src = src.replace("<script src=", STUB + "<script src=", 1)
    src = src.replace("</body>", HARNESS_HEAD + driver + "</body>", 1)
    (ROOT / ("_harness_" + page)).write_text(src)
    print("wrote _harness_" + page)
