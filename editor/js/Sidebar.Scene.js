import * as THREE from "three";

import {
	UIPanel,
	UIBreak,
	UIRow,
	UIColor,
	UISelect,
	UIText,
	UINumber,
} from "./libs/ui.js";
import { UIBoolean, UIOutliner, UITexture } from "./libs/ui.three.js";
// import { GroundProjectedSkybox } from "three/addons/objects/GroundProjectedSkybox.js";

// let objectOfSkybox = {};
// let groundProjectedSkybox = new GroundProjectedSkybox(objectOfSkybox);

function SidebarScene(editor) {
	const signals = editor.signals;
	const strings = editor.strings;

	const container = new UIPanel();
	container.setBorderTop("0");
	container.setPaddingTop("20px");

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

	// let ignoreObjectSelectedSignal = false;

	// const outliner = new UIOutliner(editor);
	// outliner.setId("outliner");
	// outliner.onChange(function () {
	// 	ignoreObjectSelectedSignal = true;

	// 	editor.selectById(parseInt(outliner.getValue()));

	// 	ignoreObjectSelectedSignal = false;
	// });
	// outliner.onDblClick(function () {
	// 	editor.focusById(parseInt(outliner.getValue()));
	// });
	// container.add(outliner);
	// container.add(new UIBreak());

	// --------------------------------------------------background--------------------------------------------------

	const backgroundRow = new UIRow();

	const backgroundType = new UISelect()
		.setOptions({
			None: "None",
			Color: "Color",
			Texture: "Texture",
			Equirectangular: "Equirect",
			ProjectedBackground: "groundProject",
		})
		.setWidth("150px");
	backgroundType.onChange(function () {
		onBackgroundChanged();
		refreshBackgroundUI();
	});

	backgroundRow.add(
		new UIText(strings.getKey("sidebar/scene/background")).setWidth("90px")
	);
	backgroundRow.add(backgroundType);

	const backgroundColor = new UIColor()
		.setValue("#000000")
		.setMarginLeft("8px")
		.onInput(onBackgroundChanged);
	backgroundRow.add(backgroundColor);

	const backgroundTexture = new UITexture(editor)
		.setMarginLeft("8px")
		.onChange(onBackgroundChanged)
		.setDisplay("none");
	backgroundRow.add(backgroundTexture);

	const backgroundEquirectangularTexture = new UITexture(editor)
		.setMarginLeft("8px")
		.onChange(onBackgroundChanged)
		.setDisplay("none");
	backgroundRow.add(backgroundEquirectangularTexture);

	container.add(backgroundRow);

	const backgroundEquirectRow = new UIRow()
		.setDisplay("none")
		.setMarginLeft("90px");

	// background === equirect

	// background canvas
	const backgroundToEquirect = new UITexture(editor)
		.setMarginLeft("8px")
		.onChange(onBackgroundChanged)
		.setDisplay("none");
	backgroundRow.add(backgroundToEquirect);

	container.add(backgroundRow);

	// background valeurs GroundProjectedSkybox
	const projBackground = new UIRow().setDisplay("none").setMarginLeft("90px");

	projBackground.add(new UIText("height: "));

	const backgroundProjectedSkyboxHeight = new UINumber(50)
		.setWidth("40px")
		.setRange(5, 100)
		.onChange(onBackgroundChanged);

	// add backgroundSkyboxHeight to bgToEquirect
	projBackground.add(backgroundProjectedSkyboxHeight);

	projBackground.add(new UIText("radius: "));

	const backgroundProjectedSkyboxRadius = new UINumber(150)
		.setWidth("40px")
		.setRange(100, 200)
		.onChange(onBackgroundChanged);

	// add backgroundSkyboxRadius to bgToEquirect
	projBackground.add(backgroundProjectedSkyboxRadius);

	projBackground.add(new UIText("scale: "));

	const backgroundProjectedSkyboxScale = new UINumber(30)
		.setWidth("40px")
		.setRange(0, 200)
		.onChange(onBackgroundChanged);
	projBackground.add(backgroundProjectedSkyboxScale);

	container.add(projBackground);
	backgroundEquirectRow.add(new UIText("Blurriness: "));

	const backgroundBlurriness = new UINumber(0)
		.setWidth("70px")
		.setRange(0, 1)
		.onChange(onBackgroundChanged);
	backgroundEquirectRow.add(backgroundBlurriness);

	backgroundEquirectRow.add(new UIText("Intensity: "));

	const backgroundIntensity = new UINumber(1)
		.setWidth("70px")
		.setRange(0, Infinity)
		.onChange(onBackgroundChanged);
	backgroundEquirectRow.add(backgroundIntensity);

	container.add(backgroundEquirectRow);
	// checkbox environment === background
	const checkboxSyncBackEnv = new UIBoolean(editor.config.getKey("Sync HDRIs"));
	container.add(checkboxSyncBackEnv);

	function onBackgroundChanged() {
		signals.sceneBackgroundChanged.dispatch(
			backgroundType.getValue(),
			backgroundColor.getHexValue(),
			backgroundTexture.getValue(),
			backgroundEquirectangularTexture.getValue(),
			backgroundBlurriness.getValue(),
			backgroundIntensity.getValue(),
			// add
			backgroundToEquirect.getValue(),
			backgroundProjectedSkyboxHeight.getValue(),
			backgroundProjectedSkyboxRadius.getValue(),
			backgroundProjectedSkyboxScale.getValue()
		);
		// background in the environment
		refreshBackEnv(checkboxSyncBackEnv.getValue(), "background");
		console.log(editor.scene);
		// refreshUI
	}

	function refreshBackgroundUI() {
		const type = backgroundType.getValue();

		backgroundType.setWidth(type === "None" ? "150px" : "110px");
		backgroundColor.setDisplay(type === "Color" ? "" : "none");
		backgroundTexture.setDisplay(type === "Texture" ? "" : "none");
		backgroundEquirectangularTexture.setDisplay(
			type === "Equirectangular" ? "" : "none"
		);
		backgroundEquirectRow.setDisplay(type === "Equirectangular" ? "" : "none");

		// add me
		backgroundToEquirect.setDisplay(
			type === "ProjectedBackground" ? "" : "none"
		);
		projBackground.setDisplay(type === "ProjectedBackground" ? "" : "none");
	}

	// --------------------------------------------------environment--------------------------------------------------

	const environmentRow = new UIRow();

	const environmentType = new UISelect()
		.setOptions({
			None: "None",
			Equirectangular: "Equirect",
			ModelViewer: "ModelViewer",
		})
		.setWidth("150px");
	environmentType.setValue("None");
	environmentType.onChange(function () {
		onEnvironmentChanged();
		refreshEnvironmentUI();
	});

	environmentRow.add(
		new UIText(strings.getKey("sidebar/scene/environment")).setWidth("90px")
	);
	environmentRow.add(environmentType);

	// environment canvas

	const environmentEquirectangularTexture = new UITexture(editor)
		.setMarginLeft("8px")
		.onChange(onEnvironmentChanged)
		.setDisplay("none");
	environmentRow.add(environmentEquirectangularTexture);

	container.add(environmentRow);

	function onEnvironmentChanged() {
		signals.sceneEnvironmentChanged.dispatch(
			environmentType.getValue(),
			environmentEquirectangularTexture.getValue()
		);
		// environment  in the background
		refreshBackEnv(checkboxSyncBackEnv.getValue(), "environment");
	}

	function refreshEnvironmentUI() {
		const type = environmentType.getValue();

		environmentType.setWidth(type !== "Equirectangular" ? "150px" : "110px");
		environmentEquirectangularTexture.setDisplay(
			type === "Equirectangular" ? "" : "none"
		);
	}

	const refreshBackEnv = (valueOfCheckbox, selectChoice) => {
		if (valueOfCheckbox === true) {
			if (
				selectChoice === "background" &&
				backgroundType.getValue() != "Texture"
			) {
				if (backgroundType.getValue() === "Equirectangular") {
					editor.scene.environment = backgroundEquirectangularTexture.texture;
					backgroundEquirectangularTexture.setValue(
						backgroundEquirectangularTexture.texture
					);
					environmentEquirectangularTexture.setValue(
						backgroundEquirectangularTexture.texture
					);
				} else {
					editor.scene.environment = backgroundToEquirect.texture;
					backgroundEquirectangularTexture.setValue(
						backgroundToEquirect.texture
					);
					environmentEquirectangularTexture.setValue(
						backgroundToEquirect.texture
					);
				}
				backgroundToEquirect.setValue(editor.scene.environment);
				editor.scene.environment != null &&
					environmentType.setValue("Equirectangular");
			} else if (
				selectChoice === "environment" &&
				environmentType.getValue() === "Equirectangular"
			) {
				backgroundToEquirect.setValue(editor.scene.environment);
				backgroundEquirectangularTexture.setValue(editor.scene.environment);
				onBackgroundChanged();
			}
		}
		refreshEnvironmentUI();
		refreshBackgroundUI();
	};

	// sync Background and Environment equirect text
	checkboxSyncBackEnv.add(new UIText("Sync HDRIs"));

	container.add(checkboxSyncBackEnv);

	// ------------------------------------------------------fog------------------------------------------------------

	function onFogChanged() {
		signals.sceneFogChanged.dispatch(
			fogType.getValue(),
			fogColor.getHexValue(),
			fogNear.getValue(),
			fogFar.getValue(),
			fogDensity.getValue()
		);
	}

	function onFogSettingsChanged() {
		signals.sceneFogSettingsChanged.dispatch(
			fogType.getValue(),
			fogColor.getHexValue(),
			fogNear.getValue(),
			fogFar.getValue(),
			fogDensity.getValue()
		);
	}

	const fogTypeRow = new UIRow();
	const fogType = new UISelect()
		.setOptions({
			None: "None",
			Fog: "Linear",
			FogExp2: "Exponential",
		})
		.setWidth("150px");
	fogType.onChange(function () {
		onFogChanged();
		refreshFogUI();
	});

	fogTypeRow.add(
		new UIText(strings.getKey("sidebar/scene/fog")).setWidth("90px")
	);
	fogTypeRow.add(fogType);

	container.add(fogTypeRow);

	// fog color

	const fogPropertiesRow = new UIRow();
	fogPropertiesRow.setDisplay("none");
	fogPropertiesRow.setMarginLeft("90px");
	container.add(fogPropertiesRow);

	const fogColor = new UIColor().setValue("#aaaaaa");
	fogColor.onInput(onFogSettingsChanged);
	fogPropertiesRow.add(fogColor);

	// fog near

	const fogNear = new UINumber(0.1)
		.setWidth("40px")
		.setRange(0, Infinity)
		.onChange(onFogSettingsChanged);
	fogPropertiesRow.add(fogNear);

	// fog far

	const fogFar = new UINumber(50)
		.setWidth("40px")
		.setRange(0, Infinity)
		.onChange(onFogSettingsChanged);
	fogPropertiesRow.add(fogFar);

	// fog density

	const fogDensity = new UINumber(0.05)
		.setWidth("40px")
		.setRange(0, 0.1)
		.setStep(0.001)
		.setPrecision(3)
		.onChange(onFogSettingsChanged);
	fogPropertiesRow.add(fogDensity);

	//

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

		// outliner.setOptions(options);

		// if (editor.selected !== null) {
		// 	outliner.setValue(editor.selected.id);
		// }
		if (scene.background) {
			if (scene.background.isColor) {
				backgroundType.setValue("Color");
				backgroundColor.setHexValue(scene.background.getHex());
			}
			if (scene.background.isTexture) {
				if (
					scene.background.mapping === THREE.EquirectangularReflectionMapping
				) {
					backgroundType.setValue("Equirectangular");
					backgroundEquirectangularTexture.setValue(scene.background);
					backgroundBlurriness.setValue(scene.backgroundBlurriness);
					backgroundIntensity.setValue(scene.backgroundIntensity);
				} else {
					backgroundType.setValue("Texture");
					backgroundTexture.setValue(scene.background);
				}
			}
		} else if (backgroundType.getValue() === "ProjectedBackground") {
			backgroundType.setValue("ProjectedBackground");
			backgroundToEquirect.setValue(scene.environment);
			backgroundProjectedSkyboxScale.setValue(
				scene.backgroundProjectedSkyboxScale
			);
			backgroundProjectedSkyboxHeight.setValue(scene.backgroundSkyboxHeight);
			backgroundProjectedSkyboxRadius.setValue(scene.backgroundSkyboxRadius);
		} else {
			backgroundType.setValue("None");
		}

		if (scene.environment) {
			if (
				scene.environment.mapping === THREE.EquirectangularReflectionMapping ||
				checkboxSyncBackEnv.getValue() === true
			) {
				environmentType.setValue("Equirectangular");
				environmentEquirectangularTexture.setValue(scene.environment);
			} else if (scene.environment.isRenderTargetTexture === true) {
				environmentType.setValue("ModelViewer");
			}
		} else {
			environmentType.setValue("None");
		}

		if (scene.fog) {
			fogColor.setHexValue(scene.fog.color.getHex());

			if (scene.fog.isFog) {
				fogType.setValue("Fog");
				fogNear.setValue(scene.fog.near);
				fogFar.setValue(scene.fog.far);
			} else if (scene.fog.isFogExp2) {
				fogType.setValue("FogExp2");
				fogDensity.setValue(scene.fog.density);
			}
		} else {
			fogType.setValue("None");
		}

		refreshBackgroundUI();
		refreshEnvironmentUI();
		refreshFogUI();
	}

	function refreshFogUI() {
		const type = fogType.getValue();

		fogPropertiesRow.setDisplay(type === "None" ? "none" : "");
		fogNear.setDisplay(type === "Fog" ? "" : "none");
		fogFar.setDisplay(type === "Fog" ? "" : "none");
		fogDensity.setDisplay(type === "FogExp2" ? "" : "none");
	}

	refreshUI();

	// events

	signals.editorCleared.add(refreshUI);

	signals.sceneGraphChanged.add(refreshUI);

	signals.refreshSidebarEnvironment.add(refreshUI);

	/*
	signals.objectChanged.add( function ( object ) {

		let options = outliner.options;

		for ( let i = 0; i < options.length; i ++ ) {

			let option = options[ i ];

			if ( option.value === object.id ) {

				option.innerHTML = buildHTML( object );
				return;

			}

		}

	} );
	*/

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

			// outliner.setValue(object.id);
		}
		// } else {
		// 	outliner.setValue(null);
		// }
	});

	return container;
}

export { SidebarScene };
