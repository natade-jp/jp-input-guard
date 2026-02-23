// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { parseDatasetBool, parseDatasetNumber, parseDatasetEnum } from "./_dataset.js";

test("parseDatasetBool: 未指定(null/undefined)は undefined", () => {
	assert.equal(parseDatasetBool(), undefined);
	assert.equal(parseDatasetBool(/** @type {any} */ (null)), undefined);
});

test("parseDatasetBool: true 扱い（空文字 / true / 1 / yes / on）大小・空白を許容", () => {
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

test("parseDatasetBool: false 扱い（false / 0 / no / off）大小・空白を許容", () => {
	assert.equal(parseDatasetBool("false"), false);
	assert.equal(parseDatasetBool(" FALSE "), false);

	assert.equal(parseDatasetBool("0"), false);
	assert.equal(parseDatasetBool(" 0 "), false);

	assert.equal(parseDatasetBool("no"), false);
	assert.equal(parseDatasetBool(" No "), false);

	assert.equal(parseDatasetBool("off"), false);
	assert.equal(parseDatasetBool(" OFF "), false);
});

test("parseDatasetBool: 解釈できない値は undefined", () => {
	assert.equal(parseDatasetBool("maybe"), undefined);
	assert.equal(parseDatasetBool("2"), undefined);
	assert.equal(parseDatasetBool("truee"), undefined);
});

test("parseDatasetNumber: 未指定(null/undefined)は undefined", () => {
	assert.equal(parseDatasetNumber(), undefined);
	assert.equal(parseDatasetNumber(/** @type {any} */ (null)), undefined);
});

test("parseDatasetNumber: 空文字は undefined（空白だけも同様）", () => {
	assert.equal(parseDatasetNumber(""), undefined);
	assert.equal(parseDatasetNumber("   "), undefined);
});

test("parseDatasetNumber: 数値文字列は Number() で解釈される（整数想定だが小数も通る）", () => {
	assert.equal(parseDatasetNumber("0"), 0);
	assert.equal(parseDatasetNumber(" 42 "), 42);
	assert.equal(parseDatasetNumber("-10"), -10);
	assert.equal(parseDatasetNumber("3.14"), 3.14);
});

test("parseDatasetNumber: 解釈できない/有限でない値は undefined", () => {
	assert.equal(parseDatasetNumber("abc"), undefined);
	assert.equal(parseDatasetNumber("NaN"), undefined);
	assert.equal(parseDatasetNumber("Infinity"), undefined);
	assert.equal(parseDatasetNumber("-Infinity"), undefined);
});

test("parseDatasetEnum: 未指定(null/undefined)は undefined", () => {
	assert.equal(parseDatasetEnum(undefined, ["a", "b"]), undefined);
	assert.equal(parseDatasetEnum(/** @type {any} */ (null), ["a", "b"]), undefined);
});

test("parseDatasetEnum: 空文字は undefined（空白だけも同様）", () => {
	assert.equal(parseDatasetEnum("", ["a", "b"]), undefined);
	assert.equal(parseDatasetEnum("   ", ["a", "b"]), undefined);
});

test("parseDatasetEnum: allowed に含まれる場合だけ返す（厳密一致、大小区別あり）", () => {
	const allowed = ["none", "truncate", "round"];

	assert.equal(parseDatasetEnum("none", allowed), "none");
	assert.equal(parseDatasetEnum(" round ", allowed), "round");

	// 大小区別（厳密一致）
	assert.equal(parseDatasetEnum("ROUND", allowed), undefined);
});

test("parseDatasetEnum: allowed に無い値は undefined", () => {
	const allowed = ["none", "truncate", "round"];
	assert.equal(parseDatasetEnum("foo", allowed), undefined);
});
