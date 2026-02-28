// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { prefix } from "./prefix.js";

test("prefix - prefix(): rule shape（name/targets/handlers）", () => {
	const rule = prefix({ text: "¥" });

	assert.equal(rule.name, "prefix");
	assert.deepEqual(rule.targets, ["input"]);
	assert.equal(typeof rule.normalizeStructure, "function");
	assert.equal(typeof rule.format, "function");
});

test("prefix - normalizeStructure: text が空なら何もしない", () => {
	const rule = prefix({ text: "" });

	assert.equal(rule.normalizeStructure("¥123"), "¥123");
	assert.equal(rule.format("123"), "123");
});

test("prefix - normalizeStructure: 先頭の prefix を1回除去する", () => {
	const rule = prefix({ text: "¥" });

	const result = rule.normalizeStructure("¥123");

	assert.equal(result, "123");
});

test("prefix - normalizeStructure: 先頭の prefix を繰り返し除去する（while で全部取る）", () => {
	const rule = prefix({ text: "¥" });

	const result = rule.normalizeStructure("¥¥¥123");

	assert.equal(result, "123");
});

test("prefix - normalizeStructure: 先頭以外にある prefix は除去しない", () => {
	const rule = prefix({ text: "¥" });

	const result = rule.normalizeStructure("1¥23");

	assert.equal(result, "1¥23");
});

test("prefix - normalizeStructure: value が非文字列でも String 化されて動く", () => {
	const rule = prefix({ text: "¥" });

	assert.equal(rule.normalizeStructure(123), "123"); // startsWith されないのでそのまま
	assert.equal(rule.normalizeStructure(null), "null"); // "null" は startsWith("¥") false
});

test("prefix - format: text が空なら何もしない", () => {
	const rule = prefix({ text: "" });

	assert.equal(rule.format("123"), "123");
	assert.equal(rule.format(""), "");
});

test("prefix - format: 値があるときは先頭に prefix を付与する", () => {
	const rule = prefix({ text: "¥" });

	const result = rule.format("123");

	assert.equal(result, "¥123");
});

test("prefix - format: 値が空のとき showWhenEmpty=false なら空のまま", () => {
	const rule = prefix({ text: "¥", showWhenEmpty: false });

	const result = rule.format("");

	assert.equal(result, "");
});

test("prefix - format: 値が空のとき showWhenEmpty=true なら prefix だけ表示する", () => {
	const rule = prefix({ text: "¥", showWhenEmpty: true });

	const result = rule.format("");

	assert.equal(result, "¥");
});

test("prefix - format: 値が '0' のときは空扱いにならず prefix を付ける", () => {
	const rule = prefix({ text: "¥", showWhenEmpty: true });

	const result = rule.format("0");

	assert.equal(result, "¥0");
});

test("prefix - fromDataset: data-tig-rules-prefix が無い場合は null を返す", () => {
	const dataset = {};
	const rule = prefix.fromDataset(dataset, null);

	assert.equal(rule, null);
});

test("prefix - fromDataset: data-tig-rules-prefix が存在する場合は rule を返す（text 未指定なら空）", () => {
	const dataset = { tigRulesPrefix: "" };
	const rule = prefix.fromDataset(dataset, null);

	assert.ok(rule);
	// text が空なので format/normalize は素通しになる
	assert.equal(rule.format("123"), "123");
	assert.equal(rule.normalizeStructure("¥123"), "¥123");
});

test("prefix - fromDataset: prefix-text / show-when-empty が反映される", () => {
	const dataset = {
		tigRulesPrefix: "",
		tigRulesPrefixText: "¥",
		tigRulesPrefixShowWhenEmpty: "true"
	};
	const rule = prefix.fromDataset(dataset, null);

	assert.ok(rule);
	assert.equal(rule.format("123"), "¥123");
	assert.equal(rule.format(""), "¥");
	assert.equal(rule.normalizeStructure("¥¥123"), "123");
});

test("prefix - fromDataset: show-when-empty は 'true' のときだけ true（'false' や '' は false）", () => {
	{
		const dataset = {
			tigRulesPrefix: "",
			tigRulesPrefixText: "¥",
			tigRulesPrefixShowWhenEmpty: "false"
		};
		const rule = prefix.fromDataset(dataset, null);

		assert.ok(rule);
		assert.equal(rule.format(""), "");
	}

	{
		const dataset = {
			tigRulesPrefix: "",
			tigRulesPrefixText: "¥",
			tigRulesPrefixShowWhenEmpty: ""
		};
		const rule = prefix.fromDataset(dataset, null);

		assert.ok(rule);
		assert.equal(rule.format(""), "");
	}
});

test("prefix - fromDataset: _el 引数は未使用だが渡しても問題ない", () => {
	const dataset = { tigRulesPrefix: "", tigRulesPrefixText: "¥" };

	assert.doesNotThrow(() => {
		prefix.fromDataset(dataset, { dummy: true });
	});
});
