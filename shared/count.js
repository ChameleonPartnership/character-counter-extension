(function (root) {
  "use strict";

  var PLATFORM_LIMITS = [
    { id: "x", name: "X / Twitter", limit: 280 },
    { id: "instagram", name: "Instagram caption", limit: 2200 },
    { id: "linkedin", name: "LinkedIn post", limit: 3000 },
    { id: "metaDescription", name: "Meta description", limit: 160 },
    { id: "seoTitle", name: "SEO title", limit: 60 },
    { id: "sms", name: "SMS", limit: 160 },
    { id: "facebook", name: "Facebook post", limit: 63206 },
    { id: "youtubeTitle", name: "YouTube title", limit: 100 }
  ];

  var DEFAULT_SETTINGS = {
    defaultPreset: "x",
    readingWpm: 225,
    speakingWpm: 150,
    rememberDraft: true,
    theme: "light"
  };

  function normaliseText(text) {
    return String(text || "").replace(/\r\n?/g, "\n");
  }

  function countCharacters(text) {
    return Array.from(normaliseText(text)).length;
  }

  function countCharactersNoSpaces(text) {
    return Array.from(normaliseText(text).replace(/\s/g, "")).length;
  }

  function getWords(text) {
    var matches = normaliseText(text).match(/[A-Za-z0-9]+(?:[\u2019'-][A-Za-z0-9]+)*(?:[\u2019'])?/g);
    return matches || [];
  }

  function countSentences(text) {
    var value = normaliseText(text).trim();
    if (!value) {
      return 0;
    }
    var matches = value.match(/[^.!?]+[.!?]+(?=\s|$)/g);
    if (matches && matches.length) {
      var trailing = value.replace(/(?:[^.!?]+[.!?]+(?=\s|$))/g, "").trim();
      return matches.length + (trailing ? 1 : 0);
    }
    return 1;
  }

  function countParagraphs(text) {
    var value = normaliseText(text).trim();
    if (!value) {
      return 0;
    }
    return value.split(/\n\s*\n/).filter(function (paragraph) {
      return paragraph.trim().length > 0;
    }).length;
  }

  function countLines(text) {
    var value = normaliseText(text);
    if (!value) {
      return 0;
    }
    return value.split("\n").length;
  }

  function minutesForWords(wordCount, wordsPerMinute) {
    var speed = Math.max(1, Number(wordsPerMinute) || DEFAULT_SETTINGS.readingWpm);
    return wordCount / speed;
  }

  function formatDuration(minutes) {
    if (!minutes) {
      return "0 min";
    }
    if (minutes < 1) {
      return "< 1 min";
    }
    return Math.ceil(minutes) + " min";
  }

  function limitState(count, limit) {
    if (count > limit) {
      return "over";
    }
    if (count >= Math.floor(limit * 0.9)) {
      return "near";
    }
    return "ok";
  }

  function platformCounts(text) {
    var characters = countCharacters(text);
    return PLATFORM_LIMITS.map(function (platform) {
      var remaining = platform.limit - characters;
      return {
        id: platform.id,
        name: platform.name,
        limit: platform.limit,
        used: characters,
        remaining: remaining,
        state: limitState(characters, platform.limit),
        percent: Math.min(100, Math.round((characters / platform.limit) * 100))
      };
    });
  }

  function analyseText(text, settings) {
    var mergedSettings = Object.assign({}, DEFAULT_SETTINGS, settings || {});
    var words = getWords(text);
    return {
      characters: countCharacters(text),
      charactersNoSpaces: countCharactersNoSpaces(text),
      words: words.length,
      sentences: countSentences(text),
      paragraphs: countParagraphs(text),
      lines: countLines(text),
      readingTimeMinutes: minutesForWords(words.length, mergedSettings.readingWpm),
      readingTime: formatDuration(minutesForWords(words.length, mergedSettings.readingWpm)),
      speakingTimeMinutes: minutesForWords(words.length, mergedSettings.speakingWpm),
      speakingTime: formatDuration(minutesForWords(words.length, mergedSettings.speakingWpm)),
      platforms: platformCounts(text)
    };
  }

  function serpState(type, count) {
    if (type === "title") {
      if (count < 30) {
        return "short";
      }
      if (count <= 60) {
        return "good";
      }
      return "long";
    }
    if (count < 70) {
      return "short";
    }
    if (count <= 160) {
      return "good";
    }
    return "long";
  }

  function widthForCharacter(character) {
    if (/[mwMW]/.test(character)) {
      return 11;
    }
    if (/[A-Z]/.test(character)) {
      return 8;
    }
    if (/[ilI1.,'\u2019|!]/.test(character)) {
      return 3.5;
    }
    if (/[fjrt]/.test(character)) {
      return 5;
    }
    if (/\s/.test(character)) {
      return 4;
    }
    if (/[0-9]/.test(character)) {
      return 7;
    }
    if (/[^\u0000-\u007f]/.test(character)) {
      return 10;
    }
    return 7;
  }

  function estimatePixelWidth(text) {
    return Math.round(Array.from(normaliseText(text)).reduce(function (total, character) {
      return total + widthForCharacter(character);
    }, 0));
  }

  function truncateText(text, maxCharacters) {
    var characters = Array.from(normaliseText(text));
    if (characters.length <= maxCharacters) {
      return normaliseText(text);
    }
    return characters.slice(0, Math.max(0, maxCharacters - 3)).join("").trimEnd() + "...";
  }

  var api = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    PLATFORM_LIMITS: PLATFORM_LIMITS,
    analyseText: analyseText,
    countCharacters: countCharacters,
    countCharactersNoSpaces: countCharactersNoSpaces,
    countLines: countLines,
    countParagraphs: countParagraphs,
    countSentences: countSentences,
    estimatePixelWidth: estimatePixelWidth,
    formatDuration: formatDuration,
    getWords: getWords,
    limitState: limitState,
    platformCounts: platformCounts,
    serpState: serpState,
    truncateText: truncateText
  };

  root.CharacterCounter = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
