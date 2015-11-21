"use strict";

var Views = { },

	NodeBB = require('./nodebb'),
	Config = require('./config'),

	fs = require('fs'),
	path = require('path'),
	async = require('async');

Views.init = function () {

	function renderMinecraftProfile(req, res, next) {

		async.waterfall([
			async.apply(NodeBB.User.getUidByUserslug, req.params.user),
			async.apply(NodeBB.User.getUserData),
			function (userData, next) {
				if (!(userData && userData.yuuid)) return next();
				NodeBB.db.getObject('yuuid:' + userData.yuuid, next);
			}
		], function (err, minecraftProfile) {
			res.render('minecraft_profile', { minecraftProfile: minecraftProfile });
		});

	}

	NodeBB.router.get('/map', NodeBB.middleware.buildHeader, function render(req, res, next) {
		res.send('Test');
	});
	NodeBB.router.get('/api/user/:user/minecraft', renderMinecraftProfile);
	NodeBB.router.get('/user/:user/minecraft', NodeBB.middleware.buildHeader, renderMinecraftProfile);
};

Views.buildAdminHeader = function (custom_header, next) {
	custom_header.plugins.push({
		"route": '/plugins/minecraft-integration',
		"icon": 'fa-cube',
		"name": 'Minecraft Integration'
	});

	return next(null, custom_header);
};

Views.getWidgets = function (widgets, next) {
	var _widgets = [
		{ widget: "mi-chat",          name: "Minecraft Chat",              content: 'admin/widgets/chat.tpl',          description: "Shows a shoutbox-like area connected to the in-game chat."},
		{ widget: "mi-map",           name: "Minecraft Mini Map",          content: 'admin/widgets/map.tpl',           description: "Shows a small Map."},
		{ widget: "mi-players-graph", name: "Minecraft Players Graph",     content: 'admin/widgets/players-graph.tpl', description: "Shows a graph showing players over time." },
		{ widget: "mi-players-grid",  name: "Minecraft Players Grid",      content: 'admin/widgets/players-grid.tpl',  description: "Shows the avatars of all online players or a group of specific players." },
		{ widget: "mi-status",        name: "Minecraft Server Status",     content: 'admin/widgets/status.tpl',        description: "Lists information on a Minecraft server." },
		{ widget: "mi-top-graph",     name: "Minecraft Top Players Graph", content: 'admin/widgets/top-graph.tpl',     description: "A graphic chart (Pie, Donut, or Bar) representing the top players' based on a specific statistic." },
		{ widget: "mi-top-list",      name: "Minecraft Top Players List",  content: 'admin/widgets/top-list.tpl',      description: "Lists avatars representing the top players' based on a specific statistic." },
		{ widget: "mi-tps-graph",     name: "Minecraft TPS Graph",         content: 'admin/widgets/tps-graph.tpl',     description: "Shows the approximate tick time of the server over time." }
		// { widget: "mi-directory",     name: "Minecraft Player Directory",  content: 'admin/widgets/directory.tpl',     description: "Find and view information on players." }
		// { widget: "mi-gallery",       name: "Minecraft Gallery",           content: 'admin/widgets/gallery.tpl',       description: "A gallery of player uploaded screenshots." }
		// { widget: "mi-ping-graph",    name: "Minecraft Ping Graph",        content: 'admin/widgets/players-graph.tpl', description: "Shows the ping (network latency) of the server over time." }
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
