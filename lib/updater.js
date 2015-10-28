// Updates some information on a schedule.

"use strict";

var NodeBB     = require('./nodebb'),
	Backend    = require('./backend'),
	Config     = require('./config'),

	updateTime = 0,
	scheduler,

	Updater = module.exports = { };

NodeBB.pubsub.on('meta:reload', function () {
	if (scheduler) clearTimeout(scheduler);
});

Updater.init = function () {
	if (scheduler) clearTimeout(scheduler);
	scheduler = setTimeout(Updater.updateServers, 60000);
};

Updater.updateServers = function () {

	// Get the current minute.
	updateTime = Math.round(Date.now()/60000) * 60000;

	// Remove old avatars from cache.
	Backend.clearOldAvatars();

	Config.settings.get('servers').forEach(function (server) {

		// TODO: Add "Unknown" status for inactive servers.
		if (!server.active) return next();

		// TODO: Add socket connection status.
		if (NodeBB.SocketIO.server.sockets.connected[server.socketid]) return next();

	});

	// Schedule next update.
	Updater.init();

};
