"use strict";

var PingGraph = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

PingGraph.render = function (data, callback) {
	callback(null, data);
};

module.exports = PingGraph;
