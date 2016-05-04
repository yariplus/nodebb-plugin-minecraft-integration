define(['./d3.min.js'], function(d3){
	var defaultChartOptions = {
		margin: {top: 30, right: 30, bottom: 30, left: 30},
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
		self.data = data;

		options = options || {};
		for (var p in defaultChartOptions) { self[p] = options[p] || defaultChartOptions[p] }

		self.buildContainerGroups();
		self.buildSVG();
		self.buildScales();
		self.buildAxis();
		self.drawLine();
		self.drawAxis();

		self.el.find('.axis').css('font-size', el.width()/26);

		charts.push(self);
	}

	miChart.prototype.resize = function(){
		var self = this;

		self.width  = self.el.width()  - self.margin.left - self.margin.right;
		self.height = self.el.height() - self.margin.top  - self.margin.bottom;

		/* Update the range of the scale with new width/height */
		self.xScale = d3.time.scale().range([0, self.width]);
		self.yScale = d3.scale.linear().range([self.height, 0]);
		self.xAxis = d3.svg.axis().scale(self.xScale).orient("bottom").ticks(5);
		self.yAxis = d3.svg.axis().scale(self.yScale).orient("left").ticks(5);

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

	miChart.prototype.buildScales = function(){
		var self = this;

		// Create Scales.
		self.xScale = d3.time.scale().range([0, self.width]);
		self.yScale = d3.scale.linear().range([self.height, 0]);

		// Scale the range of the data.
		self.xScale.domain(d3.extent(self.data, self.getValueX));
		self.yScale.domain([0, Math.min(self.maxY, Math.max(d3.max(self.data, self.getValueY), self.minY) + self.bufferY)]);
	};

	miChart.prototype.buildAxis = function(){
		var self = this;

		self.xAxis = d3.svg.axis().scale(self.xScale).orient("bottom").ticks(5);
		self.yAxis = d3.svg.axis().scale(self.yScale).orient("left").ticks(5);
	};

	miChart.prototype.buildSVG = function(){
		var self = this;

		// Adds the svg canvas
		self.svg = d3.select(self.el[0])
			.append("svg")
				.attr("width",  self.width  + self.margin.left + self.margin.right)
				.attr("height", self.height + self.margin.top  + self.margin.bottom)
			.append("g")
				.attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
	};

	miChart.prototype.buildContainerGroups = function(){
		var self = this;

		// Define container.
		self.margin = self.margin;
		self.width  = self.el.width()  - self.margin.left - self.margin.right;
		self.height = self.el.height() - self.margin.top  - self.margin.bottom;
	};

	miChart.prototype.drawBars = function(){
		var self = this;

		// TODO
	};

	miChart.prototype.drawLine = function(){
		var self = this;

		// Define the line
		var valueline = d3.svg.line()
			.x(function(d) { return self.xScale(self.getValueX(d)); })
			.y(function(d) { return self.yScale(self.getValueY(d)); });

		var line = self.line = valueline(self.data);

		self.svg.append("path")
			.attr("class", "line")
			.attr("d", line);
	};

	miChart.prototype.drawAxis = function(){
		var self = this;

		// Add the X Axis
		self.svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + self.height + ")")
			.call(self.xAxis);

		// Add the Y Axis
		self.svg.append("g")
			.attr("class", "y axis")
			.call(self.yAxis);
	};

	window.miChart = miChart;

	return miChart;
});
