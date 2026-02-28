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

test("swap-state - constructor: UI属性 aria-* data-*（tig以外）をスナップショットする", async () => {
	setupDom(`
		<input
			id="price"
			name="price"
			type="text"
			class="x y"
			value="1234"
			placeholder="enter"
			inputmode="decimal"
			autocomplete="off"
			required
			minlength="1"
			maxlength="10"
			pattern="\\d+"
			title="Price"
			tabindex="2"
			aria-label="Price input"
			aria-describedby="help"
			data-foo="bar"
			data-tig-rules="numeric"
		>
		<div id="help">help</div>
	`);

	const { SwapState } = await import("./swap-state.js");
	const input = document.getElementById("price");

	const state = new SwapState(input);

	assert.equal(state.originalType, "text");
	assert.equal(state.originalId, "price");
	assert.equal(state.originalName, "price");
	assert.equal(state.originalClass, "x y");

	// UI属性
	assert.equal(state.originalUiAttrs.placeholder, "enter");
	assert.equal(state.originalUiAttrs.inputmode, "decimal");
	assert.equal(state.originalUiAttrs.autocomplete, "off");
	assert.equal(state.originalUiAttrs.required, ""); // boolean属性は getAttribute で "" になりがち
	assert.equal(state.originalUiAttrs.minlength, "1");
	assert.equal(state.originalUiAttrs.maxlength, "10");
	assert.equal(state.originalUiAttrs.pattern, "\\d+");
	assert.equal(state.originalUiAttrs.title, "Price");
	assert.equal(state.originalUiAttrs.tabindex, "2");

	// aria-*
	assert.equal(state.originalAriaAttrs["aria-label"], "Price input");
	assert.equal(state.originalAriaAttrs["aria-describedby"], "help");

	// data-*（tig除外）
	assert.equal(state.originalDataset.foo, "bar");
	assert.equal(state.originalDataset.tigRules, undefined); // data-tig-rules は dataset.tigRules だが除外される
});

test("swap-state - applyToRaw: input を hidden(raw) 化して id を外し tig dataset を付与する", async () => {
	setupDom("<input id=\"price\" name=\"price\" type=\"text\" class=\"x\" value=\"1234\">");

	const { SwapState } = await import("./swap-state.js");
	const raw = document.getElementById("price");

	const state = new SwapState(raw);
	state.applyToRaw(raw);

	assert.equal(raw.type, "hidden");
	assert.equal(raw.getAttribute("id"), null);
	assert.equal(raw.className, "");
	assert.equal(raw.dataset.tigRole, "raw");
	assert.equal(raw.dataset.tigOriginalId, "price");
	assert.equal(raw.dataset.tigOriginalName, "price");
});

test("swap-state - createDisplay: display(text) を生成し id/class/value と UI属性 aria-* data-* を反映する", async () => {
	setupDom(`
		<input
			id="price"
			name="price"
			type="text"
			class="x y"
			value="1234"
			placeholder="enter"
			inputmode="decimal"
			autocomplete="off"
			required
			maxlength="10"
			aria-label="Price input"
			data-foo="bar"
			data-tig-role="raw"
		>
	`);

	const { SwapState } = await import("./swap-state.js");
	const raw = document.getElementById("price");

	const state = new SwapState(raw);

	// raw 化は createDisplay の前でも後でも良いが、raw.value を読むのでここではそのまま
	const display = state.createDisplay(raw);

	assert.ok(display instanceof HTMLInputElement);
	assert.equal(display.type, "text");
	assert.equal(display.dataset.tigRole, "display");

	// id/class/value は引き継ぎ
	assert.equal(display.id, "price");
	assert.equal(display.className, "x y");
	assert.equal(display.value, "1234");

	// name は送信しないので持たない
	assert.equal(display.getAttribute("name"), null);

	// UI属性
	assert.equal(display.getAttribute("placeholder"), "enter");
	assert.equal(display.getAttribute("inputmode"), "decimal");
	assert.equal(display.getAttribute("autocomplete"), "off");
	assert.ok(display.hasAttribute("required"));
	assert.equal(display.getAttribute("maxlength"), "10");

	// aria-*
	assert.equal(display.getAttribute("aria-label"), "Price input");

	// data-*（tig以外）
	assert.equal(display.dataset.foo, "bar");
	// tig系は display にコピーしない
	assert.equal(display.dataset.tigRole, "display");
	assert.equal(display.dataset.tigOriginalId, undefined);
});

test("swap-state - removeDisplay: DOM から display を削除する", async () => {
	const dom = setupDom("<input id=\"price\" name=\"price\" type=\"text\" value=\"1234\">");

	const { SwapState } = await import("./swap-state.js");
	const raw = document.getElementById("price");

	const state = new SwapState(raw);
	const display = state.createDisplay(raw);

	// raw の直後に挿入してから削除確認
	raw.after(display);
	assert.equal(dom.window.document.querySelectorAll("input").length, 2);

	state.removeDisplay();
	assert.equal(dom.window.document.querySelectorAll("input").length, 1);
	assert.equal(dom.window.document.getElementById("price"), raw);
});

test("swap-state - restoreRaw: type/id/name/class を復元し tig dataset を削除する", async () => {
	setupDom("<input id=\"price\" name=\"price\" type=\"text\" class=\"x y\" value=\"1234\">");

	const { SwapState } = await import("./swap-state.js");
	const raw = document.getElementById("price");

	const state = new SwapState(raw);

	// swapした体にする
	state.applyToRaw(raw);
	assert.equal(raw.type, "hidden");
	assert.equal(raw.getAttribute("id"), null);

	// 復元
	state.restoreRaw(raw);

	assert.equal(raw.type, "text");
	assert.equal(raw.getAttribute("id"), "price");
	assert.equal(raw.getAttribute("name"), "price");
	assert.equal(raw.className, "x y");

	assert.equal(raw.dataset.tigRole, undefined);
	assert.equal(raw.dataset.tigOriginalId, undefined);
	assert.equal(raw.dataset.tigOriginalName, undefined);
});
