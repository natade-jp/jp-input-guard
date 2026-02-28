import { attach, rules } from "../../src/main.js";

const input = document.getElementById("price");
const output = document.getElementById("output");

const guard = attach(input, {
	rules: [
		rules.numeric({
			allowFullWidth: true,
			allowMinus: true,
			allowDecimal: true
		}),
		rules.digits({
			int: 8,
			frac: 4,
			overflowInputInt: "block",
			overflowInputFrac: "block"
		}),
		rules.prefix({
			text: "¥",
			showWhenEmpty: true
		}),
		rules.suffix({
			text: " JPY"
		}),
		rules.comma()
	]
});
guard.setValue("123");
const el = guard.getDisplayElement();

function renderState() {
	output.textContent = `display value : ${el.value}
raw value     : ${guard.getRawValue()}
isValid       : ${guard.isValid()}
errors        : ${JSON.stringify(guard.getErrors(), null, 2)}`;
}

el.addEventListener("compositionend", renderState);
el.addEventListener("input", renderState);
el.addEventListener("blur", renderState);

document.getElementById("check").addEventListener("click", renderState);

renderState();
