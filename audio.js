var audioFileUploaded = function() {
	$('#file_name').text("Loaded " + this.files[0].name);
	var reader = new FileReader();
	reader.onload = function(e) {
		audioInit(e.target.result);
	};
	reader.readAsArrayBuffer(this.files[0]);
}

var stash = {};
stash.history = [];
stash.historyIndex = 0;
stash.historyLevels = 2;
stash.barCount = 1024;
stash.colorPhase = 0;

stash.peakTolerance = 1.3;
stash.toleranceUpdated = 0;

var initBeatDetection = function() {
	stash.beatAverage = 0;
	stash.peakBuffer = [];
	stash.currentPeakBufferIndex = 0;
	stash.peakBufferLength = 200; // Around 1s with shortest possible setInterval
	stash.beatSum = 0;
	stash.beatCount = 0;
	stash.beatMinTolerance = 250;
	stash.beatMinDelta = 375;
	stash.beatMaxDelta = 2000;
	stash.prevBeat = 0;
	stash.beatBuffer = [];
	stash.currentBeatBufferIndex = 0;
	stash.beatBufferLength = 16;
	stash.beatAverage = 0;
}

initBeatDetection();

var userMediaGot = function(stream) {
	d3.select('#audio_file').remove();
	d3.select('#file_name').remove();
	stash.isMic = true;
	audioInit(stream);

}

navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);
navigator.getUserMedia( {video: false, audio:true}, userMediaGot, function(e) { console.log(e); } );

var audioInit = function(audioFile) {
	stash.width = $('.d3-visualization').width();
	stash.height = $('.d3-visualization').height();

	if( !audioFile ) return;
	d3.select('.video-container').attr("style", "display: block");
	var context;
	if (typeof AudioContext !== "undefined") {
	    context = new AudioContext();
	} else if (typeof webkitAudioContext !== "undefined") {
	    context = new webkitAudioContext();
	} else {
	    throw new Error('AudioContext not supported. :(');
	}

	stash.color = d3.interpolateRgb("blue", "green");
	
	createSoundSource(context, audioFile);

/*
	var request = new XMLHttpRequest();
	request.open("GET", "knife.mp3", true);
	request.responseType = "arraybuffer";
	 
	// Our asynchronous callback
	request.onload = function() {
	    var audioData = request.response;
	    createSoundSource(audioData);
	};
	request.send();
*/

};

var createSoundSource = function(context, audioData) {
	// create a sound source
	if(!stash.isMic) {
		console.log("Not using microphone, instead", audioData);
		soundSource = context.createBufferSource();
		
		// buffers from raw binary data
		soundBuffer = context.decodeAudioData(
		audioData, 
		function onSuccess(decodedBuffer) {

			// Add the buffered data to our object
			soundSource.buffer = decodedBuffer;

			var lowFilter = context.createBiquadFilter();
			lowFilter.type = "lowpass";
			soundSource.connect(lowFilter);


			var analyser = context.createAnalyser();
			lowFilter.connect(analyser);
			//analyser.connect(context.destination);
			soundSource.connect(context.destination);

			analyser.fftSize = stash.barCount * 2;
			var bufferLength = analyser.frequencyBinCount;
			var dataArray = new Uint8Array(bufferLength);
			analyser.getByteTimeDomainData(dataArray);
			
			_.range(analyser.fftSize / 2).forEach(function(i) {
				$('.visualization').append($('<span>&nbsp;</span>'));
			});

			stash.analyser = analyser;
			stash.dataArray = dataArray;

			//visualize();

			setInterval(visualize, 0);

			soundSource.start(context.currentTime); // play the source immediately

		}, 
		function multiFail() { 
			console.log("Multifail", arguments); 
		});
	}
 	else {
		console.log("Using microphone");
		soundSource = context.createMediaStreamSource(audioData);

		var lowFilter = context.createBiquadFilter();
		lowFilter.type = "lowpass";
		soundSource.connect(lowFilter);


		var analyser = context.createAnalyser();
		lowFilter.connect(analyser);
		//analyser.connect(context.destination);

		analyser.fftSize = stash.barCount;
		var bufferLength = analyser.frequencyBinCount;
		var dataArray = new Uint8Array(bufferLength);
		analyser.getByteTimeDomainData(dataArray);
		
		_.range(analyser.fftSize / 2).forEach(function(i) {
			$('.visualization').append($('<span>&nbsp;</span>'));
		});

		stash.analyser = analyser;
		stash.dataArray = dataArray;

		//visualize();
		setInterval(visualize, 0);
	}

	
}

