"use strict";

// All your sanity and wits, they will all vanish, I promise.

(function(){

var	NodeBB = require('./lib/nodebb'),
	Hooks = require('./lib/hooks'),
	Config = require('./lib/config'),
	Backend = require('./lib/backend'),
	Views = require('./lib/views'),
	MinecraftWidgets = { Widgets: require('./lib/widgets') };

MinecraftWidgets.load = function(data, next){
	// Delegate arguments
	if (arguments.length === 2) {
		// NodeBB version >=0.6.0
		NodeBB.app = data.app;
		NodeBB.router = data.router;
		NodeBB.middleware = data.middleware;
	}else if(arguments.length === 4 && typeof arguments[3] === 'function') {
		// NodeBB version <=0.5.0
		NodeBB.app = data;
		NodeBB.router = data;
		NodeBB.middleware = next;
		next = arguments[3];
	}else{
		return console.log("MinecraftWidgets: " + "Failed to load plugin. Invalid arguments found for app.load(). Are you sure you're using a compatible version of NodeBB?");
	}

	function render(req, res, next) {
		res.render('admin/plugins/minecraft-integration', { });
	}

	NodeBB.router.get('/admin/plugins/minecraft-integration', NodeBB.middleware.admin.buildHeader, render);
	NodeBB.router.get('/api/admin/plugins/minecraft-integration', render);
	NodeBB.router.get('/minecraft-integration/config', function (req, res) {
		res.status(200);
	});

	NodeBB.SocketAdmin.settings.syncMinecraftIntegration = function(){
		Config.settings.sync(function(){
			Config.logSettings();
		});
	};

	NodeBB.SocketAdmin.settings.resetMinecraftIntegration = function(){
		Config.settings.reset(Config.logSettings);
	};

	setTimeout(Config.logSettings, 5000);
	Views.loadTemplates();
	Backend.init();

	next();
};

MinecraftWidgets.getWidgets = function(widgets, next){
	widgets = widgets.concat([
		{
			widget: "widgetMCDynmapMiniMap",
			name: "Dynmap Mini Map",
			description: "Shows a small Map.",
			content: Views.render('admin/adminWidgetMCDynmapMiniMap.tpl')
		},
		{
			widget: "widgetMCOnlinePlayersGraph",
			name: "Minecraft Online Players Graph",
			description: "Shows a graph showing online players over time.",
			content: Views.render('admin/adminWidgetMCOnlinePlayersGraph.tpl')
		},
		{
			widget: "widgetMCOnlinePlayersGrid",
			name: "Minecraft Online Players Grid",
			description: "Shows the avatars of online players.",
			content: Views.render('admin/adminWidgetMCOnlinePlayersGrid.tpl')
		},
		{
			widget: "widgetMCServerStatus",
			name: "Minecraft Server Status",
			description: "Lists information on a Minecraft server.",
			content: Views.render('admin/adminWidgetMCServerStatus.tpl')
		},
		{
			widget: "widgetMCTopPlayersGraph",
			name: "Minecraft Top Players Graph",
			description: "A graphic chart (Pie, Donut, or Bar) representing the top players' approximate play time.",
			content: Views.render('admin/adminWidgetMCTopPlayersGraph.tpl')
		},
		{
			widget: "widgetMCTopPlayersList",
			name: "Minecraft Top Players List",
			description: "Lists avatars of players sorted by their approximate play time.",
			content: Views.render('admin/adminWidgetMCTopPlayersList.tpl')
		}
	]);

	next(null, widgets);
};

MinecraftWidgets.buildAdminHeader = function(custom_header, next){
	custom_header.plugins.push({
		"route": '/plugins/minecraft-integration',
		"icon": 'fa-edit',
		"name": 'Minecraft Integration'
	});

	return next(null, custom_header);
};

	module.exports = MinecraftWidgets;

}());
