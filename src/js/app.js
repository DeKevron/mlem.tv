var imageSearch;
var toggle = true;
var tvStatic = true;
var tvChannel = 2;
var tvChannelMax = 20; 
var tvPause = false;

$(document).ready(function() {
	// SRC: http://jsfiddle.net/AbdiasSoftware/FrMNL/
	var canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

	// closer to analouge appearance
	canvas.width = canvas.height = 256;

	function resize() {
	    canvas.style.width = window.innerWidth + 'px';
	    canvas.style.height = window.innerHeight + 'px';
	}

	resize();
	window.onresize = resize;

	function updateChannel() {
		setInterval(function() {
			if(!tvPause) {
				//console.log('wait');
				if(tvChannel < tvChannelMax) {
					tvChannel++;
				} else {
					tvChannel = 2;
				}
				$('#tv-channel').text('CH '+padZero(tvChannel, 3));
				window.location.hash = '';
			} else {
				window.location.hash = 'channel'+padZero(tvChannel, 3);
			}
		}, 575);
	}

	function padZero(num, places) {
		var zero = places - num.toString().length + 1;
		return Array(+(zero > 0 && zero)).join("0") + num;
	}

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

	function toggleSearch() {
		tvPause = !tvPause;
		$('#tv-channel').show();
		$('#tv-loading').show();
		$('#tv-searching').hide();
		if(tvPause) {
			$('img#mlemgif').attr('src', 'images/mlem'+padZero(tvChannel,3)+'.gif').on('load', function() {
				$(this).show();
				$('#tv-loading').hide();
				// setTimeout(function() {
				// 	$('#tv-channel').hide();
				// }, 3000);
			});
		} else {
			$('img#mlemgif').attr('src', 'images/blank.gif').hide();
			$('#tv-loading').hide();
			$('#tv-searching').show();
		}
		
		
	}

	//added toggle to get 30 FPS instead of 60 FPS
	(function loop() {
		toggle = !toggle;
	    if (toggle) {
	        requestAnimationFrame(loop);
	        return;
	    }
	    noise(ctx);
	    requestAnimationFrame(loop);
	})();

	updateChannel();

	$('body').keyup(function(e){
	   if(e.keyCode == 32){
	       // user has pressed space
	       toggleSearch();
	   }
	}).bind('click', toggleSearch);



});