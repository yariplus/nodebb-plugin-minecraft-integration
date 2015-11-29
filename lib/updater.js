// Updates some information on a schedule.
// It does nothing special at the moment, only here for future plans.

"use strict";

var NodeBB     = require('./nodebb'),
	Backend    = require('./backend'),
	Config     = require('./config'),
	Controller = require('./controller'),

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

			Backend.getServerStatus(server, function (err, status) {

				if (err || !status) return;

				if (status.updateTime && parseInt(status.updateTime, 10) + 1000 * 60 * 3 < updateTime) {

					// We haven't received a status update in 3 minutes, the server is probably offline.
					status.isServerOnline = "0";
					status.updateTime = updateTime;

					console.log("OLD UPDATE:", status);
					Backend.updateServerStatus(status);
					Controller.sendStatusToUsers(status);

				}

			});

		});

	});

	// Schedule next update.
	Updater.init();

};
