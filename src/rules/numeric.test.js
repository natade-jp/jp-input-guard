// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { numeric } from "./numeric.js";

test("numeric - normalizeChar: 半角数字はそのまま、カンマは除去される", () => {
	const rule = numeric();
	assert.equal(rule.normalizeChar("1,234"), "1234");
});

test("numeric - normalizeChar: allowFullWidth=true で全角数字が半角へ正規化される", () => {
	const rule = numeric({ allowFullWidth: true });
	assert.equal(rule.normalizeChar("１２３"), "123");
});

test("numeric - normalizeChar: allowFullWidth=false だと全角数字は除去される", () => {
	const rule = numeric({ allowFullWidth: false });
	assert.equal(rule.normalizeChar("１２３"), "");
});

test("numeric - normalizeChar: allowFullWidth=false でも半角は残り、全角記号は落ちる", () => {
	const rule = numeric({ allowFullWidth: false, allowMinus: true, allowDecimal: true });
	// 全角数字・全角ドット・全角マイナスは落ちる
	assert.equal(rule.normalizeChar("－１２３．４"), "");
	// 半角は残る
	assert.equal(rule.normalizeChar("-123.4"), "-123.4");
});

test("numeric - normalizeChar: 空白や文字は除去される（数字だけ残る）", () => {
	const rule = numeric({ allowFullWidth: true, allowMinus: true, allowDecimal: true });
	assert.equal(rule.normalizeChar(" 1 2 a b 3 "), "123");
});

test("numeric - normalizeChar: allowDecimal=false だと '.' や全角ドット類は除去される", () => {
	const rule = numeric({ allowDecimal: false, allowFullWidth: true });
	assert.equal(rule.normalizeChar("1.2"), "12");
	assert.equal(rule.normalizeChar("1．2"), "12"); // FULLWIDTH FULL STOP
	assert.equal(rule.normalizeChar("1。2"), "12"); // IDEOGRAPHIC FULL STOP
	assert.equal(rule.normalizeChar("1｡2"), "12"); // HALFWIDTH IDEOGRAPHIC FULL STOP
});

test("numeric - normalizeChar: allowDecimal=true だと '.' や全角ドット類は '.' に統一される", () => {
	const rule = numeric({ allowDecimal: true, allowFullWidth: true });
	assert.equal(rule.normalizeChar("1.2"), "1.2");
	assert.equal(rule.normalizeChar("1．2"), "1.2");
	assert.equal(rule.normalizeChar("1。2"), "1.2");
	assert.equal(rule.normalizeChar("1｡2"), "1.2");
});

test("numeric - normalizeChar: allowMinus=false だと '-' やマイナスっぽい文字は除去される", () => {
	const rule = numeric({ allowMinus: false, allowFullWidth: true });
	assert.equal(rule.normalizeChar("-12"), "12");
	assert.equal(rule.normalizeChar("－12"), "12"); // FULLWIDTH HYPHEN-MINUS
	assert.equal(rule.normalizeChar("−12"), "12"); // MINUS SIGN
	assert.equal(rule.normalizeChar("ー12"), "12"); // PROLONGED SOUND MARK
});

test("numeric - normalizeChar: allowMinus=true だと '-' やマイナスっぽい文字は '-' に統一される", () => {
	const rule = numeric({ allowMinus: true, allowFullWidth: true });
	assert.equal(rule.normalizeChar("-12"), "-12");
	assert.equal(rule.normalizeChar("－12"), "-12");
	assert.equal(rule.normalizeChar("−12"), "-12");
	assert.equal(rule.normalizeChar("ー12"), "-12");
});

test("numeric - normalizeChar: '+' や指数 'e/E' は常に除去される", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true, allowFullWidth: true });
	assert.equal(rule.normalizeChar("+12"), "12");
	assert.equal(rule.normalizeChar("＋12"), "12");
	assert.equal(rule.normalizeChar("1e3"), "13");
	assert.equal(rule.normalizeChar("1E3"), "13");
	assert.equal(rule.normalizeChar("1ｅ3"), "13");
	assert.equal(rule.normalizeChar("1Ｅ3"), "13");
});

test("numeric - normalizeStructure: allowMinus=true なら '-' は先頭の1回だけ残る", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: false });

	assert.equal(rule.normalizeStructure("--12"), "-12");
	assert.equal(rule.normalizeStructure("1-2"), "12"); // 先頭でない '-' は落ちる
	assert.equal(rule.normalizeStructure("-1-2"), "-12");
});

test("numeric - normalizeStructure: allowDecimal=true なら '.' は1回だけ残る（位置制約なし）", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true });

	assert.equal(rule.normalizeStructure("1.2.3"), "1.23");
	assert.equal(rule.normalizeStructure(".1.2"), ".12"); // 先頭 '.' は許容、2個目以降は落ちる
	assert.equal(rule.normalizeStructure("-.1.2"), "-.12");
});

