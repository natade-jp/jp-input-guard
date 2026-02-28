// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";

import { kana } from "./kana.js";

test("kana - kana(): rule shape（name/targets/normalizeChar）", () => {
	const rule = kana();

	assert.equal(rule.name, "kana");
	assert.deepEqual(rule.targets, ["input", "textarea"]);
	assert.equal(typeof rule.normalizeChar, "function");
});

test("kana - normalizeChar: デフォルトはカタカナ全角へ統一（ひらがな→全角カタカナ）", () => {
	const rule = kana(); // target=katakana-full, nfkc=true
	const out = rule.normalizeChar("あいう", {});

	assert.equal(out, "アイウ");
});

test("kana - normalizeChar: target=katakana-full は半角カナも全角カナへ統一する", () => {
	const rule = kana({ target: "katakana-full" });
	const out = rule.normalizeChar("ｱｲｳ", {});

	assert.equal(out, "アイウ");
});

test("kana - normalizeChar: target=katakana-half は全角/ひらがなも半角カナへ統一する", () => {
	const rule = kana({ target: "katakana-half" });

	assert.equal(rule.normalizeChar("あいう", {}), "ｱｲｳ");
	assert.equal(rule.normalizeChar("アイウ", {}), "ｱｲｳ");
});

test("kana - normalizeChar: target=hiragana は全角ひらがなへ統一する（半角カナ/全角カナ→ひらがな）", () => {
	const rule = kana({ target: "hiragana" });

	assert.equal(rule.normalizeChar("ｱｲｳ", {}), "あいう");
	assert.equal(rule.normalizeChar("アイウ", {}), "あいう");
});

test("kana - normalizeChar: nfkc=true のとき、normalize が例外でも落ちない（try/catch の安全性）", () => {
	const original = String.prototype.normalize;

	try {
		// 古い環境や意地悪ケースを模擬：normalize が呼ばれたら例外を投げる
		String.prototype.normalize = function () {
			throw new Error("boom");
		};

		const rule = kana({ nfkc: true, target: "katakana-full" });

		// 例外を握りつぶして処理継続できることが目的（結果までは厳密固定しない）
		assert.doesNotThrow(() => {
			const out = rule.normalizeChar("あいう", {});
			assert.equal(out, "アイウ");
		});
	} finally {
		String.prototype.normalize = original;
	}
});

test("kana - normalizeChar: nfkc=false のとき、normalize が例外でも呼ばれないので落ちない", () => {
	const original = String.prototype.normalize;

	try {
		String.prototype.normalize = function () {
			throw new Error("boom");
		};

		const rule = kana({ nfkc: false, target: "katakana-full" });

		assert.doesNotThrow(() => {
			const out = rule.normalizeChar("あいう", {});
			assert.equal(out, "アイウ");
		});
	} finally {
		String.prototype.normalize = original;
	}
});

test("kana - fromDataset: data-tig-rules-kana が無い場合は null を返す", () => {
	const dataset = {};
	const rule = kana.fromDataset(dataset, null);

	assert.equal(rule, null);
});

test("kana - fromDataset: data-tig-rules-kana が存在する場合は rule を返す（オプション未指定ならデフォルト）", () => {
	const dataset = { tigRulesKana: "" };
	const rule = kana.fromDataset(dataset, null);

	assert.ok(rule);
	assert.equal(rule.name, "kana");
	assert.equal(rule.normalizeChar("あいう", {}), "アイウ"); // デフォルトは katakana-full
});

test("kana - fromDataset: target が反映される（katakana-half / hiragana）", () => {
	{
		const dataset = { tigRulesKana: "", tigRulesKanaTarget: "katakana-half" };
		const rule = kana.fromDataset(dataset, null);

		assert.ok(rule);
		assert.equal(rule.normalizeChar("あいう", {}), "ｱｲｳ");
	}
	{
		const dataset = { tigRulesKana: "", tigRulesKanaTarget: "hiragana" };
		const rule = kana.fromDataset(dataset, null);

		assert.ok(rule);
		assert.equal(rule.normalizeChar("ｱｲｳ", {}), "あいう");
	}
});

test("kana - fromDataset: target が不正値なら無視され、デフォルト（katakana-full）になる", () => {
	const dataset = { tigRulesKana: "", tigRulesKanaTarget: "invalid" };
	const rule = kana.fromDataset(dataset, null);

	assert.ok(rule);
	assert.equal(rule.normalizeChar("あいう", {}), "アイウ");
});

test("kana - fromDataset: nfkc は parseDatasetBool の結果が反映される（'true'/'false'）", () => {
	{
		const dataset = { tigRulesKana: "", tigRulesKanaNfkc: "false" };
		const rule = kana.fromDataset(dataset, null);

		assert.ok(rule);

		// nfkc=false なら normalize が例外でも影響しないことを軽く保証
		const original = String.prototype.normalize;
		try {
			String.prototype.normalize = function () {
				throw new Error("boom");
			};
			assert.doesNotThrow(() => rule.normalizeChar("あいう", {}));
		} finally {
			String.prototype.normalize = original;
		}
	}

	{
		const dataset = { tigRulesKana: "", tigRulesKanaNfkc: "true" };
		const rule = kana.fromDataset(dataset, null);

		assert.ok(rule);

		// nfkc=true でも try/catch で落ちないことを保証
		const original = String.prototype.normalize;
		try {
			String.prototype.normalize = function () {
				throw new Error("boom");
			};
			assert.doesNotThrow(() => rule.normalizeChar("あいう", {}));
		} finally {
			String.prototype.normalize = original;
		}
	}
});

test("kana - fromDataset: _el 引数は未使用だが渡しても問題ない", () => {
	const dataset = { tigRulesKana: "", tigRulesKanaTarget: "katakana-full" };

	assert.doesNotThrow(() => {
		kana.fromDataset(dataset, { dummy: true });
	});
});
