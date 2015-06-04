"use strict";

var Views = { },

	NodeBB = require('./nodebb'),
	Config = require('./config'),

	fs = require('fs'),
	path = require('path'),
	async = require('async');

Views.init = function () {
	NodeBB.router.get('/map', NodeBB.middleware.buildHeader, function render(req, res, next) {
		res.send('Test');
	});
};

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
			widget: "mi-chat",
			name: "Minecraft Chat",
			description: "Shows a shoutbox-like area connected to the in-game chat.",
			content: 'admin/widgets/chat.tpl'
		},
		{
			widget: "mi-directory",
			name: "Player Directory",
			description: "Find and view information on players.",
			content: 'admin/widgets/directory.tpl'
		},
		{
			widget: "mi-gallery",
			name: "Gallery",
			description: "A gallery of player uploaded screenshots.",
			content: 'admin/widgets/gallery.tpl'
		},
		{
			widget: "mi-map",
			name: "Mini Map",
			description: "Shows a small Map.",
			content: 'admin/widgets/map.tpl'
		},
		{
			widget: "mi-ping-graph",
			name: "Ping Graph",
			description: "Shows the ping (network latency) of the server over time.",
			content: 'admin/widgets/players-graph.tpl'
		},
		{
			widget: "mi-players-graph",
			name: "Players Graph",
			description: "Shows a graph showing players over time.",
			content: 'admin/widgets/players-graph.tpl'
		},
		{
			widget: "mi-players-grid",
			name: "Players Grid",
			description: "Shows the avatars of all online players or a group of specific players.",
			content: 'admin/widgets/players-grid.tpl'
		},
		{
			widget: "mi-status",
			name: "Server Status",
			description: "Lists information on a Minecraft server.",
			content: 'admin/widgets/status.tpl'
		},
		{
			widget: "mi-top-graph",
			name: "Top Players Graph",
			description: "A graphic chart (Pie, Donut, or Bar) representing the top players' based on a specific statistic.",
			content: 'admin/widgets/top-graph.tpl'
		},
		{
			widget: "mi-top-list",
			name: "Top Players List",
			description: "Lists avatars representing the top players' based on a specific statistic.",
			content: 'admin/widgets/top-list.tpl'
		},
		{
			widget: "mi-tps-graph",
			name: "TPS Graph",
			description: "Shows the approximate tick time of the server over time.",
			content: 'admin/widgets/tps-graph.tpl'
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