var onBeat = function() {
	/*
	var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }

	d3.select('body')
		.attr('style', 'background-color: ' + color);
	*/

	var video = document.getElementById('video');
	//video.pause();
	video.currentTime = 0;
	//video.playbackRate = 2;
	//video.play();

	d3.selectAll('body')
		.attr('style', '-webkit-filter: blur(3px);')
		.transition()
		.duration(100)
		.attr('style', '-webkit-filter: blur(0px);');
}

var visualize = function() {
	var now = new Date().getTime();
	stash.analyser.getByteTimeDomainData(stash.dataArray);
	//requestAnimationFrame(visualize);

// stash.beatAverage = 0;
// stash.peakBuffer = [];
// stash.beatSum = 0;
// stash.beatCount = 0;
// stash.beatMinTolerance = 250;
// stash.beatMinDelta = 375;
// stash.beatMaxDelta = 850;
// stash.prevBeat = new Date().getTime();
// stash.peakBufferLength = 200; // Around 1s with shortest possible setInterval
// stash.currentPeakBufferIndex = 0;

	var soundImpulse = _.reduce(stash.dataArray, function(memo, v) { return memo + v * v; }, 0);

	var sum = _.reduce(
		stash.peakBuffer, 
		function(memo, v) {  return memo + v; },
		0);

	var soundAverage = sum / stash.peakBuffer.length;

	
	var sincePrevBeat = now - stash.prevBeat;

	var beatDetected = function(missed) {
		var isFirstBeat = stash.prevBeat == 0;
		stash.prevBeat = now;
		onBeat();
		if(isFirstBeat || missed) {
			return;
		}
		stash.beatBuffer[stash.currentBeatBufferIndex] = sincePrevBeat;
		
		stash.currentBeatBufferIndex = stash.currentBeatBufferIndex + 1 > stash.beatBufferLength 
			? 0 
			: stash.currentBeatBufferIndex + 1;
		
		var beatSum = _.reduce(
				stash.beatBuffer, 
				function(memo, v) {  return memo + v; },
				0);

		stash.beatAverage = beatSum / stash.beatBuffer.length;

		console.log(stash.beatAverage, "BPM");
	}

	var noBeatsDetected = function() {
		if( stash.peakTolerance === 1.1 ) {
			console.log("No point lowering tolerance under 1.1");
			stash.toleranceUpdated = now;
			return;
		}
		initBeatDetection();
		stash.peakTolerance = Math.max( 1.1, stash.peakTolerance - 0.02 );
		
		console.log("Beat tolerance dropped to", stash.peakTolerance);
	}

	if( sincePrevBeat > stash.beatMinTolerance && soundImpulse > (soundAverage * stash.peakTolerance) ) {
		console.log("BEAT");
		
		beatDetected();
	} 
	else {
		if( stash.beatBuffer.length >= stash.beatBufferLength && sincePrevBeat > stash.beatAverage ) {
			console.log("MISSED BEAT", stash.beatAverage);
			beatDetected(true);
		}

		if( stash.toleranceUpdated === 0 || 
			( (now - stash.toleranceUpdated) > stash.beatMaxDelta && sincePrevBeat > stash.beatMaxDelta ) ) {
			noBeatsDetected();
		}

		stash.peakBuffer[stash.currentPeakBufferIndex] = soundImpulse;
		stash.currentPeakBufferIndex = stash.currentPeakBufferIndex + 1 > stash.peakBufferLength 
			? 0 
			: stash.currentPeakBufferIndex + 1;
		
		++stash.beatCount;

	}

	// trying something
	// var now = new Date().getTime();
	// var delta = now - stash.prevBeat;
	
}