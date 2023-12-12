import * as THREE from 'three';

import { UINumber, UIPanel, UIRow, UISelect, UIText } from './libs/ui.js';
import { UIBoolean } from './libs/ui.three.js';
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

function SidebarProjectRenderer( editor ) {

	const config = editor.config;
	const signals = editor.signals;
	const strings = editor.strings;

	let currentRenderer = null;
	let currentComposer = null;

	let currentRenderPass = null;
	let currentN8aoPass = null;
	let currentBloomEffect = null;

	const container = new UIPanel();

	const headerRow = new UIRow();
	headerRow.add( new UIText( strings.getKey( 'sidebar/project/renderer' ).toUpperCase() ) );
	container.add( headerRow );

	// Antialias

	const antialiasRow = new UIRow();
	container.add( antialiasRow );

	antialiasRow.add( new UIText( strings.getKey( 'sidebar/project/antialias' ) ).setWidth( '90px' ) );

	const antialiasBoolean = new UIBoolean( config.getKey( 'project/renderer/antialias' ) ).onChange( createRenderer );
	antialiasRow.add( antialiasBoolean );

	// Shadows

	const shadowsRow = new UIRow();
	container.add( shadowsRow );

	shadowsRow.add( new UIText( strings.getKey( 'sidebar/project/shadows' ) ).setWidth( '90px' ) );

	const shadowsBoolean = new UIBoolean( config.getKey( 'project/renderer/shadows' ) ).onChange( updateShadows );
	shadowsRow.add( shadowsBoolean );

	const shadowTypeSelect = new UISelect().setOptions( {
		0: 'Basic',
		1: 'PCF',
		2: 'PCF Soft',
		//	3: 'VSM'
	} ).setWidth( '125px' ).onChange( updateShadows );
	shadowTypeSelect.setValue( config.getKey( 'project/renderer/shadowType' ) );
	shadowsRow.add( shadowTypeSelect );

	function updateShadows() {

		currentRenderer.shadowMap.enabled = shadowsBoolean.getValue();
		currentRenderer.shadowMap.type = parseFloat( shadowTypeSelect.getValue() );

		signals.rendererUpdated.dispatch();

	}

	// Tonemapping

	const toneMappingRow = new UIRow();
	container.add( toneMappingRow );

	toneMappingRow.add( new UIText( strings.getKey( 'sidebar/project/toneMapping' ) ).setWidth( '90px' ) );

	const toneMappingSelect = new UISelect().setOptions( {
		0: 'No',
		1: 'Linear',
		2: 'Reinhard',
		3: 'Cineon',
		4: 'ACESFilmic'
	} ).setWidth( '120px' ).onChange( updateToneMapping );
	toneMappingSelect.setValue( config.getKey( 'project/renderer/toneMapping' ) );
	toneMappingRow.add( toneMappingSelect );

	const toneMappingExposure = new UINumber( config.getKey( 'project/renderer/toneMappingExposure' ) );
	toneMappingExposure.setDisplay( toneMappingSelect.getValue() === '0' ? 'none' : '' );
	toneMappingExposure.setWidth( '30px' ).setMarginLeft( '10px' );
	toneMappingExposure.setRange( 0, 10 );
	toneMappingExposure.onChange( updateToneMapping );
	toneMappingRow.add( toneMappingExposure );

	function updateToneMapping() {

		toneMappingExposure.setDisplay( toneMappingSelect.getValue() === '0' ? 'none' : '' );

		currentRenderer.toneMapping = parseFloat( toneMappingSelect.getValue() );
		currentRenderer.toneMappingExposure = toneMappingExposure.getValue();
		signals.rendererUpdated.dispatch();

	}

	// Bloom

	const bloomContainer = new UIPanel();

	const bloomHeader = new UIRow();
	bloomContainer.add( bloomHeader );

	bloomHeader.add( new UIText( strings.getKey( 'sidebar/project/bloom' ).toUpperCase() ) );

	const bloomIntensityRow = new UIRow();
	bloomContainer.add( bloomIntensityRow );

	bloomIntensityRow.add( new UIText( strings.getKey( 'sidebar/project/bloomIntensity' ) ).setWidth( '90px' ) );

	const bloomIntensity = new UINumber( 0.1 ).setWidth( '30px' ).setRange( 0, 1 ).onChange( updateBloom );
	bloomIntensityRow.add( bloomIntensity );

	const bloomThresholdRow = new UIRow();
	bloomContainer.add( bloomThresholdRow );

	bloomThresholdRow.add( new UIText( strings.getKey( 'sidebar/project/bloomThreshold' ) ).setWidth( '90px' ) );

	const bloomThreshold = new UINumber( 0.15 ).setWidth( '30px' ).setRange( 0, 1 ).onChange( updateBloom );
	bloomThresholdRow.add( bloomThreshold );

	const bloomSmoothingRow = new UIRow();
	bloomContainer.add( bloomSmoothingRow );

	bloomSmoothingRow.add( new UIText( strings.getKey( 'sidebar/project/bloomSmoothing' ) ).setWidth( '90px' ) );

	const bloomSmoothing = new UINumber( 1 ).setWidth( '30px' ).setRange( 0, 1 ).onChange( updateBloom );
	bloomSmoothingRow.add( bloomSmoothing );

	function updateBloom() {

		currentBloomEffect.intensity = parseFloat( bloomIntensity.getValue() );
		currentBloomEffect.luminanceMaterial.threshold = parseFloat( bloomThreshold.getValue() );
		currentBloomEffect.luminanceMaterial.smoothing = parseFloat( bloomSmoothing.getValue() );
		signals.rendererUpdated.dispatch();

	}

	container.add( bloomContainer );

	// N8AO

	const n8aoContainer = new UIPanel();

	const n8aoHeader = new UIRow();
	n8aoContainer.add( n8aoHeader );

	n8aoHeader.add( new UIText( strings.getKey( 'sidebar/project/n8ao' ).toUpperCase() ) );

	const n8aoRadiusRow = new UIRow();
	n8aoContainer.add( n8aoRadiusRow );

	n8aoRadiusRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoRadius' ) ).setWidth( '90px' ) );

	const n8aoRadius = new UINumber( 100 ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setStep( 10 ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoRadiusRow.add( n8aoRadius );

	const n8aoDistanceFalloffRow = new UIRow();
	n8aoContainer.add( n8aoDistanceFalloffRow );

	n8aoDistanceFalloffRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoDistanceFalloff' ) ).setWidth( '90px' ) );

	const n8aoDistanceFalloff = new UINumber( 1 ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoDistanceFalloffRow.add( n8aoDistanceFalloff );

	const n8aoIntensityRow = new UIRow();
	n8aoContainer.add( n8aoIntensityRow );

	n8aoIntensityRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoIntensity' ) ).setWidth( '90px' ) );

	const n8aoIntensity = new UINumber( 3 ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoIntensityRow.add( n8aoIntensity );

	const n8aoScreenSpaceRadiusRow = new UIRow();
	n8aoContainer.add( n8aoScreenSpaceRadiusRow );

	n8aoScreenSpaceRadiusRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoScreenSpaceRadius' ) ).setWidth( '90px' ) );

	const n8aoScreenSpaceRadius = new UIBoolean( true ).onChange( updateN8AO );
	n8aoScreenSpaceRadiusRow.add( n8aoScreenSpaceRadius );

	const n8aoAOSamplesRow = new UIRow();
	n8aoContainer.add( n8aoAOSamplesRow );

	n8aoAOSamplesRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoAOSamples' ) ).setWidth( '90px' ) );

	const n8aoAOSamples = new UINumber( 64 ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoAOSamplesRow.add( n8aoAOSamples );

	const n8aoDenoiseSamplesRow = new UIRow();
	n8aoContainer.add( n8aoDenoiseSamplesRow );

	n8aoDenoiseSamplesRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoDenoiseSamples' ) ).setWidth( '90px' ) );

	const n8aoDenoiseSamples = new UINumber( 16 ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoDenoiseSamplesRow.add( n8aoDenoiseSamples );

	const n8aoDenoiseRadiusRow = new UIRow();
	n8aoContainer.add( n8aoDenoiseRadiusRow );

	n8aoDenoiseRadiusRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoDenoiseRadius' ) ).setWidth( '90px' ) );

	const n8aoDenoiseRadius = new UINumber( 6 ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoDenoiseRadiusRow.add( n8aoDenoiseRadius );

	function updateN8AO() {

		currentN8aoPass.configuration.aoRadius = parseFloat( n8aoRadius.getValue() );
		currentN8aoPass.configuration.distanceFalloff = parseFloat( n8aoDistanceFalloff.getValue() );
		currentN8aoPass.configuration.intensity = parseFloat( n8aoIntensity.getValue() );
		currentN8aoPass.configuration.screenSpaceRadius = n8aoScreenSpaceRadius.getValue();
		currentN8aoPass.configuration.aoSamples = parseFloat( n8aoAOSamples.getValue() );
		currentN8aoPass.configuration.denoiseSamples = parseFloat( n8aoDenoiseSamples.getValue() );
		currentN8aoPass.configuration.denoiseRadius = parseFloat( n8aoDenoiseRadius.getValue() );

		signals.rendererUpdated.dispatch();

	}

	container.add( n8aoContainer );

	//

	function createRenderer() {

		currentRenderer = new THREE.WebGLRenderer( {
			powerPreference: 'high-performance',
			antialias: false,
			stencil: false,
			depth: false
		} );
		currentRenderer.shadowMap.enabled = shadowsBoolean.getValue();
		currentRenderer.shadowMap.type = parseFloat( shadowTypeSelect.getValue() );
		currentRenderer.toneMapping = parseFloat( toneMappingSelect.getValue() );
		currentRenderer.toneMappingExposure = toneMappingExposure.getValue();

		currentComposer = new EffectComposer( currentRenderer );

		currentRenderPass = new RenderPass( editor.scene, editor.camera );
		currentComposer.addPass( currentRenderPass );

		currentN8aoPass = new N8AOPostPass( editor.scene, editor.camera );

		currentN8aoPass.configuration.aoRadius = parseFloat( n8aoRadius.getValue() );
		currentN8aoPass.configuration.distanceFalloff = parseFloat( n8aoDistanceFalloff.getValue() );
		currentN8aoPass.configuration.intensity = parseFloat( n8aoIntensity.getValue() );
		currentN8aoPass.configuration.screenSpaceRadius = n8aoScreenSpaceRadius.getValue();
		currentN8aoPass.configuration.aoSamples = parseFloat( n8aoAOSamples.getValue() );
		currentN8aoPass.configuration.denoiseSamples = parseFloat( n8aoDenoiseSamples.getValue() );
		currentN8aoPass.configuration.denoiseRadius = parseFloat( n8aoDenoiseRadius.getValue() );

		currentComposer.addPass( currentN8aoPass );

		currentBloomEffect = new BloomEffect( {
			intensity: parseFloat( bloomIntensity.getValue() ),
			luminanceThreshold: parseFloat( bloomThreshold.getValue() ),
			luminanceSmoothing: parseFloat( bloomSmoothing.getValue() )
		} );
		currentComposer.addPass( new EffectPass( editor.camera, currentBloomEffect ) );

		signals.rendererCreated.dispatch( currentRenderer, currentComposer );
		signals.rendererUpdated.dispatch();

	}

	createRenderer();


	// Signals

	signals.editorCleared.add( function () {

		currentRenderer.shadowMap.enabled = true;
		currentRenderer.shadowMap.type = THREE.PCFShadowMap;
		currentRenderer.toneMapping = THREE.NoToneMapping;
		currentRenderer.toneMappingExposure = 1;

		shadowsBoolean.setValue( currentRenderer.shadowMap.enabled );
		shadowTypeSelect.setValue( currentRenderer.shadowMap.type );
		toneMappingSelect.setValue( currentRenderer.toneMapping );
		toneMappingExposure.setValue( currentRenderer.toneMappingExposure );
		toneMappingExposure.setDisplay( currentRenderer.toneMapping === 0 ? 'none' : '' );

		signals.rendererUpdated.dispatch();

	} );

	signals.rendererUpdated.add( function () {

		config.setKey(
			'project/renderer/antialias', antialiasBoolean.getValue(),
			'project/renderer/shadows', shadowsBoolean.getValue(),
			'project/renderer/shadowType', parseFloat( shadowTypeSelect.getValue() ),
			'project/renderer/toneMapping', parseFloat( toneMappingSelect.getValue() ),
			'project/renderer/toneMappingExposure', toneMappingExposure.getValue()
		);

	} );

	return container;

}

export { SidebarProjectRenderer };
