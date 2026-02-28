/**
 * The script is part of TextInputGuard.
 *
 * AUTHOR:
 *  natade-jp (https://github.com/natade-jp)
 *
 * LICENSE:
 *  The MIT license https://opensource.org/licenses/MIT
 */

import Mojix from "./libs/mojix.js";
import { parseDatasetBool } from "./_dataset.js";

/**
 * ascii ルールのオプション
 * @typedef {Object} AsciiRuleOptions
 * @property {boolean} [nfkc=true] - 事前に Unicode NFKC 正規化を行う
 */

/**
 * ascii ルールを生成する
 * - 全角英数字・記号・全角スペースを半角へ正規化する
 * - カナは変換しない
 *
 * @param {AsciiRuleOptions} [options]
 * @returns {import("../text-input-guard.js").Rule}
 */
export function ascii(options = {}) {
	/** @type {AsciiRuleOptions} */
	const opt = {
		nfkc: options.nfkc ?? true
	};

	return {
		name: "ascii",
		targets: ["input", "textarea"],

		/**
		 * 英数字・記号の半角正規化
		 * @param {string} value
		 * @param {import("../text-input-guard.js").GuardContext} ctx
		 * @returns {string}
		 */
		normalizeChar(value, ctx) {
			let s = String(value);

			if (opt.nfkc) {
				try {
					s = s.normalize("NFKC");
				} catch {
					// noop
				}
			}

			s = Mojix.toHalfWidthAsciiCode(s);

			return s;
		}
	};
}

/**
 * datasetから ascii ルールを生成する
 *
 * 対応する data 属性
 * - data-tig-rules-ascii
 * - data-tig-rules-ascii-nfkc
 *
 * @param {DOMStringMap} dataset
 * @param {HTMLInputElement|HTMLTextAreaElement} _el
 * @returns {import("../text-input-guard.js").Rule|null}
 */
ascii.fromDataset = function fromDataset(dataset, _el) {
	if (dataset.tigRulesAscii == null) {
		return null;
	}

	/** @type {AsciiRuleOptions} */
	const options = {};

	const nfkc = parseDatasetBool(dataset.tigRulesAsciiNfkc);
	if (nfkc != null) {
		options.nfkc = nfkc;
	}

	return ascii(options);
};
