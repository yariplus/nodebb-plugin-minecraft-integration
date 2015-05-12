"use strict";

var NodeBB = require('./nodebb'),
	app = NodeBB.app,
	Rainbow = require('./vendor/rainbowvis.js'),
	Widgets = {
		ServerStatus: require('./widgets/status'),
		DynmapMiniMap: { render: function (widget, callback) { callback(null, ''); } },
		OnlinePlayersGraph: { render: function (widget, callback) { callback(null, ''); } },
        OnlinePlayersGrid: { render: function (widget, callback) { callback(null, ''); } },
        TopPlayersGraph: { render: function (widget, callback) { callback(null, ''); } },
        TopPlayersList: { render: function (widget, callback) { callback(null, ''); } }
	};

module.exports = Widgets;
