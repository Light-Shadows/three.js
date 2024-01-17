import * as THREE from "three";

import { UIPanel, UIText, UIButton } from "./libs/ui.js";
import { UIBoolean } from "./libs/ui.three.js";

function MenubarStatus(editor) {
	const strings = editor.strings;

	const container = new UIPanel();
	container.setClass("menu right");

	const autosave = new UIBoolean(
		editor.config.getKey("autosave"),
		strings.getKey("menubar/status/autosave")
	);
	autosave.text.setColor("#888");
	autosave.onChange(function () {
		const value = this.getValue();

		editor.config.setKey("autosave", value);

		if (value === true) {
			editor.signals.sceneGraphChanged.dispatch();
		}
	});
	container.add(autosave);

	editor.signals.savingStarted.add(function () {
		autosave.text.setTextDecoration("underline");
	});

	editor.signals.savingFinished.add(function () {
		autosave.text.setTextDecoration("none");
	});

	// -------------------------------------------------- save --------------------------------------------------

	const save = new UIButton(strings.getKey("menubar/status/save"));
	save.onClick(() => {
		editor.signals.sceneGraphChanged.dispatch();
		editor.signals.savingStarted.dispatch();
		editor.storage.set(editor.toJSON());
		editor.signals.savingFinished.dispatch();
	});
	container.add(save);

	const version = new UIText("r" + THREE.REVISION);
	version.setClass("title");
	version.setOpacity(0.5);
	container.add(version);

	return container;
}

export { MenubarStatus };
