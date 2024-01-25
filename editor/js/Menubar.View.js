import { UIPanel, UIRow } from "./libs/ui.js";

function MenubarView(editor) {
	const strings = editor.strings;
	const signals = editor.signals;

	const container = new UIPanel();
	container.setClass("menu");

	const title = new UIPanel();
	title.setClass("title");
	title.setTextContent(strings.getKey("menubar/view"));
	container.add(title);

	const options = new UIPanel();
	options.setClass("options");
	container.add(options);

	// Fullscreen

	const option = new UIRow();
	option.setClass("option");
	option.setTextContent(strings.getKey("menubar/view/fullscreen"));
	document.getElementById("OutlinePanel").style.display = "block";
	option.onClick(function () {
		const outliner = document.getElementById("OutlinePanel").style;
		const toolbar = document.getElementById("toolbar").style;
		const info = document.getElementById("info").style;
		const viewport = document.getElementById("viewport").style;
		const sidebar = document.getElementById("sidebar").style;

		if (outliner.display === "block") {
			outliner.display = "none";
			sidebar.display = "none";
			toolbar.left = "25px";
			info.left = "25px";
			viewport.left = "0px";
			viewport.right = "0px";
		} else {
			outliner.display = "block";
			sidebar.display = "block";
			toolbar.left = outliner.width
				? parseInt(outliner.width, 10) + 25 + "px"
				: parseInt(toolbar.left, 10) + 200 + "px";
			info.left =
				outliner.width > 200 ? "25px" : parseInt(toolbar.left, 10) - 200 + "px";
			console.log(parseInt(outliner.width, 10) + "px");
			viewport.left = outliner.width
				? parseInt(outliner.width, 10) + "px"
				: "200px";
			viewport.right = sidebar.width
				? parseInt(sidebar.width, 10) + "px"
				: "300px";
		}
		signals.windowResize.dispatch();
	});
	options.add(option);

	// VR (Work in progress)

	if ("xr" in navigator) {
		navigator.xr.isSessionSupported("immersive-vr").then(function (supported) {
			if (supported) {
				const option = new UIRow();
				option.setClass("option");
				option.setTextContent("VR");
				option.onClick(function () {
					editor.signals.toggleVR.dispatch();
				});
				options.add(option);
			}
		});
	}

	return container;
}

export { MenubarView };
