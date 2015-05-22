"use strict";

var	MinecraftIntegration = {
		Widgets: require('./lib/widgets'),
		Hooks: require('./lib/hooks')
	},

	Backend = require('./lib/backend'),
	Config  = require('./lib/config'),
	NodeBB  = require('./lib/nodebb'),
	Sockets = require('./lib/sockets'),
	Utils   = require('./lib/utils'),
	Views   = require('./lib/views');

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

	NodeBB.router.get('/api/minecraft-integration/server/:sid', function (req, res, next) {
		Config.getServerStatus(req.params.sid, function (data) {
			res.json(data);
		});
	});

	NodeBB.SocketAdmin.settings.syncMinecraftIntegration = function(){
		Config.settings.sync(function(){
			Config.logSettings();
		});
	};

	NodeBB.SocketAdmin.settings.resetMinecraftIntegration = function(){
		Config.settings.reset(Config.logSettings);
	};

	setTimeout(Config.logSettings, 3000);
	setTimeout(Backend.updateServers, 2000);
	Sockets.init();

	next();
};

module.exports = MinecraftIntegration;
