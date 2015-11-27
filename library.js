"use strict";

var	MinecraftIntegration = module.exports = {
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

MinecraftIntegration.load = function (params, next) {

	NodeBB.app        = params.app;
	NodeBB.router     = params.router;
	NodeBB.middleware = params.middleware;

	NodeBB.init();
	API.init();
	Views.init();
	Admin.init();

	setTimeout(Config.logSettings, 5000);
	setTimeout(Updater.updateServers, 10000);

	next();

};
