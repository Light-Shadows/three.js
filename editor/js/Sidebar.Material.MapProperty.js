import * as THREE from 'three';

import { UICheckbox, UIDiv, UINumber, UIRow, UISelect, UIText } from './libs/ui.js';
import { UITexture } from './libs/ui.three.js';
import { SetMaterialMapCommand } from './commands/SetMaterialMapCommand.js';
import { SetMaterialValueCommand } from './commands/SetMaterialValueCommand.js';
import { SetMaterialRangeCommand } from './commands/SetMaterialRangeCommand.js';
import { SetMaterialVectorCommand } from './commands/SetMaterialVectorCommand.js';

function SidebarMaterialMapProperty( editor, property, name ) {

	const signals = editor.signals;

	const container = new UIRow();
	container.setStyle( 'border-bottom', [ '1px solid #888' ] );

	const mainContainer = new UIDiv().setWidth( '86px' ).setMarginRight( '4px' );
	container.add( mainContainer );

	mainContainer.add( new UIText( name ).setMarginBottom( '8px' ) );

	const textureContainer = new UIRow();
	mainContainer.add( textureContainer );

	const enabled = new UICheckbox( false ).setMarginLeft( '8px' ).setMarginRight( '16px' ).onChange( onChange );
	textureContainer.add( enabled );

	const map = new UITexture( editor ).onChange( onMapChange );
	textureContainer.add( map );

	const paramContainer = new UIDiv();
	container.add( paramContainer );

	const mapType = property.replace( 'Map', '' );

	const colorMaps = [ 'map', 'emissiveMap', 'sheenColorMap', 'specularColorMap', 'envMap' ];

	const firstRow = new UIRow().setMarginBottom( '4px' ).setStyle( 'min-height', '0px' );
	paramContainer.add( firstRow );

	let tileOffsetX, tileOffsetY;
	let tileRepeatX, tileRepeatY;

	if ( property !== 'envMap' && property !== 'lightMap' && property !== 'aoMap' ) {

		const tile = new UIDiv().setMarginLeft( '3px' );
		firstRow.add( tile );

		const tileOffsetRow = new UIRow().setMarginBottom( '0px' ).setStyle( 'min-height', '0px' );
		tile.add( tileOffsetRow );

		tileOffsetRow.add( new UIText( 'offset:' ).setWidth( '40px' ) );

		tileOffsetX = new UINumber( 0 ).setWidth( '40px' ).setRange( 0, 1 ).onChange( onTileChange );
		tileOffsetRow.add( tileOffsetX );

		tileOffsetY = new UINumber( 0 ).setWidth( '40px' ).setRange( 0, 1 ).onChange( onTileChange );
		tileOffsetRow.add( tileOffsetY );

		const tileRepeatRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
		tile.add( tileRepeatRow );

		tileRepeatRow.add( new UIText( 'repeat:' ).setWidth( '40px' ) );

		tileRepeatX = new UINumber( 1 ).setWidth( '40px' ).onChange( onTileChange );
		tileRepeatRow.add( tileRepeatX );

		tileRepeatY = new UINumber( 1 ).setWidth( '40px' ).onChange( onTileChange );
		tileRepeatRow.add( tileRepeatY );

	}

	const secondRow = new UIRow().setMarginBottom( '0px' ).setStyle( 'min-height', '0px' );
	paramContainer.add( secondRow );

	let defaultProperties;
	let intensity;

	if ( property === 'aoMap' ) {

		if ( defaultProperties === undefined ) {

			defaultProperties = new UIDiv().setMarginLeft( '3px' );
			secondRow.add( defaultProperties );

		}

		const defaultIntensityRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
		defaultProperties.add( defaultIntensityRow );

		defaultIntensityRow.add( new UIText( 'intst:' ).setWidth( '40px' ) );
		intensity = new UINumber( 1 ).setWidth( '30px' ).setRange( 0, 1 ).onChange( onIntensityChange );
		defaultIntensityRow.add( intensity );

	}

	let scale;

	if ( property === 'bumpMap' || property === 'displacementMap' ) {

		if ( defaultProperties === undefined ) {

			defaultProperties = new UIDiv().setMarginLeft( '3px' );
			secondRow.add( defaultProperties );

		}

		const defaultScaleRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
		defaultProperties.add( defaultScaleRow );

		defaultScaleRow.add( new UIText( 'scale:' ).setWidth( '40px' ) );
		scale = new UINumber().setWidth( '30px' ).onChange( onScaleChange );
		defaultScaleRow.add( scale );

	}

	let scaleX, scaleY;

	if ( property === 'normalMap' || property === 'clearcoatNormalMap' ) {

		if ( defaultProperties === undefined ) {

			defaultProperties = new UIDiv().setMarginLeft( '3px' );
			secondRow.add( defaultProperties );

		}

		const defaultScaleXRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
		defaultProperties.add( defaultScaleXRow );

		defaultScaleXRow.add( new UIText( 'scaleX:' ).setWidth( '40px' ) );
		scaleX = new UINumber( 1 ).setWidth( '30px' ).onChange( onScaleXYChange );
		defaultScaleXRow.add( scaleX );

		const defaultScaleYRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
		defaultProperties.add( defaultScaleYRow );

		defaultScaleYRow.add( new UIText( 'scaleY:' ).setWidth( '40px' ) );
		scaleY = new UINumber( - 1 ).setWidth( '30px' ).setDisabled( true );
		defaultScaleYRow.add( scaleY );

	}

	let rangeMin, rangeMax;

	if ( property === 'iridescenceThicknessMap' ) {

		const range = new UIDiv().setMarginLeft( '3px' );
		secondRow.add( range );

		const rangeMinRow = new UIRow().setMarginBottom( '0px' ).setStyle( 'min-height', '0px' );
		range.add( rangeMinRow );

		rangeMinRow.add( new UIText( 'min:' ).setWidth( '35px' ) );

		rangeMin = new UINumber().setWidth( '40px' ).onChange( onRangeChange );
		rangeMinRow.add( rangeMin );

		const rangeMaxRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
		range.add( rangeMaxRow );

		rangeMaxRow.add( new UIText( 'max:' ).setWidth( '35px' ) );

		rangeMax = new UINumber().setWidth( '40px' ).onChange( onRangeChange );
		rangeMaxRow.add( rangeMax );

		// Additional settings for iridescenceThicknessMap
		// Please add conditional if more maps are having a range property
		rangeMin.setPrecision( 0 ).setRange( 0, Infinity ).setNudge( 1 ).setStep( 10 ).setUnit( 'nm' );
		rangeMax.setPrecision( 0 ).setRange( 0, Infinity ).setNudge( 1 ).setStep( 10 ).setUnit( 'nm' );

	}

	const uvDiv = new UIDiv().setMarginLeft( '3px' );
	firstRow.add( uvDiv );

	const uvChannelRow = new UIRow().setMarginBottom( '0px' ).setStyle( 'min-height', '0px' );
	uvDiv.add( uvChannelRow );

	uvChannelRow.add( new UIText( 'uv:' ).setWidth( '40px' ) );

	const uvChannel = new UINumber( ( property === 'aoMap' || property === 'lightMap' ) ? 1 : 0 ).setPrecision( 0 ).setRange( 0, 3 ).setStep( 1 ).setWidth( '40px' ).onChange( onUVChannelChange );
	uvChannelRow.add( uvChannel );

	const flipYRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
	uvDiv.add( flipYRow );

	flipYRow.add( new UIText( 'flipY:' ).setWidth( '40px' ) );

	const flipY = new UICheckbox( false ).setMarginRight( '8px' ).onChange( onFlipYChange );
	flipYRow.add( flipY );

	const wrapContainer = new UIDiv().setMarginLeft( '3px' );
	secondRow.add( wrapContainer );

	const wrapTypes = {
		'RepeatWrapping': 'Repeat',
		'ClampToEdgeWrapping': 'Clamp To Edge',
		'MirroredRepeatWrapping': 'Mirrored Repeat'
	};

	const wrapSRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
	wrapContainer.add( wrapSRow );

	wrapSRow.add( new UIText( 'wrapS:' ).setWidth( '40px' ) );

	const wrapS = new UISelect().setOptions( wrapTypes ).setWidth( '150px' ).onChange( onWrapChange );
	wrapSRow.add( wrapS );

	const wrapTRow = new UIRow().setMarginBottom( '6px' ).setStyle( 'min-height', '0px' );
	wrapContainer.add( wrapTRow );

	wrapTRow.add( new UIText( 'wrapT:' ).setWidth( '40px' ) );

	const wrapT = new UISelect().setOptions( wrapTypes ).setWidth( '150px' ).onChange( onWrapChange );
	wrapTRow.add( wrapT );

	let object = null;
	let materialSlot = null;
	let material = null;

	function onChange() {

		const newMap = enabled.getValue() ? map.getValue() : null;

		if ( material[ property ] !== newMap ) {

			if ( newMap !== null ) {

				const geometry = object.geometry;

				if ( geometry.hasAttribute( 'uv' ) === false ) console.warn( 'Geometry doesn\'t have uvs:', geometry );

				if ( property === 'envMap' ) newMap.mapping = THREE.EquirectangularReflectionMapping;

				if ( property !== 'envMap' && property !== 'lightMap' && property !== 'aoMap' ) {

					console.log( wrapS, wrapT );
					newMap.wrapS = THREE[ wrapS.getValue() ];
					newMap.wrapT = THREE[ wrapT.getValue() ];

					const newOffset = [ tileOffsetX.getValue(), tileOffsetY.getValue() ];
					const newRepeat = [ tileRepeatX.getValue(), tileRepeatY.getValue() ];

					newMap.offset.fromArray( newOffset );
					newMap.repeat.fromArray( newRepeat );

				}

			}

			editor.execute( new SetMaterialMapCommand( editor, object, property, newMap, materialSlot ) );

		}

	}

	function onTileChange() {

		const newMap = enabled.getValue() ? map.getValue() : null;

		if ( newMap !== null ) {

			if ( property !== 'envMap' && property !== 'lightMap' && property !== 'aoMap' ) {

				const newOffset = [ tileOffsetX.getValue(), tileOffsetY.getValue() ];
				const newRepeat = [ tileRepeatX.getValue(), tileRepeatY.getValue() ];

				newMap.offset.fromArray( newOffset );
				newMap.repeat.fromArray( newRepeat );

				editor.execute( new SetMaterialMapCommand( editor, object, property, newMap, materialSlot ) );

			}

		}

	}

	function onUVChannelChange() {

		const newMap = enabled.getValue() ? map.getValue() : null;

		if ( newMap !== null ) {

			newMap.channel = uvChannel.getValue();

			editor.execute( new SetMaterialMapCommand( editor, object, property, newMap, materialSlot ) );

		}

	}

	function onFlipYChange() {

		const newMap = enabled.getValue() ? map.getValue() : null;

		if ( newMap !== null ) {

			newMap.flipY = flipY.getValue();

			editor.execute( new SetMaterialMapCommand( editor, object, property, newMap, materialSlot ) );

		}

	}

	function onWrapChange() {

		const newMap = enabled.getValue() ? map.getValue() : null;

		if ( newMap !== null ) {

			console.log( wrapS, wrapT );

			newMap.wrapS = THREE[ wrapS.getValue() ];
			newMap.wrapT = THREE[ wrapT.getValue() ];

			editor.execute( new SetMaterialMapCommand( editor, object, property, newMap, materialSlot ) );

		}

	}

	function onMapChange( texture ) {

		if ( texture !== null ) {

			if ( colorMaps.includes( property ) && texture.isDataTexture !== true && texture.colorSpace !== THREE.SRGBColorSpace ) {

				texture.colorSpace = THREE.SRGBColorSpace;
				material.needsUpdate = true;

			}

		}

		enabled.setDisabled( false );

		onChange();

	}

	function onIntensityChange() {

		if ( material[ `${ property }Intensity` ] !== intensity.getValue() ) {

			editor.execute( new SetMaterialValueCommand( editor, object, `${ property }Intensity`, intensity.getValue(), materialSlot ) );

		}

	}

	function onScaleChange() {

		if ( material[ `${ mapType }Scale` ] !== scale.getValue() ) {

			editor.execute( new SetMaterialValueCommand( editor, object, `${ mapType }Scale`, scale.getValue(), materialSlot ) );

		}

	}

	function onScaleXYChange() {

		scaleY.setValue( - scaleX.getValue() );
		const value = [ scaleX.getValue(), - scaleX.getValue() ];

		if ( material[ `${ mapType }Scale` ].x !== value[ 0 ] || material[ `${ mapType }Scale` ].y !== value[ 1 ] ) {

			editor.execute( new SetMaterialVectorCommand( editor, object, `${ mapType }Scale`, value, materialSlot ) );

		}

	}

	function onRangeChange() {

		const value = [ rangeMin.getValue(), rangeMax.getValue() ];

		if ( material[ `${ mapType }Range` ][ 0 ] !== value[ 0 ] || material[ `${ mapType }Range` ][ 1 ] !== value[ 1 ] ) {

			editor.execute( new SetMaterialRangeCommand( editor, object, `${ mapType }Range`, value[ 0 ], value[ 1 ], materialSlot ) );

		}

	}

	function update( currentObject, currentMaterialSlot = 0 ) {

		object = currentObject;
		materialSlot = currentMaterialSlot;

		if ( object === null ) return;
		if ( object.material === undefined ) return;

		material = editor.getObjectMaterial( object, materialSlot );

		if ( property in material ) {

			if ( material[ property ] !== null ) {

				map.setValue( material[ property ] );

				if ( tileOffsetX !== undefined ) {

					tileOffsetX.setValue( material[ property ].offset.x );
					tileOffsetY.setValue( material[ property ].offset.y );

				}

				if ( tileRepeatX !== undefined ) {

					tileRepeatX.setValue( material[ property ].repeat.x );
					tileRepeatY.setValue( material[ property ].repeat.y );

				}

				if ( material[ property ].channel !== undefined ) {

					uvChannel.setValue( material[ property ].channel );

				}

				if ( material[ property ].flipY !== undefined ) {

					flipY.setValue( material[ property ].flipY );

				}

				wrapS.setValue( Object.keys( wrapTypes ).find( key => THREE[ key ] === material[ property ].wrapS ) || 'RepeatWrapping' );
				wrapT.setValue( Object.keys( wrapTypes ).find( key => THREE[ key ] === material[ property ].wrapT ) || 'RepeatWrapping' );

				console.log( wrapS, wrapT );

			} else {

				if ( tileOffsetX !== undefined ) {

					tileOffsetX.setValue( 0 );
					tileOffsetY.setValue( 0 );

				}

				if ( tileRepeatX !== undefined ) {

					tileRepeatX.setValue( 1 );
					tileRepeatY.setValue( 1 );

				}

				if ( uvChannel !== undefined ) {

					uvChannel.setValue( 0 );

				}

				if ( flipY !== undefined ) {

					flipY.setValue( false );

				}

				if ( wrapS !== undefined && wrapT !== undefined ) {

					wrapS.setValue( 'RepeatWrapping' );
					wrapT.setValue( 'RepeatWrapping' );

				}

			}

			enabled.setValue( material[ property ] !== null );
			enabled.setDisabled( map.getValue() === null );

			if ( intensity !== undefined ) {

				intensity.setValue( material[ `${ property }Intensity` ] );

			}

			if ( scale !== undefined ) {

				scale.setValue( material[ `${ mapType }Scale` ] );

			}

			if ( scaleX !== undefined ) {

				const scaleValue = material[ `${ mapType }Scale` ].x;
				scaleX.setValue( scaleValue );
				scaleY.setValue( - scaleValue );

				const value = [ scaleValue, - scaleValue ];

				if ( material[ `${ mapType }Scale` ].x !== value[ 0 ] || material[ `${ mapType }Scale` ].y !== value[ 1 ] ) {

					editor.execute( new SetMaterialVectorCommand( editor, object, `${ mapType }Scale`, value, materialSlot ) );

				}

			}

			if ( rangeMin !== undefined ) {

				rangeMin.setValue( material[ `${ mapType }Range` ][ 0 ] );
				rangeMax.setValue( material[ `${ mapType }Range` ][ 1 ] );

			}

			container.setDisplay( '' );

		} else {

			container.setDisplay( 'none' );

		}

	}

	//

	signals.objectSelected.add( function ( selected ) {

		map.setValue( null );

		update( selected );

	} );

	signals.materialChanged.add( update );

	return container;

}

export { SidebarMaterialMapProperty };
