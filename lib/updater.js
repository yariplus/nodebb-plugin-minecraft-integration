// Updates some information on a schedule.
// It does nothing special at the moment, only here for future plans.

"use strict";

var NodeBB     = require('./nodebb');
var API        = require('./api');
var Backend    = require('./backend');
var Config     = require('./config');
var Controller = require('./controller');
var Utils      = require('./utils');

var async = require('async');
var winston = require('winston');
var nconf = require('nconf');

var updateTime = 0;
var scheduler;

var Updater = module.exports = { };

var uuidsNeedingUpdates = [];

Updater.updateUuids = function (uuids) {
	if (!Array.isArray(uuids)) return;

	for (var i in uuids) {
		if (uuidsNeedingUpdates.indexOf(uuids[i]) === -1) {
			uuidsNeedingUpdates.push(uuids[i])
		}
	}
};

function updatePlayers () {
	async.each(uuidsNeedingUpdates, function (id, next) {

		var key = 'yuuid:' + id

		// Get the name from Mojang.
		Utils.getName(id, function (err, name) {

			// Return if db error.
			if (err) return next(err);

			// Update the player object.
			NodeBB.db.setObjectField(key, 'name', name);
			NodeBB.db.setObjectField(key, 'lastupdate', Date.now());

			// Update player name cache.
			NodeBB.db.set('mi:name:' + name, id)
			NodeBB.db.expire('mi:name:' + name, Config.getPlayerExpiry());

			// Sort by last update.
			NodeBB.db.isSortedSetMember('yuuid:sorted', id, function (err, isMember) {
				if (!err && !isMember) NodeBB.db.sortedSetAdd('yuuid:sorted', Date.now(), id);
			});

			// Add to playtime cache.
			NodeBB.db.isSortedSetMember('yuuid:playtime', id, function (err, isMember) {
				if (!err && !isMember) NodeBB.db.sortedSetAdd('yuuid:playtime', 0, id);
			});

			next();
		});
	}, function () {
		uuidsNeedingUpdates = []
	})
}

NodeBB.pubsub.on('meta:reload', function () {
	if (scheduler) clearTimeout(scheduler);
});

Updater.init = function () {
	if (scheduler) clearTimeout(scheduler);
	// Only start on primary node.
	if (!(nconf.get('isPrimary') === 'true' && !nconf.get('jobsDisabled'))) return;
	scheduler = setTimeout(Updater.updateServers, 60000);
};

Updater.updateServers = function () {

	// Get the current minute.
	updateTime = Math.round(Date.now()/60000) * 60000;

	// Remove old avatars from cache.
	Backend.clearOldAvatars();

	Backend.getServersConfig({}, function (err, configs) {

		configs.forEach(function (config) {

			API.getServerStatus(config, function (err, status) {

				if (err) {
					winston.info("Error getting status for server " + config.name);
					return resetStatus(status);
				}

				if (!status) return winston.info("No status recorded for server " + config.name);

				if (!status.updateTime || parseInt(status.updateTime, 10) + 1000 * 60 < updateTime) {
					winston.info("The Minecraft server " + config.name + " is not connected to forum.");
					winston.info("Use the server's API key in the command \"/nodebb key {key}\"");
					return resetStatus(status);
				}

			});

		});

	});

	// Update players.
	updatePlayers();

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
