"use strict";

var	MinecraftIntegration = {
		Widgets: require('./lib/widgets'),
		Hooks: require('./lib/hooks')
	},

	API     = require('./lib/api'),
	Backend = require('./lib/backend'),
	Config  = require('./lib/config'),
	NodeBB  = require('./lib/nodebb'),
	Sockets = require('./lib/sockets'),
	Utils   = require('./lib/utils'),
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
	Sockets.init();

	setTimeout(Config.logSettings, 1500);
	setTimeout(Backend.updateServers, 2000);

	next();
};

module.exports = MinecraftIntegration;
