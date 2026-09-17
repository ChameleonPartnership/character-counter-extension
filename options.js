(function () {
  "use strict";

  var counter = globalThis.CharacterCounter;
  var form = document.getElementById("settingsForm");
  var defaultPreset = document.getElementById("defaultPreset");
  var readingWpm = document.getElementById("readingWpm");
  var speakingWpm = document.getElementById("speakingWpm");
  var rememberDraft = document.getElementById("rememberDraft");
  var theme = document.getElementById("theme");
  var saveStatus = document.getElementById("saveStatus");

  function populatePresets() {
    defaultPreset.innerHTML = counter.PLATFORM_LIMITS.map(function (platform) {
      return "<option value=\"" + platform.id + "\">" + platform.name + " (" + platform.limit + ")</option>";
    }).join("");
  }

  function applyTheme(value) {
    document.body.classList.toggle("dark", value === "dark");
  }

  function loadSettings() {
    chrome.storage.sync.get(counter.DEFAULT_SETTINGS, function (items) {
      var settings = Object.assign({}, counter.DEFAULT_SETTINGS, items || {});
      defaultPreset.value = settings.defaultPreset;
      readingWpm.value = settings.readingWpm;
      speakingWpm.value = settings.speakingWpm;
      rememberDraft.checked = Boolean(settings.rememberDraft);
      theme.value = settings.theme;
      applyTheme(settings.theme);
    });
  }

  function numberFromInput(input, fallback, min, max) {
    var value = Number(input.value);
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var settings = {
      defaultPreset: defaultPreset.value,
      readingWpm: numberFromInput(readingWpm, counter.DEFAULT_SETTINGS.readingWpm, 50, 800),
      speakingWpm: numberFromInput(speakingWpm, counter.DEFAULT_SETTINGS.speakingWpm, 50, 400),
      rememberDraft: rememberDraft.checked,
      theme: theme.value
    };

    chrome.storage.sync.set(settings, function () {
      if (!settings.rememberDraft) {
        chrome.storage.local.remove("draftText");
      }
      applyTheme(settings.theme);
      saveStatus.textContent = "Settings saved";
      setTimeout(function () {
        saveStatus.textContent = "";
      }, 1600);
    });
  });

  theme.addEventListener("change", function () {
    applyTheme(theme.value);
  });

  populatePresets();
  loadSettings();
})();
