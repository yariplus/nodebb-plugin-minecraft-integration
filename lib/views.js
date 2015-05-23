"use strict";

var Views = { },

	NodeBB = require('./nodebb'),
	Config = require('./config'),

	fs = require('fs'),
	path = require('path'),
	async = require('async');

Views.buildAdminHeader = function (custom_header, next) {
	custom_header.plugins.push({
		"route": '/plugins/minecraft-integration',
		"icon": 'fa-edit',
		"name": 'Minecraft Integration'
	});

	return next(null, custom_header);
};

Views.getWidgets = function (widgets, next) {
	var _widgets = [
		{
			widget: "widgetMCDynmapMiniMap",
			name: "Dynmap Mini Map",
			description: "Shows a small Map.",
			content: 'admin/widgets/map.tpl'
		},
		{
			widget: "widgetMCOnlinePlayersGraph",
			name: "Minecraft Online Players Graph",
			description: "Shows a graph showing online players over time.",
			content: 'admin/widgets/online-players-graph.tpl'
		},
		{
			widget: "widgetMCOnlinePlayersGrid",
			name: "Minecraft Online Players Grid",
			description: "Shows the avatars of all online players or a group of specific players.",
			content: 'admin/widgets/online-players-grid.tpl'
		},
		{
			widget: "widgetMCServerStatus",
			name: "Minecraft Server Status",
			description: "Lists information on a Minecraft server.",
			content: 'admin/widgets/status.tpl'
		},
		{
			widget: "widgetMCTopPlayersGraph",
			name: "Minecraft Top Players Graph",
			description: "A graphic chart (Pie, Donut, or Bar) representing the top players' approximate play time.",
			content: 'admin/widgets/top-players-graph.tpl'
		},
		{
			widget: "widgetMCTopPlayersList",
			name: "Minecraft Top Players List",
			description: "Lists avatars of players sorted by their approximate play time.",
			content: 'admin/widgets/top-list.tpl'
		}
	];

	async.each(_widgets, function (widget, next) {
		NodeBB.app.render(widget.content, {servers: Config.getServers()}, function (err, content) {
			NodeBB.translator.translate(content, function (content) {
				widget.content = content;
				next();
			});
		});
	}, function (err) {
		widgets = widgets.concat(_widgets);
		next(null, widgets);
	});
};

module.exports = Views;
