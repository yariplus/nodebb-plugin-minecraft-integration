"use strict";

var PlayersGraph = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

PlayersGraph.render = function (widget, callback) {
	NodeBB.app.render('widgets/players-graph', widget.data, function(err, html) {
		NodeBB.translator.translate(html, function(translatedHTML) {
			callback(err, translatedHTML);
		});
	});
};

module.exports = PlayersGraph;
