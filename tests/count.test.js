"use strict";

var assert = require("assert");
var counter = require("../shared/count.js");

function test(name, fn) {
  try {
    fn();
    console.log("PASS " + name);
  } catch (error) {
    console.error("FAIL " + name);
    throw error;
  }
}

test("counts characters with and without spaces", function () {
  assert.strictEqual(counter.countCharacters("Hi there"), 8);
  assert.strictEqual(counter.countCharactersNoSpaces("Hi there"), 7);
  assert.strictEqual(counter.countCharacters("A\nB"), 3);
});

test("counts words including hyphenated and apostrophe words", function () {
  var words = counter.getWords("It's a well-tested editor for users' drafts.");
  assert.deepStrictEqual(words, ["It's", "a", "well-tested", "editor", "for", "users'", "drafts"]);
  assert.strictEqual(counter.analyseText("One two three").words, 3);
});

test("counts sentences", function () {
  assert.strictEqual(counter.countSentences("Hello. Is this working? Yes!"), 3);
  assert.strictEqual(counter.countSentences("One sentence without punctuation"), 1);
  assert.strictEqual(counter.countSentences(""), 0);
});

test("counts paragraphs", function () {
  assert.strictEqual(counter.countParagraphs("First paragraph.\n\nSecond paragraph."), 2);
  assert.strictEqual(counter.countParagraphs("First\nline\n\n\nSecond"), 2);
  assert.strictEqual(counter.countParagraphs("   "), 0);
});

test("reports limit states", function () {
  assert.strictEqual(counter.limitState(20, 100), "ok");
  assert.strictEqual(counter.limitState(90, 100), "near");
  assert.strictEqual(counter.limitState(101, 100), "over");
  assert.strictEqual(counter.serpState("title", 29), "short");
  assert.strictEqual(counter.serpState("title", 60), "good");
  assert.strictEqual(counter.serpState("title", 61), "long");
  assert.strictEqual(counter.serpState("description", 69), "short");
  assert.strictEqual(counter.serpState("description", 160), "good");
  assert.strictEqual(counter.serpState("description", 161), "long");
});

console.log("All count tests passed.");
