"use strict";

var PlayersGraph = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

PlayersGraph.render = function (data, callback) {
	callback(null, data);
};

module.exports = PlayersGraph;
