"use strict";

var	MinecraftIntegration = {
		Widgets: require('./lib/widgets'),
		Hooks: require('./lib/hooks')
	},

	Admin   = require('./lib/admin'),
	API     = require('./lib/api'),
	Backend = require('./lib/backend'),
	Config  = require('./lib/config'),
	NodeBB  = require('./lib/nodebb'),
	Utils   = require('./lib/utils'),
	Updater = require('./lib/updater'),
	Views   = require('./lib/views');

MinecraftIntegration.load = function (data, next) {
	if (arguments.length === 2) {
		// NodeBB version >=0.6.0
		NodeBB.app        = data.app;
		NodeBB.router     = data.router;
		NodeBB.middleware = data.middleware;
	}else if(arguments.length === 4 && typeof arguments[3] === 'function') {
		// NodeBB version <=0.5.0
		NodeBB.app        = data;
		NodeBB.router     = data;
		NodeBB.middleware = next;
		next              = arguments[3];
	}else{
		return console.log("MinecraftIntegration: " + "Failed to load plugin. Invalid arguments found for app.load(). Are you sure you're using a compatible version of NodeBB?");
	}

	NodeBB.init();
	API.init();
	Views.init();
	Admin.init();

	setTimeout(Config.logSettings, 5000);
	setTimeout(Updater.updateServers, 10000);

	next();
};

module.exports = MinecraftIntegration;