test("numeric - normalizeStructure: allowMinus=false のとき '-' は全て落ちる", () => {
	const rule = numeric({ allowMinus: false, allowDecimal: true });
	assert.equal(rule.normalizeStructure("-12"), "12");
	assert.equal(rule.normalizeStructure("--12"), "12");
	assert.equal(rule.normalizeStructure("1-2"), "12");
});

test("numeric - normalizeStructure: allowDecimal=false のとき '.' は全て落ちる", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: false });
	assert.equal(rule.normalizeStructure("1.2"), "12");
	assert.equal(rule.normalizeStructure(".1"), "1");
	assert.equal(rule.normalizeStructure("-.1"), "-1");
});

test("numeric - fix: 未完成な数値 '-', '.', '-.' は空になる", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true });
	assert.equal(rule.fix("-"), "");
	assert.equal(rule.fix("."), "");
	assert.equal(rule.fix("-."), "");
});

test("numeric - fix: '-.1' → '-0.1' / '.1' → '0.1'", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true });
	assert.equal(rule.fix("-.1"), "-0.1");
	assert.equal(rule.fix(".1"), "0.1");
});

test("numeric - fix: 末尾の '.' は削除される", () => {
	const rule = numeric({ allowDecimal: true });
	assert.equal(rule.fix("12."), "12");
	assert.equal(rule.fix("0."), "0");
});

test("numeric - fix: 整数部の先頭ゼロを除去（全部ゼロなら '0'）", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true });

	assert.equal(rule.fix("000"), "0");
	assert.equal(rule.fix("00012"), "12");
	assert.equal(rule.fix("00012.340"), "12.340"); // 小数部は触らない
});

test("numeric - fix: '-0' や '-0.0' は '0' になる（負のゼロ除去）", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true });

	assert.equal(rule.fix("-0"), "0");
	assert.equal(rule.fix("-00"), "0");
	assert.equal(rule.fix("-0.0"), "0.0");
	assert.equal(rule.fix("-000.000"), "0.000");
});

test("numeric - fix: allowEmpty=false だと空文字は '0' になる", () => {
	const rule = numeric({ allowEmpty: false, allowMinus: true, allowDecimal: true });
	assert.equal(rule.fix(""), "0");
});

test("numeric - fix: allowEmpty=false だと '-', '.', '-.' も '0' になる", () => {
	const rule = numeric({ allowEmpty: false, allowMinus: true, allowDecimal: true });
	assert.equal(rule.fix("-"), "0");
	assert.equal(rule.fix("."), "0");
	assert.equal(rule.fix("-."), "0");
});

test("numeric - fix: '000.000' は '0.000' になる（整数部のみゼロ正規化）", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true });
	assert.equal(rule.fix("000.000"), "0.000");
});

test("numeric - fix: '-000.010' は '-0.010' になる（負のゼロではないので符号維持）", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true });
	assert.equal(rule.fix("-000.010"), "-0.010");
});

test("numeric - validate: numeric単体は no-op（エラーなどを出さない）", () => {
	const rule = numeric({ allowMinus: true, allowDecimal: true });
	const ctx = {
		called: false,
		pushError() { this.called = true; }
	};

	rule.validate("999", ctx);
	assert.equal(ctx.called, false);
});

test("numeric - fromDataset: tigRulesNumeric が無ければ null", () => {
	const rule = numeric.fromDataset({}, /** @type {any} */ (null));
	assert.equal(rule, null);
});

test("numeric - fromDataset: dataset のオプションが反映される（normalizeChar/structure/fix で確認）", () => {
	const dataset = {
		tigRulesNumeric: "1", // ON
		tigRulesNumericAllowFullWidth: "false",
		tigRulesNumericAllowMinus: "true",
		tigRulesNumericAllowDecimal: "true"
	};

	const rule = numeric.fromDataset(dataset, /** @type {any} */ (null));
	assert.ok(rule);

	// allowFullWidth=false なので全角は落ちる
	assert.equal(rule.normalizeChar("１２３．４"), "");
	// allowFullWidth=false なので半角は残る
	assert.equal(rule.normalizeChar("123.4"), "123.4");
	// 構造は '-' 先頭1回、'.' 1回
	assert.equal(rule.normalizeStructure("--1..2"), "-1.2");
	// fix で整形
	assert.equal(rule.fix("-.1"), "-0.1");
});

test("numeric - fromDataset: allowEmpty が反映される（false なら空→0）", () => {
	const dataset = {
		tigRulesNumeric: "1",
		tigRulesNumericAllowEmpty: "false",
		tigRulesNumericAllowMinus: "true",
		tigRulesNumericAllowDecimal: "true"
	};

	const rule = numeric.fromDataset(dataset, /** @type {any} */ (null));
	assert.ok(rule);
	assert.equal(rule.fix(""), "0");
	assert.equal(rule.fix("-"), "0");
});

test("numeric - fromDataset: allowEmpty 未指定ならデフォルト true（空は空のまま）", () => {
	const dataset = {
		tigRulesNumeric: "1"
	};

	const rule = numeric.fromDataset(dataset, /** @type {any} */ (null));
	assert.ok(rule);
	assert.equal(rule.fix(""), "");
});
