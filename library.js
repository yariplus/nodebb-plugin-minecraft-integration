"use strict";

// All your sanity and wits, they will all vanish, I promise.

(function(){

var	NodeBB = require('./lib/nodebb'),
	Config = require('./lib/config'),
	Backend = require('./lib/backend'),
	Views = require('./lib/views'),
	MinecraftIntegration = {
		Widgets: require('./lib/widgets'),
		Hooks: require('./lib/hooks')
	};

MinecraftIntegration.load = function (data, next) {
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
		return console.log("MinecraftIntegration: " + "Failed to load plugin. Invalid arguments found for app.load(). Are you sure you're using a compatible version of NodeBB?");
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
	Backend.init();

	next();
};

MinecraftIntegration.buildAdminHeader = function(custom_header, next){
	custom_header.plugins.push({
		"route": '/plugins/minecraft-integration',
		"icon": 'fa-edit',
		"name": 'Minecraft Integration'
	});

	return next(null, custom_header);
};

	module.exports = MinecraftIntegration;

}());
