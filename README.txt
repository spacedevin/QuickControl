QuickControl 1.0
----------------

Created by Devin Smith, January 26th 2010
http://www.devin-smith.com/

QuickControl was made to replace flash for quicktime video playback on webpages. The QuickControl library requires the Class, Options, Events, and Slider libraries of mootools.


Sample
------

new QuickControl('http://movies.apple.com/movies/sony_pictures/district9/d9-fte_h.640.mov', {
	id: 'QuickControlVid',
	width: 640,
	height: 340,
	style: 'QuickControlCustom',
	container: 'QuickControl',
	attributes: {
		autoplay: 'true',
		enablejavascript: 'false'
	}
});