(function () {
  "use strict";

  var counter = globalThis.CharacterCounter;
  var draftText = document.getElementById("draftText");
  var draftStatus = document.getElementById("draftStatus");
  var counts = document.getElementById("counts");
  var limits = document.getElementById("limits");
  var copyStats = document.getElementById("copyStats");
  var clearText = document.getElementById("clearText");
  var checkPage = document.getElementById("checkPage");
  var pageResult = document.getElementById("pageResult");
  var settings = Object.assign({}, counter.DEFAULT_SETTINGS);
  var saveTimer = 0;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function loadStorage() {
    chrome.storage.sync.get(counter.DEFAULT_SETTINGS, function (syncItems) {
      settings = Object.assign({}, counter.DEFAULT_SETTINGS, syncItems || {});
      document.body.classList.toggle("dark", settings.theme === "dark");
      chrome.storage.local.get({ draftText: "" }, function (localItems) {
        draftText.value = settings.rememberDraft ? localItems.draftText || "" : "";
        render();
        draftText.focus();
      });
    });
  }

  function saveDraft() {
    if (!settings.rememberDraft) {
      chrome.storage.local.remove("draftText");
      draftStatus.textContent = "Draft memory is off";
      return;
    }
    chrome.storage.local.set({ draftText: draftText.value }, function () {
      draftStatus.textContent = "Draft saved locally";
    });
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    draftStatus.textContent = settings.rememberDraft ? "Saving locally" : "Draft memory is off";
    saveTimer = setTimeout(saveDraft, 180);
  }

  function metric(label, value) {
    return "<div class=\"metric\"><strong>" + escapeHtml(value) + "</strong><span>" + escapeHtml(label) + "</span></div>";
  }

  function renderCounts(analysis) {
    counts.innerHTML = [
      metric("Characters", analysis.characters),
      metric("Without spaces", analysis.charactersNoSpaces),
      metric("Words", analysis.words),
      metric("Sentences", analysis.sentences),
      metric("Paragraphs", analysis.paragraphs),
      metric("Lines", analysis.lines),
      metric("Reading time", analysis.readingTime),
      metric("Speaking time", analysis.speakingTime)
    ].join("");
  }

  function renderLimits(analysis) {
    limits.innerHTML = analysis.platforms.map(function (platform) {
      var remainingText = platform.remaining >= 0
        ? platform.remaining + " left"
        : Math.abs(platform.remaining) + " over";
      var highlight = platform.id === settings.defaultPreset ? " highlight" : "";
      return [
        "<div class=\"limit-row" + highlight + "\">",
        "<div class=\"limit-label\"><strong>" + escapeHtml(platform.name) + "</strong>",
        "<span class=\"limit-meta\">" + platform.used + " / " + platform.limit + ", " + remainingText + "</span></div>",
        "<div class=\"track\" aria-hidden=\"true\"><div class=\"fill " + platform.state + "\" style=\"width: " + platform.percent + "%\"></div></div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function render() {
    var analysis = counter.analyseText(draftText.value, settings);
    renderCounts(analysis);
    renderLimits(analysis);
  }

  function copyCurrentStats() {
    var analysis = counter.analyseText(draftText.value, settings);
    var text = [
      "Characters: " + analysis.characters,
      "Characters without spaces: " + analysis.charactersNoSpaces,
      "Words: " + analysis.words,
      "Sentences: " + analysis.sentences,
      "Paragraphs: " + analysis.paragraphs,
      "Lines: " + analysis.lines,
      "Reading time: " + analysis.readingTime,
      "Speaking time: " + analysis.speakingTime
    ].join("\n");
    navigator.clipboard.writeText(text).then(function () {
      copyStats.textContent = "Copied";
      setTimeout(function () {
        copyStats.textContent = "Copy stats";
      }, 1200);
    }).catch(function () {
      copyStats.textContent = "Could not copy";
      setTimeout(function () {
        copyStats.textContent = "Copy stats";
      }, 1400);
    });
  }

  function readPageMetadata() {
    var descriptionTag = document.querySelector("meta[name='description'], meta[property='og:description']");
    return {
      title: document.title || "",
      description: descriptionTag ? descriptionTag.getAttribute("content") || "" : "",
      url: location.href
    };
  }

  function statusLabel(type, state) {
    if (type === "title") {
      return {
        short: "Title is under 30 characters",
        good: "Title is within 30 to 60 characters",
        long: "Title is over 60 characters"
      }[state];
    }
    return {
      short: "Description is under 70 characters",
      good: "Description is within 70 to 160 characters",
      long: "Description is over 160 characters"
    }[state];
  }

  function renderPageMetadata(data) {
    var title = data.title || "";
    var description = data.description || "";
    var titleCount = counter.countCharacters(title);
    var descriptionCount = counter.countCharacters(description);
    var titleState = counter.serpState("title", titleCount);
    var descriptionState = counter.serpState("description", descriptionCount);
    var descriptionMessage = description
      ? escapeHtml(description)
      : "No meta description was found. Search engines may choose page text instead.";

    pageResult.innerHTML = [
      "<div class=\"status-list\">",
      "<div class=\"status " + titleState + "\"><strong>Title</strong><br>" + escapeHtml(title || "No title found") + "<br><span>" + titleCount + " characters, about " + counter.estimatePixelWidth(title) + " px. " + statusLabel("title", titleState) + ".</span></div>",
      "<div class=\"status " + descriptionState + "\"><strong>Meta description</strong><br>" + descriptionMessage + "<br><span>" + descriptionCount + " characters, about " + counter.estimatePixelWidth(description) + " px. " + statusLabel("description", descriptionState) + ".</span></div>",
      "</div>",
      "<p class=\"hint\">Pixel width is an approximate estimate using per-character weights for common Latin text.</p>",
      "<div class=\"serp-card\" aria-label=\"Google search result preview\">",
      "<div class=\"serp-url\">" + escapeHtml(data.url || "Current page") + "</div>",
      "<div class=\"serp-title\">" + escapeHtml(counter.truncateText(title || "Untitled page", 60)) + "</div>",
      "<div class=\"serp-desc\">" + escapeHtml(counter.truncateText(description || "No meta description available.", 160)) + "</div>",
      "</div>"
    ].join("");
  }

  function checkActivePage() {
    pageResult.textContent = "Checking this page";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs && tabs[0];
      if (!tab || !tab.id) {
        pageResult.textContent = "Could not find the active tab.";
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: readPageMetadata
      }, function (results) {
        if (chrome.runtime.lastError) {
          pageResult.textContent = "This page cannot be checked. Chrome pages, PDF viewers and restricted pages do not allow this access.";
          return;
        }
        if (!results || !results[0] || !results[0].result) {
          pageResult.textContent = "No page data was returned.";
          return;
        }
        renderPageMetadata(results[0].result);
      });
    });
  }

  draftText.addEventListener("input", function () {
    render();
    scheduleSave();
  });

  copyStats.addEventListener("click", copyCurrentStats);

  clearText.addEventListener("click", function () {
    draftText.value = "";
    render();
    saveDraft();
    draftText.focus();
  });

  checkPage.addEventListener("click", checkActivePage);

  document.addEventListener("DOMContentLoaded", loadStorage);
})();
