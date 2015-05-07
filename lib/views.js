"use strict";

var NodeBB = require('./nodebb'),
	Config = require('./config'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	tjs = NodeBB.templates,
	// TODO: Just walk the directory.
	templatesToLoad = [
		"widgetMCDynmapMiniMap.tpl",
		"widgetMCOnlinePlayersGraph.tpl",
		"widgetMCOnlinePlayersGrid.tpl",
		"widgetMCServerStatus.tpl",
		"widgetMCTopPlayersGraph.tpl",
		"widgetMCTopPlayersList.tpl",
		"admin/adminWidgetMCDynmapMiniMap.tpl",
		"admin/adminWidgetMCOnlinePlayersGraph.tpl",
		"admin/adminWidgetMCOnlinePlayersGrid.tpl",
		"admin/adminWidgetMCServerStatus.tpl",
		"admin/adminWidgetMCTopPlayersGraph.tpl",
		"admin/adminWidgetMCTopPlayersList.tpl"
	],
	templates = {},
	Views = {
	loadTemplates: function () {
		async.each(templatesToLoad, function (template, next) {
			fs.readFile(path.resolve(__dirname, '../public/templates/' + template), function (err, data) {
				if (err) {
					console.log(err.message);
					return next(err);
				}
				templates[template] = data.toString();
				next(null);
			});
		});
	},
	render: function(template){
		template = templates[template];
		if (template) {
			return tjs.parse(template, { servers: Config.getServers() });
		}else{
			return '';
		}
	}
};

module.exports = Views;
