// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { ascii } from "./ascii.js";

test("ascii - ascii(): rule shape（name/targets/normalizeChar）", () => {
	const rule = ascii();

	assert.equal(rule.name, "ascii");
	assert.deepEqual(rule.targets, ["input", "textarea"]);
	assert.equal(typeof rule.normalizeChar, "function");
});

test("ascii - normalizeChar: 全角英数字が半角に正規化される", () => {
	const rule = ascii();

	assert.equal(rule.normalizeChar("ＡＢＣ１２３", {}), "ABC123");
	assert.equal(rule.normalizeChar("ａｂｃ０９", {}), "abc09");
});

test("ascii - normalizeChar: 全角スペースが半角スペースに正規化される", () => {
	const rule = ascii();

	assert.equal(rule.normalizeChar("a　b", {}), "a b");
	assert.equal(rule.normalizeChar("　", {}), " ");
});

test("ascii - normalizeChar: 全角記号が半角に正規化される（代表例）", () => {
	const rule = ascii();

	assert.equal(rule.normalizeChar("！＃％＆（）＝＋", {}), "!#%&()=+");
	assert.equal(rule.normalizeChar("＠［］｛｝：；", {}), "@[]{}:;");
});

test("ascii - normalizeChar: カナは変換しない（全角カナ/半角カナが維持される）", () => {
	const rule = ascii();

	// “NFKCを入れると壊れた” 再発防止の中心
	assert.equal(rule.normalizeChar("アイウ", {}), "アイウ");
	assert.equal(rule.normalizeChar("ガギグゲゴ", {}), "ガギグゲゴ");
	assert.equal(rule.normalizeChar("ｱｲｳ", {}), "ｱｲｳ");
	assert.equal(rule.normalizeChar("ｶﾞｷﾞｸﾞｹﾞｺﾞ", {}), "ｶﾞｷﾞｸﾞｹﾞｺﾞ");
});

test("ascii - normalizeChar: 混在入力はASCII相当部分だけ半角化される", () => {
	const rule = ascii();

	assert.equal(rule.normalizeChar("ＡＢｱｲウ１２　！", {}), "ABｱｲウ12 !");
});

test("ascii - normalizeChar: value が非文字列でも String 化されて動く", () => {
	const rule = ascii();

	assert.equal(rule.normalizeChar(123, {}), "123");
	assert.equal(rule.normalizeChar(null, {}), "null");
	assert.equal(rule.normalizeChar(undefined, {}), "undefined");
});

test("ascii - fromDataset: data-tig-rules-ascii が無い場合は null を返す", () => {
	const dataset = {};
	const rule = ascii.fromDataset(dataset, null);

	assert.equal(rule, null);
});

test("ascii - fromDataset: data-tig-rules-ascii が存在する場合は rule を返す", () => {
	const dataset = { tigRulesAscii: "" };
	const rule = ascii.fromDataset(dataset, null);

	assert.ok(rule);
	assert.equal(rule.name, "ascii");
	assert.equal(rule.normalizeChar("ＡＢＣ１２３", {}), "ABC123");
});

test("ascii - fromDataset: dataset に余計な値があっても無視される（互換性のため）", () => {
	const dataset = { tigRulesAscii: "", tigRulesAsciiNfkc: "false", tigRulesAsciiFoo: "bar" };
	const rule = ascii.fromDataset(dataset, null);

	assert.ok(rule);
	assert.equal(rule.normalizeChar("アイウＡ１", {}), "アイウA1");
});

test("ascii - fromDataset: _el 引数は未使用だが渡しても問題ない", () => {
	const dataset = { tigRulesAscii: "" };

	assert.doesNotThrow(() => {
		ascii.fromDataset(dataset, { dummy: true });
	});
});
