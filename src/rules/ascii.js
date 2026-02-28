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

/**
 * ascii ルールを生成する
 * - 全角英数字・記号・全角スペースを半角へ正規化する
 * - カナは変換しない
 *
 * @returns {import("../text-input-guard.js").Rule}
 */
export function ascii() {
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
			const s = String(value);
			return Mojix.toHalfWidthAsciiCode(s);
		}
	};
}

/**
 * datasetから ascii ルールを生成する
 *
 * 対応する data 属性
 * - data-tig-rules-ascii
 *
 * @param {DOMStringMap} dataset
 * @param {HTMLInputElement|HTMLTextAreaElement} _el
 * @returns {import("../text-input-guard.js").Rule|null}
 */
ascii.fromDataset = function fromDataset(dataset, _el) {
	if (dataset.tigRulesAscii == null) {
		return null;
	}
	return ascii();
};
