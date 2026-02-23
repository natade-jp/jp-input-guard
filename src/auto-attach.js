/**
 * The script is part of TextInputGuard.
 *
 * AUTHOR:
 *  natade-jp (https://github.com/natade-jp)
 *
 * LICENSE:
 *  The MIT license https://opensource.org/licenses/MIT
 */

import { parseDatasetBool } from "./rules/_dataset.js";

/**
 * @typedef {import("./text-input-guard.js").GuardGroup} GuardGroup
 * @typedef {import("./text-input-guard.js").Guard} Guard
 * @typedef {import("./text-input-guard.js").AttachOptions} AttachOptions
 * @typedef {import("./text-input-guard.js").Rule} Rule
 */

/**
 * data属性からルールを生成できるルールファクトリ
 * @typedef {Object} RuleFactory
 * @property {string} name
 * @property {(dataset: DOMStringMap, el: HTMLInputElement|HTMLTextAreaElement) => Rule|null} fromDataset
 */

/**
 * separate mode を解釈する（未指定は "auto"）
 * @param {string|undefined} v
 * @returns {"auto"|"swap"|"off"}
 */
function parseSeparateMode(v) {
	if (v == null || String(v).trim() === "") { return "auto"; }
	const s = String(v).trim().toLowerCase();
	if (s === "auto" || s === "swap" || s === "off") { return /** @type {any} */ (s); }
	return "auto";
}

/**
 * その要素が autoAttach の対象かを判定する
 * - 設定系（data-tig-separate / warn / invalid-class）
 * - ルール系（data-tig-rules-* が1つでもある）
 * @param {DOMStringMap} ds
 * @returns {boolean}
 */
function hasAnyJpigConfig(ds) {
	// attach設定系
	if (ds.tigSeparate != null) { return true; }
	if (ds.tigWarn != null) { return true; }
	if (ds.tigInvalidClass != null) { return true; }

	// ルール系（data-tig-rules-*）
	for (const k in ds) {
		// data-tig-rules-numeric -> ds.tigRulesNumeric
		if (k.startsWith("tigRules")) {
			return true;
		}
	}
	return false;
}

/**
 * autoAttach の実体（attach関数とルールレジストリを保持する）
 */
export class InputGuardAutoAttach {
	/**
	 * @param {(el: HTMLInputElement|HTMLTextAreaElement, options: AttachOptions) => Guard} attachFn
	 * @param {RuleFactory[]} ruleFactories
	 */
	constructor(attachFn, ruleFactories) {
		/** @type {(el: HTMLInputElement|HTMLTextAreaElement, options: AttachOptions) => Guard} */
		this.attachFn = attachFn;

		/** @type {RuleFactory[]} */
		this.ruleFactories = Array.isArray(ruleFactories) ? ruleFactories : [];
	}

	/**
	 * ルールファクトリを追加登録（将来用：必要なら使う）
	 * @param {RuleFactory} factory
	 * @returns {void}
	 */
	register(factory) {
		this.ruleFactories.push(factory);
	}

	/**
	 * root 配下の input/textarea を data属性から自動で attach する
	 * - 既に `data-tig-attached` が付いているものはスキップ
	 * - `data-tig-*`（設定）と `data-tig-rules-*`（ルール）を拾って options を生成
	 *
	 * @param {Document|DocumentFragment|ShadowRoot|Element} [root=document]
	 * @returns {GuardGroup}
	 */
	autoAttach(root = document) {
		/** @type {Guard[]} */
		const guards = [];

		/** @type {(HTMLInputElement|HTMLTextAreaElement)[]} */
		const elements = [];

		// root配下
		if (/** @type {any} */ (root).querySelectorAll) {
			const nodeList = /** @type {any} */ (root).querySelectorAll("input, textarea");
			for (const el of nodeList) {
				if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
					elements.push(el);
				}
			}
		}

		// root自身
		if (root instanceof HTMLInputElement || root instanceof HTMLTextAreaElement) {
			if (!elements.includes(root)) { elements.push(root); }
		}

		for (const el of elements) {
			const ds = el.dataset;

			// 二重attach防止
			if (ds.tigAttached === "true") { continue; }

			// JPIGの設定が何も無ければ対象外
			if (!hasAnyJpigConfig(ds)) { continue; }

			/** @type {AttachOptions} */
			const options = {};

			// warn / invalidClass
			const warn = parseDatasetBool(ds.tigWarn);
			if (warn != null) { options.warn = warn; }

			if (ds.tigInvalidClass != null && String(ds.tigInvalidClass).trim() !== "") {
				options.invalidClass = String(ds.tigInvalidClass);
			}

			// separateValue（未指定は auto）
			options.separateValue = { mode: parseSeparateMode(ds.tigSeparate) };

			// ルール収集
			/** @type {Rule[]} */
			const rules = [];
			for (const fac of this.ruleFactories) {
				try {
					const rule = fac.fromDataset(ds, el);
					if (rule) { rules.push(rule); }
				} catch (e) {
					const w = options.warn ?? true;
					if (w) {
						console.warn(`[text-input-guard] autoAttach: rule "${fac.name}" fromDataset() threw an error.`, e);
					}
				}
			}
			if (rules.length > 0) { options.rules = rules; }

			// ルールが無いなら attach しない（v0.1方針）
			if (!options.rules || options.rules.length === 0) { continue; }

			// attach（init内で auto/swap 判定も完了）
			const guard = this.attachFn(el, options);
			guards.push(guard);

			// 二重attach防止フラグ
			el.dataset.tigAttached = "true";
		}

		return {
			detach: () => { for (const g of guards) { g.detach(); } },
			isValid: () => guards.every((g) => g.isValid()),
			getErrors: () => guards.flatMap((g) => g.getErrors()),
			getGuards: () => guards
		};
	}
}
