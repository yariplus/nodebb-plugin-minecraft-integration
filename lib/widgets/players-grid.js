"use strict";

var PlayersGrid = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

PlayersGrid.render = function (data, callback) {
	callback(null, data);
};

module.exports = PlayersGrid;
