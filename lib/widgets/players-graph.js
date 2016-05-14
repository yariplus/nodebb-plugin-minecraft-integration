"use strict";

var PlayersGraph = { };

var Backend = require('../backend');
var Config  = require('../config');
var NodeBB  = require('../nodebb');
var Utils   = require('../utils');

var miChart = require('../../public/js/vendor/michart.js');

PlayersGraph.document = require('jsdom').jsdom();

PlayersGraph.render = function (widget, callback) {
	Backend.getRecentPings({sid: widget.sid, last: 20}, function (err, pings) {
		if (err || !pings) pings = [];

		widget.pings = JSON.stringify(pings);
		widget.chartColorFills = JSON.stringify([widget.chartColorFillMin, widget.chartColorFillMax]);

		var chart = new miChart({
			type: 'bar',
			data: pings,
			getValueY: function(d){ return d.players.length; },
			minY: 0,
			bufferY: 2,
			maxY: 33
		});

		widget.svg = chart.el.node().outerHTML;

		callback(null, widget);
	});
};

module.exports = PlayersGraph;
