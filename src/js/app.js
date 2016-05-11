// slows the static refresh rate by 0.5
var toggle = true,
	// show static?
    tvStatic = true,
	// is the TV paused on a channel?
	tvPause = false,
	// Standby
	tvStandBy = false,
	// Current Channel - start it at VHF 2 :D
	tvChannel = 2,
	// channel prefix
	tvChannelPre = 'CH ',
	// min and max chanels to cycle through
	tvChannelMin = 2, // VHF 2-13
	tvChannelMax = 83, // UHF 14-83
	// channel scan speed in milliseconds
	tvChannelScanSpeed = 45,

	// Giphy API Endpoint
	gapi = 'http://api.giphy.com/v1/gifs/search?q=mlem&api_key=dc6zaTOxFJmzC&limit=100',
	gdata,

	// User prompt for interaction
	userPromptCount = 20, // cycle channels before prompting user
	userPrompt = true; 

$(document).ready(function() {
	// Set up the canvas for the static effect
	var canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d');

	// Closer to analouge appearance
	canvas.width = canvas.height = 256;

	// Resize the canvas
	function resize() {
	    canvas.style.width = window.innerWidth + 'px';
	    canvas.style.height = window.innerHeight + 'px';
	}

	resize();
	window.onresize = resize;

	// Loads channel from hash link
	function loadHash() {
		var hash = window.location.hash.substring(1);
		if(hash.indexOf('channel') >= 0) {
			//tvPause = true;
			tvChannel = parseInt(hash.replace('channel', ''));
			$('#tv-channel').text(tvChannelPre+padZero(tvChannel, 3));
			toggleSearch();
		}
	}

	// updates the channel scan if the TV isn't paused on a channel
	function updateChannel() {
		setInterval(function() {
			if(!tvPause) {
				//console.log('wait');
				if(tvChannel < tvChannelMax) {
					tvChannel++;
				} else {
					tvChannel = 2;
				}
				$('#tv-channel').text(tvChannelPre+padZero(tvChannel, 3));
				window.location.hash = '';
			} else {
				window.location.hash = 'channel'+padZero(tvChannel, 3);
				userPrompt = false;
			}

			if(userPromptCount > 0) {
				userPromptCount--;
			} 

			if(userPromptCount === 0 && userPrompt) {
				$('#tv-prompt').show();
			} else if(!userPrompt) {
				$('#tv-prompt').hide();
			}
		}, tvChannelScanSpeed);
	}

	// pads the channel number with zeros to closer match appearance of old TVs
	function padZero(num, places) {
		var zero = places - num.toString().length + 1;
		return Array(+(zero > 0 && zero)).join("0") + num;
	}

	// generate canvas static noise
	// Borrowed from: http://jsfiddle.net/AbdiasSoftware/FrMNL/
	function noise(ctx) {
	    
	    var w = ctx.canvas.width,
	        h = ctx.canvas.height,
	        idata = ctx.createImageData(w, h),
	        buffer32 = new Uint32Array(idata.data.buffer),
	        len = buffer32.length,
	        i = 0;

	    for(; i < len;i++)
	        if (Math.random() < 0.9) buffer32[i] = 0xff000000;
	    
	    ctx.putImageData(idata, 0, 0);
	}

	// generate tuning effect
	// Borrowed from: http://jsfiddle.net/AbdiasSoftware/t4Pvq/
	function interference(ctx) {
    
	    var w = ctx.canvas.width,
	        h = ctx.canvas.height,
	        idata = ctx.getImageData(0, 0, w, h),
	        buffer32 = new Uint32Array(idata.data.buffer),
	        len = buffer32.length,
	        i = 0,
	        pr = 456 * Math.random(),
	        prs = 716 * Math.random();

	    for(; i < len;) {
	        buffer32[i++] = ((pr % 255)|0) << 24;
	        pr += prs * 1.2;
	    }
	    
	    ctx.putImageData(idata, 0, 0);
	}

	function standby() {
		tvStandBy = true;
		$('#canvas').css('background-image', 'url(images/standby.png)');
		//$('img#mlemgif').attr('src', 'images/standby.png').on('load', function() {
			//$(this).show();
			$('#tv-loading').hide();
			$('#tv-searching').hide();
			$('#tv-channel').hide();
			$('body').unbind('keyup click');
		//});
	}

	function tuneChannel() {
		console.log('tune');
		//$('img#mlemgif').attr('src', 'images/mlem'+padZero(tvChannel,3)+'.gif').on('load', function() {
		$('#canvas').css('background-image', 'url('+gdata[tvChannel-3].images.fixed_height_still.url+')');
		$('img#mlemgif').attr('src', gdata[tvChannel-3].images.fixed_height.url).on('load', function() {
			$(this).show();
			$('#tv-loading').hide();
			// setTimeout(function() {
			// 	$('#tv-channel').hide();
			// }, 3000);
		});
	}

	function detuneChannel() {
		$('#canvas').css('background-image', '');
		$('img#mlemgif').attr('src', 'images/blank.gif').hide();
		$('#tv-loading').hide();
		$('#tv-searching').show();
	}

	// toggles the Search/Pause mode
	function toggleSearch() {
		tvPause = !tvPause;
		$('#tv-channel').show();
		$('#tv-loading').show();
		$('#tv-searching').hide();
		if(tvPause) {
			tuneChannel();
		} else {
			detuneChannel();
		}
	}

	// added toggle to get 30 FPS instead of 60 FPS
	(function loop() {
		toggle = !toggle;
	    if (toggle) {
	        requestAnimationFrame(loop);
	        return;
	    }

	    if(!tvPause && !tvStandBy) {
	    	noise(ctx);
	    } else {
	    	interference(ctx);
	    }
	    requestAnimationFrame(loop);
	})();

	// // start channel cycle
	// updateChannel();
	// // check hash and load channel
	// loadHash();

	// Get giphy api JSON
	function getGiphy() {
		$.getJSON(gapi, function(data) {
			// Set channel
			$('#tv-channel').text(tvChannelPre+padZero(tvChannel, 3));
			//console.log(data);
			if(data.meta.status === 200) {
				gdata = data.data;
				tvChannelMax = data.pagination.total_count;
				// Adjust for max request size
				if(tvChannelMax > 100) {
					tvChannelMax = 100;
				}
				tvChannelMax += 2; // offset for 2 being the first channel

				// start channel cycle
				updateChannel();
				// check hash and load channel
				loadHash();
			} else {
				standby();
			}
		});
	}

	// Kick it off with some giphy data
	getGiphy();

	// bind click/touch/keyboard interactions
	$('body').keyup(function(e){
	   if(e.keyCode == 32){
	       // user has pressed space
	       toggleSearch();
	   }
	}).bind('click', toggleSearch);

});