import { UIElement } from "./libs/ui.js";

function ResizerOutliner(editor) {
	const signals = editor.signals;

	const dom = document.createElement("div");
	dom.id = "resizerOutline";

	function onMouseDown(event) {
		if (event.isPrimary === false) return;

		dom.ownerDocument.addEventListener("pointermove", onMouseMove);
		dom.ownerDocument.addEventListener("pointerup", onMouseUp);
	}

	function onMouseUp(event) {
		if (event.isPrimary === false) return;
		dom.ownerDocument.removeEventListener("pointermove", onMouseMove);
		dom.ownerDocument.removeEventListener("pointerup", onMouseUp);
	}

	function onMouseMove(event) {
		console.log("test");
		const offsetWidth = document.body.offsetWidth;
		const clientX = event.clientX;

		const cX = clientX < 0 ? 0 : clientX > offsetWidth ? offsetWidth : clientX;

		const x = Math.max(260, offsetWidth - cX);

		dom.style.left = x + "px";

		document.getElementById("toolbar").style.left = x + "px";
		document.getElementById("OutlinePanel").style.left = x + "px";

		signals.windowResize.dispatch();
	}

	dom.addEventListener("mousedown", onMouseDown);

	return new UIElement(dom);
}

export { ResizerOutliner };
