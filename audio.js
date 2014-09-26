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

		var lowFilter = context.createBiquadFilter();
		lowFilter.type = "lowpass";
		soundSource.connect(lowFilter);

		var analyser = context.createAnalyser();
		lowFilter.connect(analyser);
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

	if( stash.historyIndex > stash.historyLevels ) {
		stash.historyIndex = 0;
	}
	else {
		++stash.historyIndex;
	}

	var getY = function(v) {
		return barMaxHeight - v;
	};

	stash.colorPhase = (stash.colorPhase + 1 ) > sampleCount ? 0 : ++stash.colorPhase;
	// Create
	d3.select('.d3-visualization')
		.selectAll('.' + barClass)
		.data(barHeights)
		.enter()
		.append('rect')
		.attr('class', barClass)
		.attr('fill', function(v,i) { return stash.color(i / sampleCount); })
		.attr('x', function(v, i) { return (i + 0.5) * barWidth})
		.attr('y', getY)
		.attr('width', barWidth * 0.8)
		.attr('height', _.identity);

	// Update
	d3.select('.d3-visualization')
		.selectAll('.' + barClass)
		.data(barHeights)
		//.transition()
		//.duration(60)
		.attr('y', getY)
		.attr('fill', function(v,i) { return stash.color(((i + stash.colorPhase) % sampleCount) / sampleCount); })
		.attr('height', _.identity);
}
