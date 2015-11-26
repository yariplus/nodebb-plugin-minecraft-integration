// Updates some information on a schedule.
// It does nothing special at the moment, only here for future plans.

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

	Backend.getServersConfig({}, function (err, servers) {

		servers.forEach(function (server) {

			// TODO: Add socket connection status.
			// if (NodeBB.SocketIO.server.sockets.connected[server.socketid]) return;

		});

	});

	// Schedule next update.
	Updater.init();

};
