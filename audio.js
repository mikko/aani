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
stash.barCount = 128;
stash.colorPhase = 0;
stash.average = 0;
stash.averageSum = 0;
stash.sampleCount = 0;

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
	stash.width = $('.video-container').width();
	stash.height = $('.video-container').height();

	if( !audioFile ) return;
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
		console.log("Not using microphone");
		soundSource = context.createBufferSource();
		
		// buffers from raw binary data
		soundBuffer = context.decodeAudioData(
		audioData, 
		function onSuccess(decodedBuffer) {

		// Add the buffered data to our object
		soundSource.buffer = decodedBuffer;

		var analyser = context.createAnalyser();
		soundSource.connect(analyser);
		analyser.connect(context.destination);

		analyser.fftSize = stash.barCount * 2;
		var bufferLength = analyser.frequencyBinCount;
		var dataArray = new Uint8Array(bufferLength);
		analyser.getByteTimeDomainData(dataArray);
		
		_.range(analyser.fftSize / 2).forEach(function(i) {
			$('.visualization').append($('<span>&nbsp;</span>'));
		});

		stash.analyser = analyser;
		stash.dataArray = dataArray;

		visualize();
		soundSource.start(context.currentTime); // play the source immediately

		}, 
		function multiFail() { 
			console.log("Multifail", arguments); 
		});
	}
 	else {
		console.log("Using microphone");
		soundSource = context.createMediaStreamSource(audioData);
		var analyser = context.createAnalyser();
		soundSource.connect(analyser);
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

		visualize();
	}

	
}

var visualize = function() {
	requestAnimationFrame(visualize);
	
	stash.analyser.getByteTimeDomainData(stash.dataArray);
	
	var barClass = 'barClass';
	var barWidth = stash.width / (stash.dataArray.length + 1);
	var barMaxHeight = stash.height;
	
	var sampleCount = stash.dataArray.length;

	var barHeights = _.map(stash.dataArray, function(v,i) {
		return v / 255 * barMaxHeight;
	});

	++stash.sampleCount;
	stash.averageSum += barHeights[0];
	stash.average = stash.averageSum / stash.sampleCount;

	d3.select('.video-container')
		.attr('style', '-webkit-filter: blur(' + Math.max((barHeights[0] - stash.average) / barMaxHeight, 0) * 40 + 'px);' +
						'-webkit-filter: saturate(' + ((Math.max((barHeights[0] - stash.average) / barMaxHeight, 0) * 10) + 1)+ ');');
}
