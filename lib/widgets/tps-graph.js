"use strict";

var TPSGraph = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

TPSGraph.render = function (data, callback) {
	callback(null, data);
};

module.exports = TPSGraph;
