import assert from "node:assert/strict";
import { parseCsv, parseI18nCsv } from "../apps/web/src/utils/csv.js";
import { cloneJson } from "../apps/web/src/utils/json.js";

testCsvParsing();
testI18nParsing();
testJsonClone();

console.log("Web utility tests passed.");

function testCsvParsing() {
  const rows = parseCsv('key,en,zh\r\ngreeting,"Hello, world","你好"\r\nquote,"a ""quoted"" value","引号"');
  assert.deepEqual(rows, [
    ["key", "en", "zh"],
    ["greeting", "Hello, world", "你好"],
    ["quote", 'a "quoted" value', "引号"],
  ]);
}

function testI18nParsing() {
  const dictionary = parseI18nCsv("key,en,zh\nui.start,Start,开始\nui.empty,,");
  assert.equal(dictionary.en["ui.start"], "Start");
  assert.equal(dictionary.zh["ui.start"], "开始");
  assert.equal(dictionary.en["ui.empty"], "");
  assert.equal(dictionary.zh["ui.empty"], "");
}

function testJsonClone() {
  const source = { nested: { value: 1 }, list: ["a"] };
  const clone = cloneJson(source);
  clone.nested.value = 2;
  clone.list.push("b");
  assert.equal(source.nested.value, 1);
  assert.deepEqual(source.list, ["a"]);
}
