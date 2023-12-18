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

		'project/renderer/toneMapping': true,
		'project/renderer/toneMappingExposure': 1.0,
		'project/renderer/toneMappingMode': 0, // REINHARD
		'project/renderer/toneMappingMiddleGrey': 0.6,
		'project/renderer/toneMappingWhitePoint': 16.0,
		'project/renderer/toneMappingAverageLuminance': 1.0,

		'project/renderer/bloom': true,
		'project/renderer/bloomIntensity': 0.1,
		'project/renderer/bloomThreshold': 0.15,
		'project/renderer/bloomSmoothing': 1,

		'project/renderer/vignette': true,
		'project/renderer/vignetteOffset': 0.5,
		'project/renderer/vignetteDarkness': 0.5,
		'project/renderer/vignetteEskil': false,

		'project/renderer/n8ao': true,
		'project/renderer/n8aoRadius': 20,
		'project/renderer/n8aoFalloff': 1,
		'project/renderer/n8aoIntensity': 3,
		'project/renderer/n8aoAOSamples': 32,
		'project/renderer/n8aoDenoiseSamples': 8,
		'project/renderer/n8aoDenoiseRadius': 6,

		'project/renderer/smaa': true,

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
