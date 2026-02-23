// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { digits } from "./digits.js";

/**
 * GuardContext の最小モックを作る
 */
function createCtx() {
	return {
		errors: [],
		revert: null,

		pushError(e) {
			this.errors.push(e);
		},

		requestRevert(r) {
			this.revert = r;
		}
	};
}

test("validate: int overflow（countLeadingZeros=true）でエラーが積まれる", () => {
	const rule = digits({ int: 2, countLeadingZeros: true });
	const ctx = createCtx();

	rule.validate("001", ctx);

	assert.equal(ctx.revert, null);
	assert.equal(ctx.errors.length, 1);
	assert.equal(ctx.errors[0].code, "digits.int_overflow");
	assert.deepEqual(ctx.errors[0].detail, { limit: 2, actual: 3 });
});

test("validate: int overflow（countLeadingZeros=false）だと 001 は 1桁扱いでOK", () => {
	const rule = digits({ int: 2, countLeadingZeros: false });
	const ctx = createCtx();

	rule.validate("001", ctx);

	assert.equal(ctx.revert, null);
	assert.equal(ctx.errors.length, 0);
});

test("validate: overflowInputInt=block のときは requestRevert してエラーは積まない", () => {
	const rule = digits({ int: 2, overflowInputInt: "block" });
	const ctx = createCtx();

	rule.validate("123", ctx);

	assert.ok(ctx.revert);
	assert.equal(ctx.revert.reason, "digits.int_overflow");
	assert.deepEqual(ctx.revert.detail, { limit: 2, actual: 3 });
	assert.equal(ctx.errors.length, 0);
});

test("validate: overflowInputFrac=block のときは requestRevert", () => {
	const rule = digits({ frac: 2, overflowInputFrac: "block" });
	const ctx = createCtx();

	rule.validate("1.234", ctx);

	assert.ok(ctx.revert);
	assert.equal(ctx.revert.reason, "digits.frac_overflow");
	assert.deepEqual(ctx.revert.detail, { limit: 2, actual: 3 });
	assert.equal(ctx.errors.length, 0);
});

test("fix: 整数部 truncateLeft", () => {
	const rule = digits({ int: 3, fixIntOnBlur: "truncateLeft" });
	assert.equal(rule.fix("12345", createCtx()), "345");
});

test("fix: 整数部 truncateRight", () => {
	const rule = digits({ int: 3, fixIntOnBlur: "truncateRight" });
	assert.equal(rule.fix("12345", createCtx()), "123");
});

test("fix: 整数部 clamp", () => {
	const rule = digits({ int: 3, fixIntOnBlur: "clamp" });
	assert.equal(rule.fix("12345", createCtx()), "999");
});

test("fix: 小数部 truncate（dot がある時だけ）", () => {
	const rule = digits({ frac: 2, fixFracOnBlur: "truncate" });
	assert.equal(rule.fix("1.234", createCtx()), "1.23");
});

test("fix: 小数部 round（繰り上げなし）", () => {
	const rule = digits({ frac: 2, fixFracOnBlur: "round" });
	assert.equal(rule.fix("1.235", createCtx()), "1.24");
});

test("fix: 小数部 round（繰り上げで整数が増える）", () => {
	const rule = digits({ frac: 2, fixFracOnBlur: "round" });
	assert.equal(rule.fix("9.999", createCtx()), "10.00");
});

test("fix: frac=0 の場合はドットを消して返す（round で整数に反映）", () => {
	const rule = digits({ frac: 0, fixFracOnBlur: "round" });
	assert.equal(rule.fix("1.5", createCtx()), "2");
});

test("fix: dot が無い値は frac 指定があってもそのまま（小数補正しない）", () => {
	const rule = digits({ frac: 2, fixFracOnBlur: "truncate" });
	assert.equal(rule.fix("123", createCtx()), "123");
});

test("fromDataset: tigRulesDigits が無ければ null", () => {
	const rule = digits.fromDataset({}, /** @type {any} */ (null));
	assert.equal(rule, null);
});

test("fromDataset: dataset オプションが反映される（validate & fix で確認）", () => {
	const dataset = {
		tigRulesDigits: "1", // ON
		tigRulesDigitsInt: "3",
		tigRulesDigitsFrac: "2",
		tigRulesDigitsCountLeadingZeros: "true",
		tigRulesDigitsFixIntOnBlur: "truncateLeft",
		tigRulesDigitsFixFracOnBlur: "truncate",
		tigRulesDigitsOverflowInputInt: "block",
		tigRulesDigitsOverflowInputFrac: "none"
	};

	const rule = digits.fromDataset(dataset, /** @type {any} */ (null));
	assert.ok(rule);

	// validate: int=3 で block
	const ctx = createCtx();
	rule.validate("1234", ctx);
	assert.ok(ctx.revert);
	assert.equal(ctx.revert.reason, "digits.int_overflow");

	// fix: int truncateLeft, frac truncate
	assert.equal(rule.fix("12345.678", createCtx()), "345.67");
});
