var beatDebugGraph = {
	videos: 
		[
			"http://webmbassy.com/v/money-gun-spraying-money-bed-girl-14109060066.webm",
			"http://img.pr0gramm.com/2014/09/22/6fbbc59433ce184a.webm",
			"http://webmbassy.com/v/money-gun-spraying-money-bed-girl-14109060066.webm",
			"http://img.pr0gramm.com/2014/09/22/a39a02bc1731b42e.webm",
			"http://img.pr0gramm.com/2014/09/26/de3963956a0d5369.webm",
			"http://img.pr0gramm.com/2014/09/28/6e04a942b0d9ed31.webm",
			"http://img.pr0gramm.com/2014/10/03/0e29b8231ed27b2a.webm",
			"http://img.pr0gramm.com/2014/10/02/6100cd3508f066dc.webm",
			"http://img.pr0gramm.com/2014/09/30/9633e6472bbf1a44.webm",
			"http://img.pr0gramm.com/2014/09/29/3c5e07c1f73064d7.webm",
			"http://img.pr0gramm.com/2014/09/29/457b781356dba742.webm",
			"http://img.pr0gramm.com/2014/09/29/2d55cbd4e4ddac86.webm",
			"http://img.pr0gramm.com/2014/09/29/6ecf828eb0e57a1b.webm",
			"http://img.pr0gramm.com/2014/09/29/4058e7bf26ee739c.webm",
			"http://img.pr0gramm.com/2014/09/29/67ef14c60591fa38.webm",
			"http://img.pr0gramm.com/2014/09/29/45eef8ec865d3cc7.webm",
			"http://img.pr0gramm.com/2014/09/29/3f4ef1510500b232.webm",
			"http://img.pr0gramm.com/2014/09/28/9a2ae86554b06516.webm",
			"http://img.pr0gramm.com/2014/09/28/49160bcb1f1dc971.webm",
			"http://img.pr0gramm.com/2014/09/27/a4dd7174e27c9dba.webm",
			"http://img.pr0gramm.com/2014/09/22/6fbbc59433ce184a.webm",
			"http://webm.land/media/A0qi.webm",
			"http://webm.land/media/PdVR.webm"
		],
	beatCount : 0,
	prevBeat: 0,
	minBeatGap: 300,
	nextVideo : null,
	init: function(bufferCount, minY, maxY, width, height) {
		this.width = width;
		this.height = height;
		this.className = 'd3-visualization';
		this.pathClassName = 'path';
		this.averageClassName = 'avg';
		this.minClassName = 'min';
		this.maxClassName = 'max';
		this.toleranceClassName = 'tolerance';
		this.x = d3.scale.linear().domain([0, bufferCount]).range([0, width]);
		this.y = d3.scale.linear().domain([minY, maxY]).range([height, 0]);
		this.line = d3.svg.line()
			// assign the X function to plot our line as we wish
			.x(function(d,i) { 
				//console.log("calculating x for", d, i, this.x(i));
				return this.x(i); 
			}.bind(this))
			.y(function(d) { 
				//console.log("calculating y for", d, this.y(d));
				return this.y(d); 
			}.bind(this))
			.interpolate("linear");
		this.minImpulse = Number.MAX_SAFE_INTEGER;
		this.maxImpulse = 0;
		this.fontSize = 16;
		console.log("Visualization initialized");
	},

	update: function(array, index) {
		var sum = _.reduce(
			array, 
			function(memo, v) { 
				return memo + v; },
			0);
		var average = sum / array.length;
		this.minImpulse = this.minImpulse * 1.1;
		this.maxImpulse = this.maxImpulse * 0.9;
		this.minImpulse = Math.min(this.minImpulse, _.min(array));
		this.maxImpulse = Math.max(this.maxImpulse, _.max(array));
		
		var variance = this.maxImpulse - this.minImpulse;
		var tolerance = average + variance * 0.3;

		this.y = d3.scale.linear().domain([(this.minImpulse - (variance * 0.3)), (this.maxImpulse + (variance * 0.3))]).range([this.height, 0]);
		

		d3.select('.' + this.className)
		.selectAll('.' + this.pathClassName)
		.data([0])
		.enter()
		.append("path")
		.attr({
			'class': this.pathClassName,
			'style': 'stroke-width: 1; stroke: white; fill: none;',
			'd': this.line(array)
		});

		d3.select('.' + this.className)
			.selectAll('.' + this.pathClassName)
			.attr({
				'd': this.line(array)
		});

		d3.select('.' + this.className)
			.selectAll('.' + this.averageClassName)
			.data([0])
			.enter()
			.append("line")
			.attr({
				'class': this.averageClassName,
				'style': 'stroke-width: 1; stroke: blue',
				'x1': 0,
				'x2': this.width,
				'y1': this.y(average),
				'y2': this.y(average)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.averageClassName)
			.attr({
				y1: this.y(average),
				y2: this.y(average)
			});
		
		d3.select('.' + this.className)
			.selectAll('.' + this.minClassName)
			.data([0])
			.enter()
			.append("line")
			.attr({
				'class': this.minClassName,
				'style': 'stroke-width: 1; stroke: green',
				'x1': 0,
				'x2': this.width,
				'y1': this.y(this.minImpulse),
				'y2': this.y(this.minImpulse)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.minClassName)
			.attr({
				y1: this.y(this.minImpulse),
				y2: this.y(this.minImpulse)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.maxClassName)
			.data([0])
			.enter()
			.append("line")
			.attr({
				'class': this.maxClassName,
				'style': 'stroke-width: 1; stroke: red',
				'x1': 0,
				'x2': this.width,
				'y1': this.y(this.maxImpulse),
				'y2': this.y(this.maxImpulse)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.maxClassName)
			.attr({
				y1: this.y(this.maxImpulse),
				y2: this.y(this.maxImpulse)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.toleranceClassName)
			.data([0])
			.enter()
			.append("line")
			.attr({
				'class': this.toleranceClassName,
				'style': 'stroke-width: 1; stroke: orange',
				'x1': 0,
				'x2': this.width,
				'y1': this.y(tolerance),
				'y2': this.y(tolerance)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.toleranceClassName)
			.attr({
				y1: this.y(tolerance),
				y2: this.y(tolerance)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.minClassName + '-text')
			.data([0])
			.enter()
			.append("text")
			.text(this.minImpulse)
			.attr({
				'class': this.minClassName + '-text',
				'style': 'fill: green',
				'font-size': this.fontSize,
				'y': this.fontSize,
				'x': this.x(0)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.minClassName + '-text')
			.text(this.minImpulse.toFixed(0));

		d3.select('.' + this.className)
			.selectAll('.' + this.averageClassName + '-text')
			.data([0])
			.enter()
			.append("text")
			.text(average)
			.attr({
				'class': this.averageClassName + '-text',
				'style': 'fill: blue',
				'font-size': this.fontSize,
				'y': this.fontSize,
				'x': this.x(100)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.averageClassName + '-text')
			.text(average.toFixed(0));

		d3.select('.' + this.className)
			.selectAll('.' + this.maxClassName + '-text')
			.data([0])
			.enter()
			.append("text")
			.text(this.maxImpulse)
			.attr({
				'class': this.maxClassName + '-text',
				'style': 'fill: red',
				'font-size': this.fontSize,
				'y': this.fontSize,
				'x': this.x(200)
			});

		d3.select('.' + this.className)
			.selectAll('.' + this.maxClassName + '-text')
			.text(this.maxImpulse.toFixed(0));

		if( array[index] > tolerance ) {
			var now = new Date().getTime();
			if (now - this.prevBeat < this.minBeatGap) {
				return;
			}
			this.prevBeat = now;
			var video = $('video')[0];
			++this.beatCount;
			if (this.beatCount % 16 == 0) {
				var i = Math.floor(Math.random() * (this.videos.length - 1) + 0.5);
				if( this.nextVideo ) {
					video.parentNode.replaceChild(this.nextVideo, video);
					video = this.nextVideo;
					video.play();
				}
				this.nextVideo = document.createElement('video');
				this.nextVideo.src = this.videos[i];
				this.nextVideo.playbackRate = (Math.random() * 3).toFixed(0);
			}
			video.currentTime = 0;
		}

	}
}