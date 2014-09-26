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
	if( !audioFile ) return;
	var context;
	if (typeof AudioContext !== "undefined") {
	    context = new AudioContext();
	} else if (typeof webkitAudioContext !== "undefined") {
	    context = new webkitAudioContext();
	} else {
	    throw new Error('AudioContext not supported. :(');
	}

	stash.color = d3.interpolateRgb("orange", "blue");

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

		analyser.fftSize = 128;
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

		analyser.fftSize = 128;
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
	var barWidth = 10;
	var barMaxHeight = 200;
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

	// Create
	d3.select('.d3-visualization')
		.selectAll('.' + barClass)
		.data(barHeights)
		.enter()
		.append('rect')
		.attr('class', barClass)
		.attr('fill', function(v,i) { return stash.color(i/sampleCount); })
		.attr('x', function(v, i) { return (i + 0.5) * barWidth})
		.attr('y', getY)
		.attr('width', barWidth * 0.8)
		.attr('height', _.identity);

	// Update
	d3.select('.d3-visualization')
		.selectAll('.' + barClass)
		.data(barHeights)
		//.transition()
		//.duration(50)
		.attr('y', getY)
		.attr('height', _.identity);
}
