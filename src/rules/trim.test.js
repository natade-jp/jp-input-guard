// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { trim } from "./trim.js";

test("trim - normalizeStructure: 前後の空白が除去される", () => {
	const rule = trim();

	const result = rule.normalizeStructure("  abc  ");

	assert.equal(result, "abc");
});

test("trim - normalizeStructure: タブや改行も除去される", () => {
	const rule = trim();

	const result = rule.normalizeStructure("\n\t abc \r\n");

	assert.equal(result, "abc");
});

test("trim - normalizeStructure: 空白のみの場合は空文字になる", () => {
	const rule = trim();

	const result = rule.normalizeStructure("   \t  ");

	assert.equal(result, "");
});

test("trim - fromDataset: data-tig-rules-trim が無い場合は null を返す", () => {
	const dataset = {};
	const rule = trim.fromDataset(dataset, null);

	assert.equal(rule, null);
});

test("trim - fromDataset: data-tig-rules-trim が存在する場合は rule を返す", () => {
	const dataset = { tigRulesTrim: "" };
	const rule = trim.fromDataset(dataset, null);

	assert.ok(rule);
	assert.equal(rule.name, "trim");
});

test("trim - fromDataset: 値が 'false' でも属性が存在すれば有効になる", () => {
	const dataset = { tigRulesTrim: "false" };
	const rule = trim.fromDataset(dataset, null);

	assert.ok(rule);
	assert.equal(rule.normalizeStructure("  a  "), "a");
});

test("trim - fromDataset: _el 引数は未使用だが渡しても問題ない", () => {
	const dataset = { tigRulesTrim: "" };

	assert.doesNotThrow(() => {
		trim.fromDataset(dataset, { dummy: true });
	});
});
