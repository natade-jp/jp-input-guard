// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { parseDatasetBool, parseDatasetNumber, parseDatasetEnum, parseDatasetEnumList } from "./_dataset.js";

test("dataset - parseDatasetBool: 未指定(null/undefined)は undefined", () => {
	assert.equal(parseDatasetBool(), undefined);
	assert.equal(parseDatasetBool(/** @type {any} */ (null)), undefined);
});

test("dataset - parseDatasetBool: true 扱い（空文字 / true / 1 / yes / on）大小・空白を許容", () => {
	assert.equal(parseDatasetBool(""), true);
	assert.equal(parseDatasetBool("   "), true);

	assert.equal(parseDatasetBool("true"), true);
	assert.equal(parseDatasetBool(" TRUE "), true);

	assert.equal(parseDatasetBool("1"), true);
	assert.equal(parseDatasetBool(" 1 "), true);

	assert.equal(parseDatasetBool("yes"), true);
	assert.equal(parseDatasetBool(" YeS "), true);

	assert.equal(parseDatasetBool("on"), true);
	assert.equal(parseDatasetBool(" ON "), true);
});

test("dataset - parseDatasetBool: false 扱い（false / 0 / no / off）大小・空白を許容", () => {
	assert.equal(parseDatasetBool("false"), false);
	assert.equal(parseDatasetBool(" FALSE "), false);

	assert.equal(parseDatasetBool("0"), false);
	assert.equal(parseDatasetBool(" 0 "), false);

	assert.equal(parseDatasetBool("no"), false);
	assert.equal(parseDatasetBool(" No "), false);

	assert.equal(parseDatasetBool("off"), false);
	assert.equal(parseDatasetBool(" OFF "), false);
});

test("dataset - parseDatasetBool: 解釈できない値は undefined", () => {
	assert.equal(parseDatasetBool("maybe"), undefined);
	assert.equal(parseDatasetBool("2"), undefined);
	assert.equal(parseDatasetBool("truee"), undefined);
});

test("dataset - parseDatasetBool: 非文字列でも String() 経由で解釈される", () => {
	assert.equal(parseDatasetBool(true), true);   // "true"
	assert.equal(parseDatasetBool(false), false); // "false"
	assert.equal(parseDatasetBool(1), true);      // "1"
	assert.equal(parseDatasetBool(0), false);     // "0"
});

test("dataset - parseDatasetNumber: 未指定(null/undefined)は undefined", () => {
	assert.equal(parseDatasetNumber(), undefined);
	assert.equal(parseDatasetNumber(/** @type {any} */ (null)), undefined);
});

test("dataset - parseDatasetNumber: 空文字は undefined（空白だけも同様）", () => {
	assert.equal(parseDatasetNumber(""), undefined);
	assert.equal(parseDatasetNumber("   "), undefined);
});

test("dataset - parseDatasetNumber: 数値文字列は Number() で解釈される（整数想定だが小数も通る）", () => {
	assert.equal(parseDatasetNumber("0"), 0);
	assert.equal(parseDatasetNumber(" 42 "), 42);
	assert.equal(parseDatasetNumber("-10"), -10);
	assert.equal(parseDatasetNumber("3.14"), 3.14);
});

test("dataset - parseDatasetNumber: 解釈できない/有限でない値は undefined", () => {
	assert.equal(parseDatasetNumber("abc"), undefined);
	assert.equal(parseDatasetNumber("NaN"), undefined);
	assert.equal(parseDatasetNumber("Infinity"), undefined);
	assert.equal(parseDatasetNumber("-Infinity"), undefined);
});

test("dataset - parseDatasetNumber: 指数表記も Number() として解釈される", () => {
	assert.equal(parseDatasetNumber("1e3"), 1000);
	assert.equal(parseDatasetNumber(" -2e2 "), -200);
});

test("dataset - parseDatasetNumber: 16進表記も Number() として解釈される", () => {
	assert.equal(parseDatasetNumber("0x10"), 16);
});

test("dataset - parseDatasetEnum: 未指定(null/undefined)は undefined", () => {
	assert.equal(parseDatasetEnum(undefined, ["a", "b"]), undefined);
	assert.equal(parseDatasetEnum(/** @type {any} */ (null), ["a", "b"]), undefined);
});

test("dataset - parseDatasetEnum: 空文字は undefined（空白だけも同様）", () => {
	assert.equal(parseDatasetEnum("", ["a", "b"]), undefined);
	assert.equal(parseDatasetEnum("   ", ["a", "b"]), undefined);
});

test("dataset - parseDatasetEnum: allowed に含まれる場合だけ返す（厳密一致、大小区別あり）", () => {
	const allowed = ["none", "truncate", "round"];

	assert.equal(parseDatasetEnum("none", allowed), "none");
	assert.equal(parseDatasetEnum(" round ", allowed), "round");

	// 大小区別（厳密一致）
	assert.equal(parseDatasetEnum("ROUND", allowed), undefined);
});

test("dataset - parseDatasetEnum: allowed に無い値は undefined", () => {
	const allowed = ["none", "truncate", "round"];
	assert.equal(parseDatasetEnum("foo", allowed), undefined);
});

test("dataset - parseDatasetEnumList: 未指定(null/undefined)は undefined", () => {
	assert.equal(parseDatasetEnumList(undefined, ["a", "b"]), undefined);
	assert.equal(parseDatasetEnumList(/** @type {any} */ (null), ["a", "b"]), undefined);
});

test("dataset - parseDatasetEnumList: 空文字は undefined（空白だけも同様）", () => {
	assert.equal(parseDatasetEnumList("", ["a", "b"]), undefined);
	assert.equal(parseDatasetEnumList("   ", ["a", "b"]), undefined);
});

test("dataset - parseDatasetEnumList: カンマ区切りを解釈し、trim して allowed のみ返す", () => {
	const allowed = ["a", "b", "c"];

	assert.deepEqual(parseDatasetEnumList("a,b,c", allowed), ["a", "b", "c"]);
	assert.deepEqual(parseDatasetEnumList(" a, b ,c ", allowed), ["a", "b", "c"]);
});

test("dataset - parseDatasetEnumList: 空要素は無視する（連続カンマや前後カンマ）", () => {
	const allowed = ["a", "b", "c"];

	assert.deepEqual(parseDatasetEnumList("a,,b", allowed), ["a", "b"]);
	assert.deepEqual(parseDatasetEnumList(",a,b,", allowed), ["a", "b"]);
	assert.deepEqual(parseDatasetEnumList(",,", allowed), []);
});

test("dataset - parseDatasetEnumList: allowed に無い要素は除外される（全部 allowed 外なら空配列）", () => {
	const allowed = ["a", "b"];

	assert.deepEqual(parseDatasetEnumList("a,x,b", allowed), ["a", "b"]);
	assert.deepEqual(parseDatasetEnumList("x,y", allowed), []);
});

test("dataset - parseDatasetEnumList: 大小区別は厳密（allowed に無ければ除外）", () => {
	const allowed = ["none", "truncate", "round"];

	assert.deepEqual(parseDatasetEnumList("none,round", allowed), ["none", "round"]);
	assert.deepEqual(parseDatasetEnumList("NONE,round", allowed), ["round"]);
});

test("dataset - parseDatasetEnumList: 重複は除去しない（入力順のまま残る）", () => {
	const allowed = ["a", "b"];

	assert.deepEqual(parseDatasetEnumList("a,a,b,a", allowed), ["a", "a", "b", "a"]);
});
