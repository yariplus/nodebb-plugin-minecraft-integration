"use strict";

var	Admin   = require('./lib/admin')
,	API     = require('./lib/api')
,	Backend = require('./lib/backend')
,	Config  = require('./lib/config')
,	NodeBB  = require('./lib/nodebb')
,	Utils   = require('./lib/utils')
,	Updater = require('./lib/updater')
,	Views   = require('./lib/views')

,	MinecraftIntegration = module.exports =
	{
		Widgets: require('./lib/widgets'),
		Hooks: require('./lib/hooks')
	};

NodeBB.emitter.once('nodebb:ready', Views.modifyTemplates);

MinecraftIntegration.load = function (params, next) {

	NodeBB.app        = params.app;
	NodeBB.router     = params.router;
	NodeBB.middleware = params.middleware;

	NodeBB.init();
	API.init();
	Views.init();
	Admin.init();

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
