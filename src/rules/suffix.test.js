// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { suffix } from "./suffix.js";

test("suffix - suffix(): rule shape（name/targets/handlers）", () => {
	const rule = suffix({ text: "円" });

	assert.equal(rule.name, "suffix");
	assert.deepEqual(rule.targets, ["input"]);
	assert.equal(typeof rule.normalizeStructure, "function");
	assert.equal(typeof rule.format, "function");
});

test("suffix - normalizeStructure: text が空なら何もしない", () => {
	const rule = suffix({ text: "" });

	assert.equal(rule.normalizeStructure("123円"), "123円");
	assert.equal(rule.format("123"), "123");
});

test("suffix - normalizeStructure: 末尾の suffix を1回除去する", () => {
	const rule = suffix({ text: "円" });

	const result = rule.normalizeStructure("123円");

	assert.equal(result, "123");
});

test("suffix - normalizeStructure: 末尾の suffix を繰り返し除去する（while で全部取る）", () => {
	const rule = suffix({ text: "円" });

	const result = rule.normalizeStructure("123円円円");

	assert.equal(result, "123");
});

test("suffix - normalizeStructure: 末尾以外にある suffix は除去しない", () => {
	const rule = suffix({ text: "円" });

	const result = rule.normalizeStructure("1円23円");

	assert.equal(result, "1円23");
});

test("suffix - normalizeStructure: value が非文字列でも String 化されて動く", () => {
	const rule = suffix({ text: "円" });

	assert.equal(rule.normalizeStructure(123), "123"); // endsWith されないのでそのまま
	assert.equal(rule.normalizeStructure(null), "null"); // "null" は endsWith("円") false
});

test("suffix - format: text が空なら何もしない", () => {
	const rule = suffix({ text: "" });

	assert.equal(rule.format("123"), "123");
	assert.equal(rule.format(""), "");
});

test("suffix - format: 値があるときは末尾に suffix を付与する", () => {
	const rule = suffix({ text: "円" });

	const result = rule.format("123");

	assert.equal(result, "123円");
});

test("suffix - format: 値が空のとき showWhenEmpty=false なら空のまま", () => {
	const rule = suffix({ text: "円", showWhenEmpty: false });

	const result = rule.format("");

	assert.equal(result, "");
});

test("suffix - format: 値が空のとき showWhenEmpty=true なら suffix だけ表示する", () => {
	const rule = suffix({ text: "円", showWhenEmpty: true });

	const result = rule.format("");

	assert.equal(result, "円");
});

test("suffix - format: 値が '0' のときは空扱いにならず suffix を付ける", () => {
	const rule = suffix({ text: "円", showWhenEmpty: true });

	const result = rule.format("0");

	assert.equal(result, "0円");
});

test("suffix - fromDataset: data-tig-rules-suffix が無い場合は null を返す", () => {
	const dataset = {};
	const rule = suffix.fromDataset(dataset, null);

	assert.equal(rule, null);
});

test("suffix - fromDataset: data-tig-rules-suffix が存在する場合は rule を返す（text 未指定なら空）", () => {
	const dataset = { tigRulesSuffix: "" };
	const rule = suffix.fromDataset(dataset, null);

	assert.ok(rule);
	// text が空なので format/normalize は素通しになる
	assert.equal(rule.format("123"), "123");
	assert.equal(rule.normalizeStructure("123円"), "123円");
});

test("suffix - fromDataset: suffix-text / show-when-empty が反映される", () => {
	const dataset = {
		tigRulesSuffix: "",
		tigRulesSuffixText: "円",
		tigRulesSuffixShowWhenEmpty: "true"
	};
	const rule = suffix.fromDataset(dataset, null);

	assert.ok(rule);
	assert.equal(rule.format("123"), "123円");
	assert.equal(rule.format(""), "円");
	assert.equal(rule.normalizeStructure("123円円"), "123");
});

test("suffix - fromDataset: show-when-empty は 'true' のときだけ true（'false' や '' は false）", () => {
	{
		const dataset = {
			tigRulesSuffix: "",
			tigRulesSuffixText: "円",
			tigRulesSuffixShowWhenEmpty: "false"
		};
		const rule = suffix.fromDataset(dataset, null);

		assert.ok(rule);
		assert.equal(rule.format(""), "");
	}

	{
		const dataset = {
			tigRulesSuffix: "",
			tigRulesSuffixText: "円",
			tigRulesSuffixShowWhenEmpty: ""
		};
		const rule = suffix.fromDataset(dataset, null);

		assert.ok(rule);
		assert.equal(rule.format(""), "");
	}
});

test("suffix - fromDataset: _el 引数は未使用だが渡しても問題ない", () => {
	const dataset = { tigRulesSuffix: "", tigRulesSuffixText: "円" };

	assert.doesNotThrow(() => {
		suffix.fromDataset(dataset, { dummy: true });
	});
});
