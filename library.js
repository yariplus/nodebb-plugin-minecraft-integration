"use strict";

var analytics = require('./lib/analytics');

var	Admin   = require('./lib/admin');
var API     = require('./lib/api');
var Backend = require('./lib/backend');
var Config  = require('./lib/config');
var NodeBB  = require('./lib/nodebb');
var Utils   = require('./lib/utils');
var Updater = require('./lib/updater');
var Views   = require('./lib/views');

var routes = require('./lib/routes');

var MinecraftIntegration = module.exports = {
	Widgets: require('./lib/widgets'),
	Hooks: require('./lib/hooks')
};

NodeBB.emitter.once('nodebb:ready', Views.modifyTemplates);

MinecraftIntegration.load = function (params, next) {

	NodeBB.app        = params.app;
	NodeBB.router     = params.router;
	NodeBB.middleware = params.middleware;

	NodeBB.app.set('json spaces', 4);

	NodeBB.init();
	API.init();
	Views.init();
	Admin.init();

	routes();

	// Add a default server.
	NodeBB.db.getObject('mi:server:0:config', function (err, config) {

		if (err) return next(new Error(err));

		config = config || {};
		config.name        = config.name        || "A Minecraft Server";
		config.address     = config.address     || (require('nconf').get('url') + ":25565");
		config.APIKey      = config.APIKey      || Utils.getKey(),
		config.hidePlugins = config.hidePlugins || "0";

		NodeBB.db.setObject('mi:server:0:config', config);
		NodeBB.db.sortedSetAdd('mi:servers', Date.now(), '0');

		setTimeout(Config.logSettings, 5000);
		setTimeout(Updater.updateServers, 10000);

		next();

	});

};
