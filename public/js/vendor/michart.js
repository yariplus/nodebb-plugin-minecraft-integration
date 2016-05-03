define(['./d3.min.js'], function(d3){
	var defaultChartOptions = {
		margin: {top: 30, right: 20, bottom: 30, left: 50},
		getValueX: function(d){ return d.timestamp; },
		getValueY: function(d){ return d.tps; },
		minY: 5,
		bufferY: 2,
		maxY: 33
	};

	// Chart Object
	function miChart(el, data, options, cb) {
		var self = this;

		self.el = el;

		options = options || defaultChartOptions;

		for (var p in defaultChartOptions) { options[p] = options[p] || defaultChartOptions[p] }

		self.margin = options.margin;
		self.width  = el.width()  - self.margin.left - self.margin.right;
		self.height = el.height() - self.margin.top  - self.margin.bottom;
		self.xRange = d3.time.scale().range([0, self.width]);
		self.yRange = d3.scale.linear().range([self.height, 0]);
		self.xAxis = d3.svg.axis().scale(self.xRange).orient("bottom").ticks(5);
		self.yAxis = d3.svg.axis().scale(self.yRange).orient("left").ticks(5);

		// Parse the date / time
		// var parseDate = d3.time.format("%d-%b-%y").parse;

		// Define the line
		var valueline = d3.svg.line()
			.x(function(d) { return self.xRange(options.getValueX(d)); })
			.y(function(d) { return self.yRange(options.getValueY(d)); });

		data.forEach(function(d) {
			// d.date = parseDate(d.date);
			// d.close = +d.close;
		});

		// Scale the range of the data
		self.xRange.domain(d3.extent(data, options.getValueX));
		self.yRange.domain([0, Math.min(options.maxY, Math.max(d3.max(data, options.getValueY), options.minY) + options.bufferY)]);

		var line = self.line = valueline(data);

		// Adds the svg canvas
		var svg = self.svg = d3.select(el[0])
			.append("svg")
				.attr("width",  self.width  + self.margin.left + self.margin.right)
				.attr("height", self.height + self.margin.top  + self.margin.bottom)
			.append("g")
				.attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

		svg.append("path")
			.attr("class", "line")
			.attr("d", line);

		// Add the X Axis
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + self.height + ")")
			.call(self.xAxis);

		// Add the Y Axis
		svg.append("g")
			.attr("class", "y axis")
			.call(self.yAxis);

		el.find('.axis').css('font-size', el.width()/26);

		charts.push(self);
	}

	miChart.prototype.resize = function(){
		var self = this;

		self.width  = self.el.width()  - self.margin.left - self.margin.right;
		self.height = self.el.height() - self.margin.top  - self.margin.bottom;

		/* Update the range of the scale with new width/height */
		self.xRange = d3.time.scale().range([0, self.width]);
		self.yRange = d3.scale.linear().range([self.height, 0]);
		self.xAxis = d3.svg.axis().scale(self.xRange).orient("bottom").ticks(5);
		self.yAxis = d3.svg.axis().scale(self.yRange).orient("left").ticks(5);

		/* Update the axis with the new scale */
		self.svg.select('.x.axis').attr("transform", "translate(0," + self.height + ")").call(self.xAxis);
		self.svg.select('.y.axis').call(self.yAxis);

		/* Force D3 to recalculate and update the line */
		self.svg.selectAll('.line').attr("d", self.line);
	};

	miChart.prototype.render = function(){
		var self = this;

		self.updateDimensions();

		//update x and y scales to new dimensions
		// x.range([0, width]);
		// y.range([height, 0]);

		//update svg elements to new dimensions
		// svg
			// .attr('width', width + margin.right + margin.left)
			// .attr('height', height + margin.top + margin.bottom);
		// chartWrapper.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		//update the axis and line
		// xAxis.scale(x);
		// yAxis.scale(y);

		// svg.select('.x.axis')
		// .attr('transform', 'translate(0,' + height + ')')
		// .call(xAxis);

		// svg.select('.y.axis')
		// .call(yAxis);

		// path.attr('d', line);
	};

	miChart.prototype.buildScales = function(){};
	miChart.prototype.buildAxis = function(){};
	miChart.prototype.buildSVG = function(){};
	miChart.prototype.buildContainerGroups = function(){};
	miChart.prototype.drawBars = function(){};
	miChart.prototype.drawAxis = function(){};

	window.miChart = miChart;

	return miChart;
});
