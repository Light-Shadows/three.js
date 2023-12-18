import { UIElement } from "./libs/ui.js";

function ResizerOutliner(editor) {
	const signals = editor.signals;

	const dom = document.createElement("div");
	dom.id = "resizerOutline";

	function onPointerDown(event) {
		console.log(dom);
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
		// width de l'ecran
		const offsetWidth = document.body.offsetWidth;
		const clientX = event.clientX;
		// const cX =
		// 	clientX < offsetWidth ? (clientX < 0 ? 0 : clientX) : offsetWidth;

		const cX = clientX < 0 ? 0 : clientX > offsetWidth ? offsetWidth : clientX;

		const x = Math.max(200, cX);

		dom.style.left = x + "px";
		console.log(dom.style.left);

		document.getElementById("OutlinePanel").style.width = x + "px";
		document.getElementById("toolbar").style.left = x + 25 + "px";
		document.getElementById("info").style.left = x - 185 + "px";

		signals.windowResize.dispatch();
	}

	dom.addEventListener("pointerdown", onPointerDown);
	return new UIElement(dom);
}

export { ResizerOutliner };
