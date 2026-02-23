// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// DOM のクラスを参照するので、先に global に注入する
function setupDom(html = "<input id=\"price\" name=\"price\" type=\"text\" value=\"\">") {
	const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
		url: "http://localhost/"
	});

	// Node 環境に jsdom の DOM を生やす
	globalThis.window = dom.window;
	globalThis.document = dom.window.document;

	// instanceof 判定に必要なクラス群
	globalThis.HTMLElement = dom.window.HTMLElement;
	globalThis.HTMLInputElement = dom.window.HTMLInputElement;
	globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;

	return dom;
}

// テスト用：format があると separateValue.mode="auto" で swap が発動する
function ruleFormatComma() {
	return {
		name: "fmt-comma",
		targets: ["input"],
		// blur時だけ format が走る想定なので、単純にカンマを付ける
		format(v) {
			const s = String(v);
			if (s === "" || s === "-" || s === "." || s === "-.") { return s; }
			const sign = s.startsWith("-") ? "-" : "";
			const body = sign ? s.slice(1) : s;
			const [intPart, fracPart] = body.split(".");
			const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return fracPart != null ? `${sign}${withComma}.${fracPart}` : `${sign}${withComma}`;
		}
	};
}

// テスト用：focus時に「編集しやすい状態」へ戻すため、normalizeChar でカンマ除去
function ruleNormalizeRemoveComma() {
	return {
		name: "norm-remove-comma",
		targets: ["input"],
		normalizeChar(v) {
			return String(v).replace(/,/g, "");
		}
	};
}

test("auto swap: format ルールがあると input が hidden(raw) + display(text) に分離される", async () => {
	setupDom("<input id=\"price\" name=\"price\" type=\"text\" value=\"1234\">");

	// ここで import（setupDom 後ならどっちでもいいが、分かりやすくここで）
	const { attach } = await import("./text-input-guard.js");

	const input = document.getElementById("price");
	const guard = attach(input, {
		rules: [ruleFormatComma()],
		separateValue: { mode: "auto" } // 省略しても既定 auto
	});

	// 元 input は raw になって hidden 化
	assert.equal(input.type, "hidden");
	assert.equal(input.dataset.tigRole, "raw");

	// display が生成されて、id を引き継ぐ
	const display = guard.getDisplayElement();
	assert.ok(display instanceof HTMLInputElement);
	assert.equal(display.type, "text");
	assert.equal(display.id, "price");
	assert.equal(display.dataset.tigRole, "display");

	// display は送信しないので name を持たない
	assert.equal(display.getAttribute("name"), null);
});

test("commit(blur): raw は format 前、display は format 後（swap + blur の基本動作）", async () => {
	setupDom("<input id=\"price\" name=\"price\" type=\"text\" value=\"\">");

	const { attach } = await import("./text-input-guard.js");

	const input = document.getElementById("price");

	const guard = attach(input, {
		// focus時の “カンマ剥がし” を効かせたいので normalizeChar も一緒に
		rules: [ruleNormalizeRemoveComma(), ruleFormatComma()],
		separateValue: { mode: "auto" }
	});

	const display = guard.getDisplayElement();

	// ユーザーが入力した体で値を入れて blur
	display.value = "1234";
	display.dispatchEvent(new window.Event("blur", { bubbles: true }));

	// raw は format 前の値を保持（送信用）
	assert.equal(guard.getRawValue(), "1234");

	// display は format 後（表示用）
	assert.equal(display.value, "1,234");
});

test("focus: format 済み表示を normalize で剥がして編集用に戻す（rawも同期）", async () => {
	setupDom("<input id=\"price\" name=\"price\" type=\"text\" value=\"\">");

	const { attach } = await import("./text-input-guard.js");

	const input = document.getElementById("price");
	const guard = attach(input, {
		rules: [ruleNormalizeRemoveComma(), ruleFormatComma()],
		separateValue: { mode: "auto" }
	});

	const display = guard.getDisplayElement();

	// いったん blur で表示をカンマ付にする
	display.value = "1234";
	display.dispatchEvent(new window.Event("blur", { bubbles: true }));
	assert.equal(display.value, "1,234");
	assert.equal(guard.getRawValue(), "1234");

	// focus で “編集用” に戻る（onFocus は validate しない設計）
	display.dispatchEvent(new window.Event("focus", { bubbles: true }));
	assert.equal(display.value, "1234");

	// raw も同じに同期される
	assert.equal(guard.getRawValue(), "1234");
});
