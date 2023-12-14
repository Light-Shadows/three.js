function Config() {

	const name = 'threejs-editor';

	const storage = {
		'language': 'en',

		'autosave': true,

		'project/title': '',
		'project/editable': false,
		'project/vr': false,

		'project/renderer/antialias': false,
		'project/renderer/multisampling': 0,
		'project/renderer/shadows': true,
		'project/renderer/shadowType': 1, // PCF

		'project/renderer/toneMapping': 0, // REINHARD
		'project/renderer/toneMappingExposure': 1,

		'project/renderer/bloom': true,
		'project/renderer/bloomIntensity': 0.1,
		'project/renderer/bloomThreshold': 0.15,
		'project/renderer/bloomSmoothing': 1,

		'project/renderer/n8ao': true,
		'project/renderer/n8aoRadius': 20,
		'project/renderer/n8aoFalloff': 1,
		'project/renderer/n8aoIntensity': 3,
		'project/renderer/n8aoSSRadius': true,
		'project/renderer/n8aoAOSamples': 32,
		'project/renderer/n8aoDenoiseSamples': 8,
		'project/renderer/n8aoDenoiseRadius': 6,

		'project/renderer/dof': false,
		'project/renderer/dofFocusDistance': 0.1,
		'project/renderer/dofFocalLength': 0.1,
		'project/renderer/dofBokehScale': 1,

		'project/renderer/ssao': false,
		'project/renderer/ssaoBlendFunction': 0,
		'project/renderer/ssaoSamples': 65,
		'project/renderer/ssaoRings': 7,
		'project/renderer/ssaoDistanceThreshold': 1.0,
		'project/renderer/ssaoDistanceFalloff': 0.0,
		'project/renderer/ssaoRangeThreshold': 1.0,
		'project/renderer/ssaoRangeFalloff': 1.0,
		'project/renderer/ssaoLuminanceInfluence': 0.1,
		'project/renderer/ssaoRadius': 0.03,
		'project/renderer/ssaoScale': 1.0,
		'project/renderer/ssaoBias': 0.05,
		'project/renderer/ssaoIntensity': 6.0,
		'project/renderer/ssaoResolutionScale': 1.0,
		'project/renderer/ssaoDepthAwareUpsampling': true,

		'project/renderer/smaa': true,
		'project/renderer/smaaPreset': 0,

		'settings/history': false,

		'settings/shortcuts/translate': 'w',
		'settings/shortcuts/rotate': 'e',
		'settings/shortcuts/scale': 'r',
		'settings/shortcuts/undo': 'z',
		'settings/shortcuts/focus': 'f'
	};

	if ( window.localStorage[ name ] === undefined ) {

		window.localStorage[ name ] = JSON.stringify( storage );

	} else {

		const data = JSON.parse( window.localStorage[ name ] );

		for ( const key in data ) {

			storage[ key ] = data[ key ];

		}

	}

	return {

		getKey: function ( key ) {

			return storage[ key ];

		},

		setKey: function () { // key, value, key, value ...

			for ( let i = 0, l = arguments.length; i < l; i += 2 ) {

				storage[ arguments[ i ] ] = arguments[ i + 1 ];

			}

			window.localStorage[ name ] = JSON.stringify( storage );

			console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved config to LocalStorage.' );

		},

		clear: function () {

			delete window.localStorage[ name ];

		}

	};

}

export { Config };
