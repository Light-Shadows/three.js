import * as THREE from 'three';

import { UINumber, UIPanel, UIRow, UISelect, UIText } from './libs/ui.js';
import { UIBoolean } from './libs/ui.three.js';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, ToneMappingEffect, VignetteEffect } from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

function SidebarProjectRenderer( editor ) {

	const config = editor.config;
	const signals = editor.signals;
	const strings = editor.strings;

	let currentRenderer = null;
	let currentComposer = null;

	let currentRenderPass = null;
	let currentToneMappingEffect = null;
	let currentN8aoPass = null;
	let currentBloomEffect = null;
	let currentVignetteEffect = null;
	let currentSMAAEffect = null;

	const container = new UIPanel();

	const headerRow = new UIRow();
	headerRow.add( new UIText( strings.getKey( 'sidebar/project/renderer' ).toUpperCase() ) );
	container.add( headerRow );

	// Multisampling

	const multisamplingRow = new UIRow();
	container.add( multisamplingRow );

	multisamplingRow.add( new UIText( strings.getKey( 'sidebar/project/multisampling' ) ).setWidth( '90px' ) );

	const multisampling = new UINumber( config.getKey( 'project/renderer/multisampling' ) ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setStep( 1 ).setRange( 0, Infinity ).onChange( updateMultisampling );
	multisamplingRow.add( multisampling );

	function updateMultisampling() {

		currentComposer.multisampling = parseInt( multisampling.getValue() );

		signals.rendererUpdated.dispatch();

	}

	// SMAA

	const smaaHeader = new UIRow();
	container.add( smaaHeader );

	smaaHeader.add( new UIText( strings.getKey( 'sidebar/project/smaa' ).toUpperCase() ).setWidth( '90px' ) );

	const smaaBoolean = new UIBoolean( config.getKey( 'project/renderer/smaa' ) ).onChange( createRenderer );
	smaaHeader.add( smaaBoolean );

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

	const toneMappingContainer = new UIPanel();
	const toneMappingRows = [];

	const toneMappingHeader = new UIRow();
	toneMappingContainer.add( toneMappingHeader );

	toneMappingHeader.add( new UIText( strings.getKey( 'sidebar/project/toneMapping' ).toUpperCase() ).setWidth( '90px' ) );

	const toneMappingBoolean = new UIBoolean( config.getKey( 'project/renderer/toneMapping' ) ).onChange( () => enableRows( toneMappingRows, toneMappingBoolean.getValue(), createRenderer ) );
	toneMappingHeader.add( toneMappingBoolean );

	const toneMappingModeRow = new UIRow();
	toneMappingContainer.add( toneMappingModeRow );
	toneMappingRows.push( toneMappingModeRow );

	toneMappingModeRow.add( new UIText( strings.getKey( 'sidebar/project/toneMappingMode' ) ).setWidth( '90px' ) );

	const toneMappingMode = new UISelect().setOptions( {
		0: 'REINHARD', // REINHARD
		1: 'REINHARD 2', // REINHARD2
		2: 'REINHARD 2 ADAPTIVE', // REINHARD2_ADAPTIVE
		3: 'CINEON', // OPTIMIZED_CINEON
		4: 'ACES FILMIC', // ACES_FILMIC
		5: 'UNCHARTED 2' // UNCHARTED2
	} ).setWidth( '120px' ).onChange( updateToneMapping );
	toneMappingMode.setValue( config.getKey( 'project/renderer/toneMappingMode' ) );
	toneMappingModeRow.add( toneMappingMode );

	const toneMappingExposureRow = new UIRow();
	toneMappingContainer.add( toneMappingExposureRow );
	toneMappingRows.push( toneMappingExposureRow );

	toneMappingExposureRow.add( new UIText( strings.getKey( 'sidebar/project/toneMappingExposure' ) ).setWidth( '90px' ) );

	const toneMappingExposure = new UINumber( config.getKey( 'project/renderer/toneMappingExposure' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateToneMapping );
	toneMappingExposureRow.add( toneMappingExposure );

	const toneMappingMiddleGreyRow = new UIRow();
	toneMappingContainer.add( toneMappingMiddleGreyRow );
	toneMappingRows.push( toneMappingMiddleGreyRow );

	toneMappingMiddleGreyRow.add( new UIText( strings.getKey( 'sidebar/project/toneMappingMiddleGrey' ) ).setWidth( '90px' ) );

	const toneMappingMiddleGrey = new UINumber( config.getKey( 'project/renderer/toneMappingMiddleGrey' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateToneMapping );
	toneMappingMiddleGreyRow.add( toneMappingMiddleGrey );

	const toneMappingWhitePointRow = new UIRow();
	toneMappingContainer.add( toneMappingWhitePointRow );
	toneMappingRows.push( toneMappingWhitePointRow );

	toneMappingWhitePointRow.add( new UIText( strings.getKey( 'sidebar/project/toneMappingWhitePoint' ) ).setWidth( '90px' ) );

	const toneMappingWhitePoint = new UINumber( config.getKey( 'project/renderer/toneMappingWhitePoint' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateToneMapping );
	toneMappingWhitePointRow.add( toneMappingWhitePoint );

	const toneMappingAverageLuminanceRow = new UIRow();
	toneMappingContainer.add( toneMappingAverageLuminanceRow );
	toneMappingRows.push( toneMappingAverageLuminanceRow );

	toneMappingAverageLuminanceRow.add( new UIText( strings.getKey( 'sidebar/project/toneMappingAverageLuminance' ) ).setWidth( '90px' ) );

	const toneMappingAverageLuminance = new UINumber( config.getKey( 'project/renderer/toneMappingAverageLuminance' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateToneMapping );
	toneMappingAverageLuminanceRow.add( toneMappingAverageLuminance );

	function updateToneMapping() {

		currentToneMappingEffect.mode = parseInt( toneMappingMode.getValue() );
		currentRenderer.toneMappingExposure = parseFloat( toneMappingExposure.getValue() );
		currentToneMappingEffect.middleGrey = parseFloat( toneMappingMiddleGrey.getValue() );
		currentToneMappingEffect.whitePoint = parseFloat( toneMappingWhitePoint.getValue() );
		currentToneMappingEffect.averageLuminance = parseFloat( toneMappingAverageLuminance.getValue() );

		signals.rendererUpdated.dispatch();

	}

	container.add( toneMappingContainer );

	// Bloom

	const bloomContainer = new UIPanel();
	const bloomRows = [];

	const bloomHeader = new UIRow();
	bloomContainer.add( bloomHeader );

	bloomHeader.add( new UIText( strings.getKey( 'sidebar/project/bloom' ).toUpperCase() ).setWidth( '90px' ) );

	const bloomBoolean = new UIBoolean( config.getKey( 'project/renderer/bloom' ) ).onChange( () => enableRows( bloomRows, bloomBoolean.getValue(), createRenderer ) );
	bloomHeader.add( bloomBoolean );

	const bloomIntensityRow = new UIRow().setDisplay( bloomBoolean.getValue() ? '' : 'none' );
	bloomContainer.add( bloomIntensityRow );
	bloomRows.push( bloomIntensityRow );

	bloomIntensityRow.add( new UIText( strings.getKey( 'sidebar/project/bloomIntensity' ) ).setWidth( '90px' ) );

	const bloomIntensity = new UINumber( config.getKey( 'project/renderer/bloomIntensity' ) ).setWidth( '30px' ).setRange( 0, 1 ).onChange( updateBloom );
	bloomIntensityRow.add( bloomIntensity );

	const bloomThresholdRow = new UIRow().setDisplay( bloomBoolean.getValue() ? '' : 'none' );
	bloomContainer.add( bloomThresholdRow );
	bloomRows.push( bloomThresholdRow );

	bloomThresholdRow.add( new UIText( strings.getKey( 'sidebar/project/bloomThreshold' ) ).setWidth( '90px' ) );

	const bloomThreshold = new UINumber( config.getKey( 'project/renderer/bloomThreshold' ) ).setWidth( '30px' ).setRange( 0, 1 ).onChange( updateBloom );
	bloomThresholdRow.add( bloomThreshold );

	const bloomSmoothingRow = new UIRow().setDisplay( bloomBoolean.getValue() ? '' : 'none' );
	bloomContainer.add( bloomSmoothingRow );
	bloomRows.push( bloomSmoothingRow );

	bloomSmoothingRow.add( new UIText( strings.getKey( 'sidebar/project/bloomSmoothing' ) ).setWidth( '90px' ) );

	const bloomSmoothing = new UINumber( config.getKey( 'project/renderer/bloomSmoothing' ) ).setWidth( '30px' ).setRange( 0, 1 ).onChange( updateBloom );
	bloomSmoothingRow.add( bloomSmoothing );

	function updateBloom() {

		currentBloomEffect.intensity = parseFloat( bloomIntensity.getValue() );
		currentBloomEffect.luminanceMaterial.threshold = parseFloat( bloomThreshold.getValue() );
		currentBloomEffect.luminanceMaterial.smoothing = parseFloat( bloomSmoothing.getValue() );

		signals.rendererUpdated.dispatch();

	}

	container.add( bloomContainer );

	// Vignette

	const vignetteContainer = new UIPanel();
	const vignetteRows = [];

	const vignetteHeader = new UIRow();
	vignetteContainer.add( vignetteHeader );

	vignetteHeader.add( new UIText( strings.getKey( 'sidebar/project/vignette' ).toUpperCase() ).setWidth( '90px' ) );

	const vignetteBoolean = new UIBoolean( config.getKey( 'project/renderer/vignette' ) ).onChange( () => enableRows( vignetteRows, vignetteBoolean.getValue(), createRenderer ) );
	vignetteHeader.add( vignetteBoolean );

	const vignetteOffsetRow = new UIRow().setDisplay( vignetteBoolean.getValue() ? '' : 'none' );
	vignetteContainer.add( vignetteOffsetRow );
	vignetteRows.push( vignetteOffsetRow );

	vignetteOffsetRow.add( new UIText( strings.getKey( 'sidebar/project/vignetteOffset' ) ).setWidth( '90px' ) );

	const vignetteOffset = new UINumber( config.getKey( 'project/renderer/vignetteOffset' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateVignette );
	vignetteOffsetRow.add( vignetteOffset );

	const vignetteDarknessRow = new UIRow().setDisplay( vignetteBoolean.getValue() ? '' : 'none' );
	vignetteContainer.add( vignetteDarknessRow );
	vignetteRows.push( vignetteDarknessRow );

	vignetteDarknessRow.add( new UIText( strings.getKey( 'sidebar/project/vignetteDarkness' ) ).setWidth( '90px' ) );

	const vignetteDarkness = new UINumber( config.getKey( 'project/renderer/vignetteDarkness' ) ).setWidth( '30px' ).setRange( 0, 1 ).onChange( updateVignette );
	vignetteDarknessRow.add( vignetteDarkness );

	const vignetteEskilRow = new UIRow().setDisplay( vignetteBoolean.getValue() ? '' : 'none' );
	vignetteContainer.add( vignetteEskilRow );
	vignetteRows.push( vignetteEskilRow );

	vignetteEskilRow.add( new UIText( strings.getKey( 'sidebar/project/vignetteEskil' ) ).setWidth( '90px' ) );

	const vignetteEskil = new UIBoolean( config.getKey( 'project/renderer/vignetteEskil' ) ).onChange( updateVignette );
	vignetteEskilRow.add( vignetteEskil );

	function updateVignette() {

		currentVignetteEffect.offset = parseFloat( vignetteOffset.getValue() );
		currentVignetteEffect.darkness = parseFloat( vignetteDarkness.getValue() );
		currentVignetteEffect.eskil = vignetteEskil.getValue();

		signals.rendererUpdated.dispatch();

	}

	container.add( vignetteContainer );

	// N8AO

	const n8aoContainer = new UIPanel();
	const n8aoRows = [];

	const n8aoHeader = new UIRow();
	n8aoContainer.add( n8aoHeader );

	n8aoHeader.add( new UIText( strings.getKey( 'sidebar/project/n8ao' ).toUpperCase() ).setWidth( '90px' ) );

	const n8aoBoolean = new UIBoolean( config.getKey( 'project/renderer/n8ao' ) ).onChange( () => enableRows( n8aoRows, n8aoBoolean.getValue(), createRenderer ) );
	n8aoHeader.add( n8aoBoolean );

	const n8aoRadiusRow = new UIRow().setDisplay( n8aoBoolean.getValue() ? '' : 'none' );
	n8aoContainer.add( n8aoRadiusRow );
	n8aoRows.push( n8aoRadiusRow );

	n8aoRadiusRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoRadius' ) ).setWidth( '90px' ) );

	const n8aoRadius = new UINumber( config.getKey( 'project/renderer/n8aoRadius' ) ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setStep( 10 ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoRadiusRow.add( n8aoRadius );

	const n8aoDistanceFalloffRow = new UIRow().setDisplay( n8aoBoolean.getValue() ? '' : 'none' );
	n8aoContainer.add( n8aoDistanceFalloffRow );
	n8aoRows.push( n8aoDistanceFalloffRow );

	n8aoDistanceFalloffRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoDistanceFalloff' ) ).setWidth( '90px' ) );

	const n8aoDistanceFalloff = new UINumber( config.getKey( 'project/renderer/n8aoFalloff' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoDistanceFalloffRow.add( n8aoDistanceFalloff );

	const n8aoIntensityRow = new UIRow().setDisplay( n8aoBoolean.getValue() ? '' : 'none' );
	n8aoContainer.add( n8aoIntensityRow );
	n8aoRows.push( n8aoIntensityRow );

	n8aoIntensityRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoIntensity' ) ).setWidth( '90px' ) );

	const n8aoIntensity = new UINumber( config.getKey( 'project/renderer/n8aoIntensity' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoIntensityRow.add( n8aoIntensity );

	const n8aoAOSamplesRow = new UIRow().setDisplay( n8aoBoolean.getValue() ? '' : 'none' );
	n8aoContainer.add( n8aoAOSamplesRow );
	n8aoRows.push( n8aoAOSamplesRow );

	n8aoAOSamplesRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoAOSamples' ) ).setWidth( '90px' ) );

	const n8aoAOSamples = new UINumber( config.getKey( 'project/renderer/n8aoAOSamples' ) ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoAOSamplesRow.add( n8aoAOSamples );

	const n8aoDenoiseSamplesRow = new UIRow().setDisplay( n8aoBoolean.getValue() ? '' : 'none' );
	n8aoContainer.add( n8aoDenoiseSamplesRow );
	n8aoRows.push( n8aoDenoiseSamplesRow );

	n8aoDenoiseSamplesRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoDenoiseSamples' ) ).setWidth( '90px' ) );

	const n8aoDenoiseSamples = new UINumber( config.getKey( 'project/renderer/n8aoDenoiseSamples' ) ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoDenoiseSamplesRow.add( n8aoDenoiseSamples );

	const n8aoDenoiseRadiusRow = new UIRow().setDisplay( n8aoBoolean.getValue() ? '' : 'none' );
	n8aoContainer.add( n8aoDenoiseRadiusRow );
	n8aoRows.push( n8aoDenoiseRadiusRow );

	n8aoDenoiseRadiusRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoDenoiseRadius' ) ).setWidth( '90px' ) );

	const n8aoDenoiseRadius = new UINumber( config.getKey( 'project/renderer/n8aoDenoiseRadius' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateN8AO );
	n8aoDenoiseRadiusRow.add( n8aoDenoiseRadius );

	function updateN8AO() {

		currentN8aoPass.configuration.aoRadius = parseInt( n8aoRadius.getValue() );
		currentN8aoPass.configuration.distanceFalloff = parseFloat( n8aoDistanceFalloff.getValue() );
		currentN8aoPass.configuration.intensity = parseFloat( n8aoIntensity.getValue() );
		currentN8aoPass.configuration.aoSamples = parseInt( n8aoAOSamples.getValue() );
		currentN8aoPass.configuration.denoiseSamples = parseInt( n8aoDenoiseSamples.getValue() );
		currentN8aoPass.configuration.denoiseRadius = parseFloat( n8aoDenoiseRadius.getValue() );

		signals.rendererUpdated.dispatch();

	}

	container.add( n8aoContainer );

	//

	function enableRows( rows, enabled, thenFunc ) {

		if ( enabled ) {

			rows.forEach( function ( row ) {

				row.setDisplay( '' );

			} );

		} else {

			rows.forEach( function ( row ) {

				row.setDisplay( 'none' );

			} );

		}

		thenFunc();

	}

	function createRenderer() {

		currentRenderer = new THREE.WebGLRenderer( {
			powerPreference: 'high-performance',
			antialias: false,
			stencil: false,
			depth: true, // ! n8aoBoolean.getValue(),
			toneMapping: THREE.NoToneMapping,
			toneMappingExposure: parseFloat( toneMappingExposure.getValue() )
		} );
		currentRenderer.shadowMap.enabled = shadowsBoolean.getValue();
		currentRenderer.shadowMap.type = parseFloat( shadowTypeSelect.getValue() );

		currentComposer = new EffectComposer( currentRenderer, {
			multisampling: parseInt( multisampling.getValue() )
		} );

		currentRenderPass = new RenderPass( editor.scene, editor.camera );
		currentComposer.addPass( currentRenderPass );

		// N8AO

		if ( n8aoBoolean.getValue() ) {

			currentN8aoPass = new N8AOPostPass( editor.scene, editor.camera );

			currentN8aoPass.configuration.aoRadius = parseInt( n8aoRadius.getValue() );
			currentN8aoPass.configuration.distanceFalloff = parseFloat( n8aoDistanceFalloff.getValue() );
			currentN8aoPass.configuration.intensity = parseFloat( n8aoIntensity.getValue() );
			currentN8aoPass.configuration.screenSpaceRadius = true;
			currentN8aoPass.configuration.aoSamples = parseInt( n8aoAOSamples.getValue() );
			currentN8aoPass.configuration.denoiseSamples = parseInt( n8aoDenoiseSamples.getValue() );
			currentN8aoPass.configuration.denoiseRadius = parseFloat( n8aoDenoiseRadius.getValue() );

			currentComposer.addPass( currentN8aoPass );

		} else {

			currentN8aoPass = null;

		}

		// Bloom

		if ( bloomBoolean.getValue() ) {

			currentBloomEffect = new BloomEffect( {
				intensity: parseFloat( bloomIntensity.getValue() ),
				luminanceThreshold: parseFloat( bloomThreshold.getValue() ),
				luminanceSmoothing: parseFloat( bloomSmoothing.getValue() )
			} );
			currentComposer.addPass( new EffectPass( editor.camera, currentBloomEffect ) );

		} else {

			currentBloomEffect = null;

		}

		// SMAA

		if ( smaaBoolean.getValue() ) {

			currentSMAAEffect = new SMAAEffect();
			currentComposer.addPass( new EffectPass( editor.camera, currentSMAAEffect ) );

		} else {

			currentSMAAEffect = null;

		}

		// ToneMapping

		if ( toneMappingBoolean.getValue() ) {

			currentToneMappingEffect = new ToneMappingEffect( {
				mode: parseInt( toneMappingMode.getValue() ),
				middleGrey: parseFloat( toneMappingMiddleGrey.getValue() ),
				maxLuminance: parseFloat( toneMappingWhitePoint.getValue() ),
				averageLuminance: parseFloat( toneMappingAverageLuminance.getValue() )
			} );
			currentComposer.addPass( new EffectPass( editor.camera, currentToneMappingEffect ) );

		} else {

			currentToneMappingEffect = null;

		}

		// Vignette

		if ( vignetteBoolean.getValue() ) {

			currentVignetteEffect = new VignetteEffect( {
				offset: parseFloat( vignetteOffset.getValue() ),
				darkness: parseFloat( vignetteDarkness.getValue() ),
				eskil: vignetteEskil.getValue()
			} );
			currentComposer.addPass( new EffectPass( editor.camera, currentVignetteEffect ) );

		} else {

			currentVignetteEffect = null;

		}

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
		toneMappingMode.setValue( currentRenderer.toneMapping );

		signals.rendererUpdated.dispatch();

	} );

	signals.rendererUpdated.add( function () {

		config.setKey(
			'project/renderer/multisampling', parseInt( multisampling.getValue() ),

			'project/renderer/shadows', shadowsBoolean.getValue(),
			'project/renderer/shadowType', parseFloat( shadowTypeSelect.getValue() ),

			'project/renderer/toneMapping', toneMappingBoolean.getValue(),
			'project/renderer/toneMappingExposure', 1.0,
			'project/renderer/toneMappingMode', parseInt( toneMappingMode.getValue() ),
			'project/renderer/toneMappingMiddleGrey', parseFloat( toneMappingMiddleGrey.getValue() ),
			'project/renderer/toneMappingWhitePoint', parseFloat( toneMappingWhitePoint.getValue() ),
			'project/renderer/toneMappingAverageLuminance', parseFloat( toneMappingAverageLuminance.getValue() ),

			'project/renderer/bloom', bloomBoolean.getValue(),
			'project/renderer/bloomIntensity', parseFloat( bloomIntensity.getValue() ),
			'project/renderer/bloomThreshold', parseFloat( bloomThreshold.getValue() ),
			'project/renderer/bloomSmoothing', parseFloat( bloomSmoothing.getValue() ),

			'project/renderer/vignette', vignetteBoolean.getValue(),
			'project/renderer/vignetteOffset', parseFloat( vignetteOffset.getValue() ),
			'project/renderer/vignetteDarkness', parseFloat( vignetteDarkness.getValue() ),
			'project/renderer/vignetteEskil', vignetteEskil.getValue(),

			'project/renderer/n8ao', n8aoBoolean.getValue(),
			'project/renderer/n8aoRadius', parseInt( n8aoRadius.getValue() ),
			'project/renderer/n8aoFalloff', parseFloat( n8aoDistanceFalloff.getValue() ),
			'project/renderer/n8aoIntensity', parseFloat( n8aoIntensity.getValue() ),
			'project/renderer/n8aoAOSamples', parseInt( n8aoAOSamples.getValue() ),
			'project/renderer/n8aoDenoiseSamples', parseInt( n8aoDenoiseSamples.getValue() ),
			'project/renderer/n8aoDenoiseRadius', parseFloat( n8aoDenoiseRadius.getValue() ),

			'project/renderer/smaa', smaaBoolean.getValue()
		);

	} );

	return container;

}

export { SidebarProjectRenderer };
