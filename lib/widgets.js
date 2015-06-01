"use strict";

var Rainbow = require('./vendor/rainbowvis.js'),
	Widgets = {
		Chat: { render: function (widget, callback) { callback(null, ''); } },
		Directory: { render: function (widget, callback) { callback(null, ''); } },
		Gallery: { render: function (widget, callback) { callback(null, ''); } },
		Map: { render: function (widget, callback) { callback(null, ''); } },
		PingGraph: { render: function (widget, callback) { callback(null, ''); } },
		PlayersGraph: require('./widgets/players-graph'),
		PlayersGrid: require('./widgets/players-grid'),
		Status: require('./widgets/status'),
		TopGraph: { render: function (widget, callback) { callback(null, ''); } },
		TopList: { render: function (widget, callback) { callback(null, ''); } },
		TPSGraph: { render: function (widget, callback) { callback(null, ''); } }
	};

console.log(Widgets);

module.exports = Widgets;
