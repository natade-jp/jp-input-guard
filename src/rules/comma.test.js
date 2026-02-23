// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { comma } from "./comma.js";

test("format: 空や入力途中の値はそのまま返す", () => {
	const rule = comma();

	assert.equal(rule.format(""), "");
	assert.equal(rule.format("-"), "-");
	assert.equal(rule.format("."), ".");
	assert.equal(rule.format("-."), "-.");
});

test("format: 3桁区切りカンマが整数部に付与される", () => {
	const rule = comma();

	assert.equal(rule.format("0"), "0");
	assert.equal(rule.format("12"), "12");
	assert.equal(rule.format("123"), "123");
	assert.equal(rule.format("1234"), "1,234");
	assert.equal(rule.format("12345"), "12,345");
	assert.equal(rule.format("123456"), "123,456");
	assert.equal(rule.format("1234567"), "1,234,567");
});

test("format: 負数でも整数部にカンマが付く", () => {
	const rule = comma();

	assert.equal(rule.format("-1234"), "-1,234");
	assert.equal(rule.format("-1234567"), "-1,234,567");
});

test("format: 小数がある場合、整数部だけにカンマを付けて小数部はそのまま", () => {
	const rule = comma();

	assert.equal(rule.format("1234.5"), "1,234.5");
	assert.equal(rule.format("1234567.89"), "1,234,567.89");
	assert.equal(rule.format("-1234567.89"), "-1,234,567.89");
});

test("format: 小数点が先頭にある形（.1）は整数部が空になり、そのまま '.1' になる", () => {
	const rule = comma();

	// intPart="" なので置換しても ""
	assert.equal(rule.format(".1"), ".1");
	assert.equal(rule.format("-.1"), "-.1");
});

test("fromDataset: tigRulesComma が無ければ null", () => {
	const rule = comma.fromDataset({}, /** @type {any} */ (null));
	assert.equal(rule, null);
});

test("fromDataset: tigRulesComma があれば comma ルールが返る", () => {
	const dataset = { tigRulesComma: "1" };
	const rule = comma.fromDataset(dataset, /** @type {any} */ (null));

	assert.ok(rule);
	assert.equal(rule.name, "comma");
	assert.equal(rule.format("1234"), "1,234");
});
