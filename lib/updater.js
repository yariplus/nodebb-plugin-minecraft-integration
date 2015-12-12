// Updates some information on a schedule.
// It does nothing special at the moment, only here for future plans.

"use strict";

var NodeBB     = require('./nodebb'),
	Backend    = require('./backend'),
	Config     = require('./config'),
	Controller = require('./controller'),

	winston = require('winston'),

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

		//console.dir(servers);

		servers.forEach(function (server) {

			Backend.getServerStatus(server, function (err, status) {

				// console.dir({server: server.config.name, status: status});

				if (err) {
					winston.info("Error getting status for server " + server.config.name);
					return resetStatus(status);
				}

				if (!status) return winston.info("No status recorded for server " + server.config.name);

				if (!status.updateTime || parseInt(status.updateTime, 10) + 1000 * 60 < updateTime) {
					winston.info("The Minecraft server " + server.config.name + " is not connected to forum.");
					winston.info("Use the server's API key in the command \"/nodebb key {key}\"");
					return resetStatus(status);
				}

			});

		});

	});

	// Schedule next update.
	Updater.init();

};

function resetStatus(status) {

	status = status || {};

	status.isServerOnline = '0';
	status.updateTime = updateTime;
	status.players = '[]';
	status.onlinePlayers = '0';
	status.tps = '0';

	Backend.updateServerStatus(status);
	Controller.sendStatusToUsers(status);
}
