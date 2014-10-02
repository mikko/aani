var beatDebugGraph = {
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

	update: function(array) {
		var sum = _.reduce(
			array, 
			function(memo, v) { 
				return memo + v; },
			0);
		var average = sum / array.length;
		this.minImpulse = Math.min(this.minImpulse, _.min(array));
		this.maxImpulse = Math.max(this.maxImpulse, _.max(array));
		
		var variance = this.maxImpulse - this.minImpulse;
		var tolerance = average + variance * 0.3;

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

	}
}