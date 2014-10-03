var Violent = function() {
	if (_ === undefined) {
		throw "Underscore.js required";
	}

	// Public
	var audioData = null;
	var audioStream = null;
	// Called when ever a beat is detected
	var onBeat = function(){};
	// Called when a new sample of FFT is handled
	var onSample = function(){};
	// Called when a new is added to impulse buffer
	var onImpulseBuffer = function(){};
	var output = false;

	// Private
	var context = null;
	var sampleCount = 1024;
	var samples = null;
	var analyzeInterval = 0; // 0 for "as often as possible"
	var analyzer = null;
	var dataArray = null;

	var beat = {
		sampleBuffer: [],
		sampleBufferLength: 300,
		sampleBufferIndex: 0,
		average: 0,
		sampleCount: 0,
		maxImpulse: null,
		minImpulse: 0
	};

	var getAudioContext = function() {
		if (typeof AudioContext !== "undefined") {
	    	context = new AudioContext();
		} else if (typeof webkitAudioContext !== "undefined") {
		    context = new webkitAudioContext();
		} else {
		    throw new Error('AudioContext not supported. :(');
		}
	};

	var initAnalysis = function(soundSource) {
		var lowFilter = context.createBiquadFilter();
		lowFilter.type = "lowpass";
		analyzer = context.createAnalyser();
		analyzer.fftSize = sampleCount * 2;
		
		soundSource.connect(lowFilter);
		lowFilter.connect(analyzer);
		
		// Connect audio to output only if enabled
		if (output) {
			soundSource.connect(context.destination);
		}

		var bufferLength = analyzer.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);
		analyzer.getByteTimeDomainData(dataArray);
		
		samples = dataArray;

		setInterval(analyze, analyzeInterval);
		//soundSource.start(context.currentTime); // play the source immediately
	};

	var analyze = function() {
		analyzer.getByteTimeDomainData(dataArray);
		nextSample(samples);
		//console.log("Beats in buffer", beat.sampleBuffer.length, "averaging", beat.average);
		onSample(samples);
		onImpulseBuffer(beat.sampleBuffer);
	};

	var sum = function(values, modifier) {
		var fun = modifier ? modifier : _.identity;
		return _.reduce(values, function(memo, value) { return memo + fun(value); }, 0);
	}

	var average = function(values) {
		return sum(values) / values.length;
	}

	var nextSample = function(samples) {
		var impulse = sum(samples, function(val) { return Math.pow(val, 2); });

		beat.sampleBuffer[beat.sampleBufferIndex] = impulse;
		beat.sampleBufferIndex = beat.sampleBufferIndex + 1 >= beat.sampleBufferLength 
			? 0
			: beat.sampleBufferIndex + 1;

		beat.average = average(beat.sampleBuffer);

		// These needed?
		++beat.sampleCount;
		beat.minImpulse = Math.min(beat.minImpulse, impulse);
		beat.maxImpulse = Math.max(beat.maxImpulse, impulse);
		//console.log(beat.sampleCount, beat.minImpulse, "-", beat.maxImpulse);
	};

	var instance = function() {
		getAudioContext();

		var soundSource;
		if (audioData !== null) {
			soundSource = context.createBufferSource();
			context.decodeAudioData(
				audioData, 
				function onSuccess(decodedBuffer) {
					// Add the buffered data to our object
					soundSource.buffer = decodedBuffer;
					initAnalysis(soundSource)
				}, 
				function onError() { 
					console.log("Problem decoding audio"); 
				});
				
		}
		else if (audioStream !== null) {
			console.log("Creating mediaStreamSource", audioStream);
			soundSource = context.createMediaElementSource(audioStream);
			initAnalysis(soundSource);
		}
		else {
			throw "Audio not set";
		}
	};

	instance.run = function() {
		instance();
	};

	instance.audioData = function(source) {
		if (!arguments.length) return instance;
		if( audioStream !== null ) throw "Do not set both audioData and audioStream";
		audioData = source;
		return instance;
	};

	instance.audioStream = function(source) {
		if (!arguments.length) return instance;
		if( audioData !== null ) throw "Do not set both audioData and audioStream";
		audioStream = source;
		return instance;
	};

	instance.onBeat = function(fun) {
		if (!arguments.length) return instance;
		onBeat = fun;
		return instance;
	};

	instance.onSample = function(fun) {
		if (!arguments.length) return instance;
		onSample = fun;
		return instance;
	};

	instance.onImpulseBuffer = function(fun) {
		if (!arguments.length) return instance;
		onImpulseBuffer = fun;
		return instance;
	};

	instance.output = function(out) {
		if (!arguments.length) return instance;
		output = out;
		return instance;
	};

	return instance;
}