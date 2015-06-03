"use strict";

var PlayersGrid = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

PlayersGrid.render = function (widget, callback) {
	NodeBB.app.render('widgets/players-grid', widget.data, function(err, html) {
		NodeBB.translator.translate(html, function(translatedHTML) {
			callback(err, translatedHTML);
		});
	});
};

module.exports = PlayersGrid;
