"use strict";

var PlayersGraph = { };

var Backend = require('../backend');
var Config  = require('../config');
var NodeBB  = require('../nodebb');
var Utils   = require('../utils');

PlayersGraph.render = function (widget, callback) {
	Backend.getRecentPings({sid: widget.sid, last: 20}, function (err, pings) {
		if (err || !pings) pings = [];

		widget.pings = JSON.stringify(pings);
		widget.chartColorFills = JSON.stringify([widget.chartColorFillMin, widget.chartColorFillMax]);

		callback(null, widget);
	});
};

module.exports = PlayersGraph;
