import * as THREE from 'three';

import { UINumber, UIPanel, UIRow, UISelect, UIText } from './libs/ui.js';
import { UIBoolean } from './libs/ui.three.js';
import { BloomEffect, DepthOfFieldEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset, SSAOEffect, ToneMappingEffect } from 'postprocessing';
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
	let currentDOFEffect = null;
	let currentSSAOEffect = null;
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
		0: 'REINHARD', // REINHARD
		1: 'REINHARD 2', // REINHARD2
		2: 'REINHARD 2 ADAPTIVE', // REINHARD2_ADAPTIVE
		3: 'CINEON', // OPTIMIZED_CINEON
		4: 'ACES FILMIC', // ACES_FILMIC
		5: 'UNCHARTED 2' // UNCHARTED2
	} ).setWidth( '120px' ).onChange( updateToneMapping );
	toneMappingSelect.setValue( config.getKey( 'project/renderer/toneMapping' ) );
	toneMappingRow.add( toneMappingSelect );

	function updateToneMapping() {

		currentToneMappingEffect.mode = parseInt( toneMappingSelect.getValue() );

		signals.rendererUpdated.dispatch();

	}

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

	const n8aoScreenSpaceRadiusRow = new UIRow().setDisplay( n8aoBoolean.getValue() ? '' : 'none' );
	n8aoContainer.add( n8aoScreenSpaceRadiusRow );
	n8aoRows.push( n8aoScreenSpaceRadiusRow );

	n8aoScreenSpaceRadiusRow.add( new UIText( strings.getKey( 'sidebar/project/n8aoScreenSpaceRadius' ) ).setWidth( '90px' ) );

	const n8aoScreenSpaceRadius = new UIBoolean( config.getKey( 'project/renderer/n8aoSSRadius' ) ).onChange( updateN8AO );
	n8aoScreenSpaceRadiusRow.add( n8aoScreenSpaceRadius );

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
		currentN8aoPass.configuration.screenSpaceRadius = n8aoScreenSpaceRadius.getValue();
		currentN8aoPass.configuration.aoSamples = parseInt( n8aoAOSamples.getValue() );
		currentN8aoPass.configuration.denoiseSamples = parseInt( n8aoDenoiseSamples.getValue() );
		currentN8aoPass.configuration.denoiseRadius = parseFloat( n8aoDenoiseRadius.getValue() );

		signals.rendererUpdated.dispatch();

	}

	container.add( n8aoContainer );

	// DOF

	const dofContainer = new UIPanel();
	const dofRows = [];

	const dofHeader = new UIRow();
	dofContainer.add( dofHeader );

	dofHeader.add( new UIText( strings.getKey( 'sidebar/project/dof' ).toUpperCase() ).setWidth( '90px' ) );

	const dofBoolean = new UIBoolean( config.getKey( 'project/renderer/dof' ) ).onChange( () => enableRows( dofRows, dofBoolean.getValue(), createRenderer ) );
	dofHeader.add( dofBoolean );

	const dofFocusDistanceRow = new UIRow().setDisplay( dofBoolean.getValue() ? '' : 'none' );
	dofContainer.add( dofFocusDistanceRow );
	dofRows.push( dofFocusDistanceRow );

	dofFocusDistanceRow.add( new UIText( strings.getKey( 'sidebar/project/dofFocusDistance' ) ).setWidth( '90px' ) );

	const dofFocusDistance = new UINumber( config.getKey( 'project/renderer/dofFocusDistance' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateDOF );
	dofFocusDistanceRow.add( dofFocusDistance );

	const dofFocalLengthRow = new UIRow().setDisplay( dofBoolean.getValue() ? '' : 'none' );
	dofContainer.add( dofFocalLengthRow );
	dofRows.push( dofFocalLengthRow );

	dofFocalLengthRow.add( new UIText( strings.getKey( 'sidebar/project/dofFocalLength' ) ).setWidth( '90px' ) );

	const dofFocalLength = new UINumber( config.getKey( 'project/renderer/dofFocalLength' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateDOF );
	dofFocalLengthRow.add( dofFocalLength );

	const dofBokehScaleRow = new UIRow().setDisplay( dofBoolean.getValue() ? '' : 'none' );
	dofContainer.add( dofBokehScaleRow );
	dofRows.push( dofBokehScaleRow );

	dofBokehScaleRow.add( new UIText( strings.getKey( 'sidebar/project/dofBokehScale' ) ).setWidth( '90px' ) );

	const dofBokehScale = new UINumber( config.getKey( 'project/renderer/dofBokehScale' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateDOF );
	dofBokehScaleRow.add( dofBokehScale );

	function updateDOF() {

		currentDOFEffect.focusDistance = parseFloat( dofFocusDistance.getValue() );
		currentDOFEffect.focalLength = parseFloat( dofFocalLength.getValue() );
		currentDOFEffect.bokehScale = parseFloat( dofBokehScale.getValue() );

		signals.rendererUpdated.dispatch();

	}

	container.add( dofContainer );

	// SSAO

	const ssaoContainer = new UIPanel();
	const ssaoRows = [];

	const ssaoHeader = new UIRow();
	ssaoContainer.add( ssaoHeader );

	ssaoHeader.add( new UIText( strings.getKey( 'sidebar/project/ssao' ).toUpperCase() ).setWidth( '90px' ) );

	const ssaoBoolean = new UIBoolean( config.getKey( 'project/renderer/ssao' ) ).onChange( () => enableRows( ssaoRows, ssaoBoolean.getValue(), createRenderer ) );
	ssaoHeader.add( ssaoBoolean );

	const ssaoBlendFunctionRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoBlendFunctionRow );
	ssaoRows.push( ssaoBlendFunctionRow );

	ssaoBlendFunctionRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoBlendFunction' ) ).setWidth( '90px' ) );

	const ssaoBlendFunction = new UISelect().setOptions( {
		0: 'Multiply',
		1: 'Subtract',
		2: 'Add',
		3: 'Divide',
		4: 'Min',
		5: 'Max'
	} ).setWidth( '150px' ).onChange( updateSSAO );
	ssaoBlendFunction.setValue( config.getKey( 'project/renderer/ssaoBlendFunction' ) );
	ssaoBlendFunctionRow.add( ssaoBlendFunction );

	const ssaoSamplesRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoSamplesRow );
	ssaoRows.push( ssaoSamplesRow );

	ssaoSamplesRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoSamples' ) ).setWidth( '90px' ) );

	const ssaoSamples = new UINumber( config.getKey( 'project/renderer/ssaoSamples' ) ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setStep( 10 ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoSamplesRow.add( ssaoSamples );

	const ssaoRingsRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoRingsRow );
	ssaoRows.push( ssaoRingsRow );

	ssaoRingsRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoRings' ) ).setWidth( '90px' ) );

	const ssaoRings = new UINumber( config.getKey( 'project/renderer/ssaoRings' ) ).setWidth( '30px' ).setPrecision( 0 ).setNudge( 1 ).setStep( 10 ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoRingsRow.add( ssaoRings );

	const ssaoDistanceThresholdRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoDistanceThresholdRow );
	ssaoRows.push( ssaoDistanceThresholdRow );

	ssaoDistanceThresholdRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoDistanceThreshold' ) ).setWidth( '90px' ) );

	const ssaoDistanceThreshold = new UINumber( config.getKey( 'project/renderer/ssaoDistanceThreshold' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoDistanceThresholdRow.add( ssaoDistanceThreshold );

	const ssaoDistanceFalloffRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoDistanceFalloffRow );
	ssaoRows.push( ssaoDistanceFalloffRow );

	ssaoDistanceFalloffRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoDistanceFalloff' ) ).setWidth( '90px' ) );

	const ssaoDistanceFalloff = new UINumber( config.getKey( 'project/renderer/ssaoDistanceFalloff' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoDistanceFalloffRow.add( ssaoDistanceFalloff );

	const ssaoRangeThresholdRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoRangeThresholdRow );
	ssaoRows.push( ssaoRangeThresholdRow );

	ssaoRangeThresholdRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoRangeThreshold' ) ).setWidth( '90px' ) );

	const ssaoRangeThreshold = new UINumber( config.getKey( 'project/renderer/ssaoRangeThreshold' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoRangeThresholdRow.add( ssaoRangeThreshold );

	const ssaoRangeFalloffRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoRangeFalloffRow );
	ssaoRows.push( ssaoRangeFalloffRow );

	ssaoRangeFalloffRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoRangeFalloff' ) ).setWidth( '90px' ) );

	const ssaoRangeFalloff = new UINumber( config.getKey( 'project/renderer/ssaoRangeFalloff' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoRangeFalloffRow.add( ssaoRangeFalloff );

	const ssaoLuminanceInfluenceRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoLuminanceInfluenceRow );
	ssaoRows.push( ssaoLuminanceInfluenceRow );

	ssaoLuminanceInfluenceRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoLuminanceInfluence' ) ).setWidth( '90px' ) );

	const ssaoLuminanceInfluence = new UINumber( config.getKey( 'project/renderer/ssaoLuminanceInfluence' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoLuminanceInfluenceRow.add( ssaoLuminanceInfluence );

	const ssaoRadiusRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoRadiusRow );
	ssaoRows.push( ssaoRadiusRow );

	ssaoRadiusRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoRadius' ) ).setWidth( '90px' ) );

	const ssaoRadius = new UINumber( config.getKey( 'project/renderer/ssaoRadius' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoRadiusRow.add( ssaoRadius );

	const ssaoScaleRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoScaleRow );
	ssaoRows.push( ssaoScaleRow );

	ssaoScaleRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoScale' ) ).setWidth( '90px' ) );

	const ssaoScale = new UINumber( config.getKey( 'project/renderer/ssaoScale' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoScaleRow.add( ssaoScale );

	const ssaoBiasRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoBiasRow );
	ssaoRows.push( ssaoBiasRow );

	ssaoBiasRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoBias' ) ).setWidth( '90px' ) );

	const ssaoBias = new UINumber( config.getKey( 'project/renderer/ssaoBias' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoBiasRow.add( ssaoBias );

	const ssaoIntensityRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoIntensityRow );
	ssaoRows.push( ssaoIntensityRow );

	ssaoIntensityRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoIntensity' ) ).setWidth( '90px' ) );

	const ssaoIntensity = new UINumber( config.getKey( 'project/renderer/ssaoIntensity' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoIntensityRow.add( ssaoIntensity );

	const ssaoResolutionScaleRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoResolutionScaleRow );
	ssaoRows.push( ssaoResolutionScaleRow );

	ssaoResolutionScaleRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoResolutionScale' ) ).setWidth( '90px' ) );

	const ssaoResolutionScale = new UINumber( config.getKey( 'project/renderer/ssaoResolutionScale' ) ).setWidth( '30px' ).setRange( 0, Infinity ).onChange( updateSSAO );
	ssaoResolutionScaleRow.add( ssaoResolutionScale );

	const ssaoDepthAwareUpsamplingRow = new UIRow().setDisplay( ssaoBoolean.getValue() ? '' : 'none' );
	ssaoContainer.add( ssaoDepthAwareUpsamplingRow );
	ssaoRows.push( ssaoDepthAwareUpsamplingRow );

	ssaoDepthAwareUpsamplingRow.add( new UIText( strings.getKey( 'sidebar/project/ssaoDepthAwareUpsampling' ) ).setWidth( '90px' ) );

	const ssaoDepthAwareUpsampling = new UIBoolean( config.getKey( 'project/renderer/ssaoDepthAwareUpsampling' ) ).onChange( updateSSAO );
	ssaoDepthAwareUpsamplingRow.add( ssaoDepthAwareUpsampling );

	function updateSSAO() {

		currentSSAOEffect.blendFunction = parseInt( ssaoBlendFunction.getValue() );
		currentSSAOEffect.samples = parseInt( ssaoSamples.getValue() );
		currentSSAOEffect.rings = parseInt( ssaoRings.getValue() );
		currentSSAOEffect.distanceThreshold = parseFloat( ssaoDistanceThreshold.getValue() );
		currentSSAOEffect.distanceFalloff = parseFloat( ssaoDistanceFalloff.getValue() );
		currentSSAOEffect.rangeThreshold = parseFloat( ssaoRangeThreshold.getValue() );
		currentSSAOEffect.rangeFalloff = parseFloat( ssaoRangeFalloff.getValue() );
		currentSSAOEffect.luminanceInfluence = parseFloat( ssaoLuminanceInfluence.getValue() );
		currentSSAOEffect.radius = parseFloat( ssaoRadius.getValue() );
		currentSSAOEffect.scale = parseFloat( ssaoScale.getValue() );
		currentSSAOEffect.bias = parseFloat( ssaoBias.getValue() );
		currentSSAOEffect.intensity = parseFloat( ssaoIntensity.getValue() );
		currentSSAOEffect.resolutionScale = parseFloat( ssaoResolutionScale.getValue() );
		currentSSAOEffect.depthAwareUpsampling = ssaoDepthAwareUpsampling.getValue();

		signals.rendererUpdated.dispatch();

	}

	container.add( ssaoContainer );

	// SMAA

	const smaaContainer = new UIPanel();
	const smaaRows = [];

	const smaaHeader = new UIRow();
	smaaContainer.add( smaaHeader );

	smaaHeader.add( new UIText( strings.getKey( 'sidebar/project/smaa' ).toUpperCase() ).setWidth( '90px' ) );

	const smaaBoolean = new UIBoolean( config.getKey( 'project/renderer/smaa' ) ).onChange( () => enableRows( smaaRows, smaaBoolean.getValue(), createRenderer ) );
	smaaHeader.add( smaaBoolean );

	const smaaPresetRow = new UIRow().setDisplay( smaaBoolean.getValue() ? '' : 'none' );
	smaaContainer.add( smaaPresetRow );

	smaaPresetRow.add( new UIText( strings.getKey( 'sidebar/project/smaaPreset' ) ).setWidth( '90px' ) );

	const smaaPreset = new UISelect().setOptions( {
		0: 'Low',
		1: 'Medium',
		2: 'High',
		3: 'Ultra'
	} ).setWidth( '150px' ).onChange( updateSMAA );
	smaaPreset.setValue( config.getKey( 'project/renderer/smaaPreset' ) );
	smaaPresetRow.add( smaaPreset );

	function updateSMAA() {

		currentSMAAEffect.applyPreset( parseFloat( smaaPreset.getValue() ) );

		signals.rendererUpdated.dispatch();

	}

	container.add( smaaContainer );

	container.add( new UIText( SMAAPreset.LOW === 0 ? 'OK' : 'KO' ) );

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
			depth: false,
			toneMapping: THREE.NoToneMapping,
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
			currentN8aoPass.configuration.screenSpaceRadius = n8aoScreenSpaceRadius.getValue();
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

		// DOF

		if ( dofBoolean.getValue() ) {

			currentDOFEffect = new DepthOfFieldEffect( editor.camera, {
				focusDistance: parseFloat( dofFocusDistance.getValue() ),
				focalLength: parseFloat( dofFocalLength.getValue() ),
				bokehScale: parseFloat( dofBokehScale.getValue() )
			} );
			currentComposer.addPass( new EffectPass( editor.camera, currentDOFEffect ) );

		} else {

			currentDOFEffect = null;

		}

		// SSAO

		if ( ssaoBoolean.getValue() ) {

			currentSSAOEffect = new SSAOEffect( editor.camera, undefined, {
				blendFunction: parseFloat( ssaoBlendFunction.getValue() ),
				samples: parseInt( ssaoSamples.getValue() ),
				rings: parseInt( ssaoRings.getValue() ),
				distanceThreshold: parseFloat( ssaoDistanceThreshold.getValue() ),
				distanceFalloff: parseFloat( ssaoDistanceFalloff.getValue() ),
				rangeThreshold: parseFloat( ssaoRangeThreshold.getValue() ),
				rangeFalloff: parseFloat( ssaoRangeFalloff.getValue() ),
				luminanceInfluence: parseFloat( ssaoLuminanceInfluence.getValue() ),
				radius: parseFloat( ssaoRadius.getValue() ),
				scale: parseFloat( ssaoScale.getValue() ),
				bias: parseFloat( ssaoBias.getValue() ),
				intensity: parseFloat( ssaoIntensity.getValue() ),
				resolutionScale: parseFloat( ssaoResolutionScale.getValue() ),
				depthAwareUpsampling: ssaoDepthAwareUpsampling.getValue()
			} );
			currentComposer.addPass( new EffectPass( editor.camera, currentSSAOEffect ) );

		} else {

			currentSSAOEffect = null;

		}

		// SMAA

		if ( smaaBoolean.getValue() ) {

			currentSMAAEffect = new SMAAEffect( {
				preset: parseInt( smaaPreset.getValue() )
			} );

		} else {

			currentSMAAEffect = null;

		}

		// ToneMapping

		currentToneMappingEffect = new ToneMappingEffect( {
			mode: parseInt( toneMappingSelect.getValue() )
		} );

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

		signals.rendererUpdated.dispatch();

	} );

	signals.rendererUpdated.add( function () {

		config.setKey(
			'project/renderer/multisampling', parseInt( multisampling.getValue() ),

			'project/renderer/shadows', shadowsBoolean.getValue(),
			'project/renderer/shadowType', parseFloat( shadowTypeSelect.getValue() ),

			'project/renderer/toneMapping', parseInt( toneMappingSelect.getValue() ),

			'project/renderer/bloom', bloomBoolean.getValue(),
			'project/renderer/bloomIntensity', parseFloat( bloomIntensity.getValue() ),
			'project/renderer/bloomThreshold', parseFloat( bloomThreshold.getValue() ),
			'project/renderer/bloomSmoothing', parseFloat( bloomSmoothing.getValue() ),

			'project/renderer/n8ao', n8aoBoolean.getValue(),
			'project/renderer/n8aoRadius', parseInt( n8aoRadius.getValue() ),
			'project/renderer/n8aoFalloff', parseFloat( n8aoDistanceFalloff.getValue() ),
			'project/renderer/n8aoIntensity', parseFloat( n8aoIntensity.getValue() ),
			'project/renderer/n8aoSSRadius', n8aoScreenSpaceRadius.getValue(),
			'project/renderer/n8aoAOSamples', parseInt( n8aoAOSamples.getValue() ),
			'project/renderer/n8aoDenoiseSamples', parseInt( n8aoDenoiseSamples.getValue() ),
			'project/renderer/n8aoDenoiseRadius', parseFloat( n8aoDenoiseRadius.getValue() ),

			'project/renderer/dof', dofBoolean.getValue(),
			'project/renderer/dofFocusDistance', parseFloat( dofFocusDistance.getValue() ),
			'project/renderer/dofFocalLength', parseFloat( dofFocalLength.getValue() ),
			'project/renderer/dofBokehScale', parseFloat( dofBokehScale.getValue() ),

			'project/renderer/ssao', ssaoBoolean.getValue(),
			'project/renderer/ssaoBlendFunction', parseFloat( ssaoBlendFunction.getValue() ),
			'project/renderer/ssaoSamples', parseInt( ssaoSamples.getValue() ),
			'project/renderer/ssaoRings', parseInt( ssaoRings.getValue() ),
			'project/renderer/ssaoDistanceThreshold', parseFloat( ssaoDistanceThreshold.getValue() ),
			'project/renderer/ssaoDistanceFalloff', parseFloat( ssaoDistanceFalloff.getValue() ),
			'project/renderer/ssaoRangeThreshold', parseFloat( ssaoRangeThreshold.getValue() ),
			'project/renderer/ssaoRangeFalloff', parseFloat( ssaoRangeFalloff.getValue() ),
			'project/renderer/ssaoLuminanceInfluence', parseFloat( ssaoLuminanceInfluence.getValue() ),
			'project/renderer/ssaoRadius', parseFloat( ssaoRadius.getValue() ),
			'project/renderer/ssaoScale', parseFloat( ssaoScale.getValue() ),
			'project/renderer/ssaoBias', parseFloat( ssaoBias.getValue() ),
			'project/renderer/ssaoIntensity', parseFloat( ssaoIntensity.getValue() ),
			'project/renderer/ssaoResolutionScale', parseFloat( ssaoResolutionScale.getValue() ),
			'project/renderer/ssaoDepthAwareUpsampling', ssaoDepthAwareUpsampling.getValue(),

			'project/renderer/smaa', smaaBoolean.getValue(),
			'project/renderer/smaaPreset', parseFloat( smaaPreset.getValue() )
		);

	} );

	return container;

}

export { SidebarProjectRenderer };
