(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.JPInputGuard = factory());
})(this, (function () { 'use strict';

	/**
	 * The script is part of JPInputGuard.
	 *
	 * AUTHOR:
	 *  natade-jp (https://github.com/natade-jp)
	 *
	 * LICENSE:
	 *  The MIT license https://opensource.org/licenses/MIT
	 */

	class JPInputGuard {
		static test() {
			return "ok";
		}
	}

	return JPInputGuard;

}));
