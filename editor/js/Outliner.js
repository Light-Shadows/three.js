import { UIPanel } from "./libs/ui.js";
import { UIOutliner } from "./libs/ui.three.js";

function Outliner(editor) {
	const signals = editor.signals;

	const container = new UIPanel();
	container.setId("OutlinePanel");

	// outliner

	const nodeStates = new WeakMap();

	function buildOption(object, draggable) {
		const option = document.createElement("div");
		option.draggable = draggable;
		option.innerHTML = buildHTML(object);
		option.value = object.id;

		// opener

		if (nodeStates.has(object)) {
			const state = nodeStates.get(object);

			const opener = document.createElement("span");
			opener.classList.add("opener");

			if (object.children.length > 0) {
				opener.classList.add(state ? "open" : "closed");
			}

			opener.addEventListener("click", function () {
				nodeStates.set(object, nodeStates.get(object) === false); // toggle
				refreshUI();
			});

			option.insertBefore(opener, option.firstChild);
		}

		return option;
	}

	function getMaterialName(material) {
		if (Array.isArray(material)) {
			const array = [];

			for (let i = 0; i < material.length; i++) {
				array.push(material[i].name);
			}

			return array.join(",");
		}

		return material.name;
	}

	function escapeHTML(html) {
		return html
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	function getObjectType(object) {
		if (object.isScene) return "Scene";
		if (object.isCamera) return "Camera";
		if (object.isLight) return "Light";
		if (object.isMesh) return "Mesh";
		if (object.isLine) return "Line";
		if (object.isPoints) return "Points";

		return "Object3D";
	}

	function buildHTML(object) {
		let html = `<span class="type ${getObjectType(
			object
		)}"></span> ${escapeHTML(object.name)}`;

		if (object.isMesh) {
			const geometry = object.geometry;
			const material = object.material;

			html += ` <span class="type Geometry"></span> ${escapeHTML(
				geometry.name
			)}`;
			html += ` <span class="type Material"></span> ${escapeHTML(
				getMaterialName(material)
			)}`;
		}
		html += getScript(object.uuid);

		return html;
	}

	function getScript(uuid) {
		if (editor.scripts[uuid] !== undefined) {
			return ' <span class="type Script"></span>';
		}

		return "";
	}

	let ignoreObjectSelectedSignal = false;

	const outliner = new UIOutliner(editor);
	outliner.setId("outliner");
	outliner.onChange(function () {
		ignoreObjectSelectedSignal = true;

		editor.selectById(parseInt(outliner.getValue()));

		ignoreObjectSelectedSignal = false;
	});
	outliner.onDblClick(function () {
		editor.focusById(parseInt(outliner.getValue()));
	});
	container.add(outliner);

	function refreshUI() {
		const camera = editor.camera;
		const scene = editor.scene;

		const options = [];

		options.push(buildOption(camera, false));
		options.push(buildOption(scene, false));

		(function addObjects(objects, pad) {
			for (let i = 0, l = objects.length; i < l; i++) {
				const object = objects[i];

				if (nodeStates.has(object) === false) {
					nodeStates.set(object, false);
				}

				const option = buildOption(object, true);
				option.style.paddingLeft = pad * 18 + "px";
				options.push(option);

				if (nodeStates.get(object) === true) {
					addObjects(object.children, pad + 1);
				}
			}
		})(scene.children, 0);

		// ------------------------------------------------------------ outliner ------------------------------------------------------------
		outliner.setOptions(options);

		if (editor.selected !== null) {
			outliner.setValue(editor.selected.id);
		}
		// ----------------------------------------------------------------------------------------------------------------------------------
	}

	// events

	signals.editorCleared.add(refreshUI);

	signals.sceneGraphChanged.add(refreshUI);

	signals.objectSelected.add(function (object) {
		if (ignoreObjectSelectedSignal === true) return;

		if (object !== null && object.parent !== null) {
			let needsRefresh = false;
			let parent = object.parent;

			while (parent !== editor.scene) {
				if (nodeStates.get(parent) !== true) {
					nodeStates.set(parent, true);
					needsRefresh = true;
				}

				parent = parent.parent;
			}

			if (needsRefresh) refreshUI();

			outliner.setValue(object.id);
		} else {
			outliner.setValue(null);
		}
	});

	refreshUI();

	return container;
}

export { Outliner };
