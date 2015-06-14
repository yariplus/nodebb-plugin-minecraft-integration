"use strict";

var TopGraph = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

TopGraph.render = function (data, callback) {
	callback(null, data);
};

module.exports = TopGraph;
