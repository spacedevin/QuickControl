/**
 * QuickControl 2.0
 *
 * Quicktime object handler and controller
 *
 * @author	Devin Smith (www.devin-smith.com)
 * @date	2010.01.06
 *
 * This library requires mootools with the Class, Options, Events, and Slider libraries.
 *
 * Based on Quickie
 *   By Jose Prado (http://pradador.com/)
 *
 */

(function() {
	// The bindable quicktime events
	var qtEvents = ['begin', 'loadedmetadata', 'loadedfirstframe', 'canplay', 'canplaythrough',
	'durationchange', 'load', 'ended', 'error', 'pause', 'play', 'progress', 'waiting', 'stalled',
	'timechanged', 'volumechange'];
	
	QuickControl = new Class({			
		Implements: [Options, Events],
		version: '2.0',
		movie: null,
		slider: null,
		playing: false, 
		muted: false,
		options: {
			id: null,
			height: 1,
			width: 1,
			controlWidth: 160,
			controlClass: '',
			container: null,
			attributes: {
				controller: 'false',
				postdomevents: 'true',
				enablejavascript: 'true',
				cache: 'true'
			},
			onProgress: function() { try { this.updateLoaded(); } catch (e) {} },
			onPlay: function() { this.playing = true; },
			onPause: function() { this.playing = false; },
			onEnded: function() { this.playing = false; }
		},
		
		initialize: function(path, options){
			this.setOptions(options);
			options = this.options;
			this.id = this.options.id || 'Quickie_' + $time();
			this.path = path;
			var container = options.container;
			
			// Extra attributes
			options.attributes = $H(options.attributes);
			options.attributes.src = path;
			options.attributes.postdomevents = 'true';
			
			// Get Browser appropriate html
			this.html = this.getObjectHTML();
			
			if (Browser.Engine.trident) {
				document.getElementById(container).innerHTML = this.html;
				this.quickie = document.getElementById(this.id);
				this.ieFix.delay(10, this);
			} else {
				var wrapper = document.createElement('div');
				wrapper.innerHTML = this.html;
				this.quickie = wrapper.firstChild;
				this.transferEvents();
				$(container).empty();
				document.getElementById(container).appendChild(this.quickie);
			}
			this.movie = $(this.id);
			
			// Get the control html
			$(container).grab(this.getControlEl());
			
			// Attach events to controler
			this.attachClickEvents();			
			
			// Create the updater timer
			this.updater = (function(){ this.progressUpdate(); }).periodical(250,this);

			// Set up styling
			$(container).addClass('QuickControl');
			$(container).addClass(options.style);
			$(container).setStyle('width',this.options.width + 'px')

			// Create the slider control
			this.slider = new Slider($(container).getElement('.seekBar'), $(container).getElement('.seekBarHandle'), {
				steps: 1000,
				range: [1],
				wheel: true,
				onChange: (function(value){
					this.seek(this.getDuration()*(value*.001));
				}).bind(this)
			});
		},
		
		// Call destruct before destroying the class, or recreating it
		destruct: function() {
			$clear(this.updater);
		},
		
		// Attachs evens to buttons. Call this again if you are refreshing the control contents
		attachClickEvents: function() {		
			$(this.options.container).getElement('.play div').addEvent('click', 
				(function(value){
					this.play();
				}).bind(this)
			);
			$(this.options.container).getElement('.mute div').addEvent('click', 
				(function(value){
					this.mute();
				}).bind(this)
			);
		},
		
		// Returns the control html
		getControlEl: function() {
			var html = '<table width="100%" class="qtcontrols ' + this.options.controlClass + '"><tr>'
				+ '<td class="play"><div><!-- --></div></td>'
				+ '<td class="seek" width="100%">'
				+ '<div class="seekBarUnloaded" style="width: ' + (this.options.width-this.options.controlWidth) + 'px;"><!-- --></div>'
				+ '<div class="seekBarLoaded"><!-- --></div>'
				+ '<div style=" width: ' + (this.options.width-this.options.controlWidth) + 'px;" class="seekBar">'
				+ '<div class="seekBarHandle"><!-- --></div>'
				+ '</div></td>'
				+ '<td class="mute"><div><!-- --></div></td>'
				+ '<td class="poscurrent" nowrap>00:00 / </td><td class="postotal">00:00</td></tr></table>';
				
			var el = new Element('div', {
				'html': html
			});

			return el;
		},
		
		// Returns the objects html
		getObjectHTML: function() {
			if (!this.html) {
				var attributes = this.options.attributes,
				    height     = (attributes.controller == "true") ? this.options.height + 16 : this.options.height,
				    width      = this.options.width,
				    element    = '';
					  
				if (Browser.Engine.trident) {					
					element = '<object id="'+this.id+'" ';
					element += 'width="'+width+'" ';
					element += 'height="'+height+'" ';
					element += 'bgcolor="#000000" ';
					element += 'classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" ';
					element += 'style="behavior:url(#qt_event_source);" ';
					element += 'codebase="http://www.apple.com/qtactivex/qtplugin.cab">';
					
					attributes.each(function(value, key) {
						element += '<param name="'+key+'" value="'+value+'" />';
					});
					
					element += '</object>';
				} else {
					element = '<embed id="'+this.id+'" ';
					element += 'width="'+width+'" ';
					element += 'height="'+height+'" ';
					element += 'bgcolor="#000000" ';
					element += 'pluginspage="http://www.apple.com/quicktime/download/" ';
					
					attributes.each(function(value, key) {
						element += key+'="'+value+'" ';
					});
					
					element += '/>';
				}
				this.html = element;
			}
			return this.html;
		},
		
		// IE fix for the quicktime api
		ieFix: function() {
			document.getElementById(this.id).SetResetPropertiesOnReload(false);
			document.getElementById(this.id).SetURL(this.path);
			this.transferEvents.delay(10, this);
		},
		
		// Bind user passed events
		transferEvents: function() {
			var element = this.quickie;
			
			qtEvents.each(function(evType) {
				addQTEvent(element, evType, this.fireEvent.pass(evType, this));
			}.bind(this));
		},
		
		// Play or pause
		play: function() {
			if (!this.playing) {
				this.movie.Play();
				$(this.options.container).getElement('.play div').setStyle('background-position','bottom');
			} else {
				this.movie.Stop();
				$(this.options.container).getElement('.play div').setStyle('background-position','top');
			}
			return false;
		},
		
		// Plain old stop
		stop: function() {
			this.movie.Stop();
			return false;
		},
		
		// Seek for seconds
		seek: function(seconds) {
			this.movie.SetTime(seconds * this.movie.GetTimeScale());
			return false;
		},
		
		// step 10 frames
		step: function(direction) {
			if (direction) {
				this.movie.Step(10);
			} else {
				this.movie.Step(-10);
			}
			
		},
		
		// Update the loader progress bar
		updateLoaded: function() {
			try {
				var percentLoaded = parseInt((this.movie.GetMaxTimeLoaded() / this.movie.GetDuration()) * 100);				
				$(this.options.container).getElement('.seekBarLoaded').setStyle('width', $(this.options.container).getElement('.seekBar').getWidth() * (percentLoaded * .01) + 'px');
			} catch (e) { }
		},
		
		// Method called when the timer goes off. Updates the slider
		//  position and sets the current time in the movie
		progressUpdate: function() {
				
			try {
				var percentLoaded = parseInt((this.movie.GetMaxTimeLoaded() / this.movie.GetDuration()) * 100);
				if (percentLoaded == 100) {
					$(this.options.container).getElement('.seekBarLoaded').setStyle('width', $(this.options.container).getElement('.seekBar').getWidth() * (percentLoaded * .01) + 'px');
				}
			} catch (e) { }

			var posTotal = this.getDuration();
			var posTotalMin = Math.floor(posTotal/60) + '';
			if (posTotalMin.length < 2) {
				posTotalMin = '0' + posTotalMin;
			}
			var posTotalSec = Math.floor(posTotal % 60) + '';
			if (posTotalSec.length < 2) {
				posTotalSec = '0' + posTotalSec;
			}	
			
			if (posTotalMin != 'NaN' && posTotalSec != 'NaN') {
				$(this.options.container).getElement('.postotal').innerHTML = posTotalMin + ':' + posTotalSec;
			}
	
			var posCurrent = this.getTime();
			var posCurrentMin = Math.floor(posCurrent/60) + '';

			if (posCurrentMin.length < 2) {
				posCurrentMin = '0' + posCurrentMin;
			}
			var posCurrentSec = Math.floor(posCurrent % 60) + '';
			if (posCurrentSec.length < 2) {
				posCurrentSec = '0' + posCurrentSec;
			}
			
			if (posCurrentMin != 'NaN' && posCurrentSec != 'NaN') {
				$(this.options.container).getElement('.poscurrent').innerHTML = posCurrentMin + ':' + posCurrentSec + ' / ';
			}

			this.slider.knob.setStyle(this.slider.property, (this.getTime() / this.getDuration()) * (this.slider.element.getWidth()-this.slider.knob.getWidth()));

			if (!this.playing) {
				$(this.options.container).getElement('.play div').setStyle('background-position','top');
			} else {
				$(this.options.container).getElement('.play div').setStyle('background-position','bottom');
			}
			
		},
		
		// Get the time from the movie
		getTime: function() {
			try {
				return this.movie.GetTime() / this.movie.GetTimeScale();  
			} catch (e) {
				return 0;
			}
		},
		
		// Get the duration from the movie
		getDuration: function() { 
			try {
				return this.movie.GetDuration() / this.movie.GetTimeScale(); 
			} catch (e) {
				return 0;
			}
		},
		
		// Load a movie URL
		load: function(movie) {
			this.movie.SetURL(movie);
			this.movie.SetControllerVisible(this.options.attributes.controller);
			return false;
		},
		
		// Mutes or unmutes the movie
		mute: function() {
			this.muted = this.movie.GetMute();

			if (!this.muted) {
				$(this.options.container).getElement('.mute div').setStyle('background-position','bottom');
				this.movie.SetMute(true);
			} else {
				$(this.options.container).getElement('.mute div').setStyle('background-position','top');
				this.movie.SetMute(false);
			}
			return false;
		},
		
		// Clears the content without destroying the object
		clear: function() {
		
			this.destruct();
			$(this.options.id).destroy();
		
			var content = new Element('div', {
			    'id': this.options.id,
			    'html': '<!-- -->',
			    'styles': {
			        'height': this.options.height + 'px',
			        'width': this.options.width + 'px',
			        'background-color': '#000000'
			    }
			});
	
			$(this.options.container).grab(content,'top');
		
		}
	});

	function addQTEvent(el, evType, fn, useCapture) {
		evType = 'qt_' + evType;
		if (el.addEventListener) {
			el.addEventListener(evType, fn, useCapture);
			return true;
		} else if (el.attachEvent) {
			var r = el.attachEvent('on' + evType, fn);
			return r;
		} else {
			el[evType] = fn;
		}
	}

})();
