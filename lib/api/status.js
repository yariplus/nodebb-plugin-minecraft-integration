"use strict";

var	async = require('async'),

	Backend    = require('../backend'),
	Controller = require('../controller'),
	NodeBB     = require('../nodebb'),
	Utils      = require('../utils');

module.exports = function (API) {

	API.updateServerStatus = function (status, next) {

		var	updateTime = Math.round(Date.now()/60000) * 60000,
			sid = status.sid,
			tps = status.tps;

		status.isServerOnline = "1";
		status.players        = status.players    || [];
		status.pluginList     = status.pluginList || [];
		status.hasPlugins     = status.pluginList.length;
		status.modList        = status.modList    || [];
		status.hasMods        = status.modList.length;
		status.updateTime     = updateTime;

		// Sort Plugins
		status.pluginList = status.pluginList.sort(function(a, b) {
			return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
		});

		// Trim UUIDs to Mojang format.
		status.players.forEach(function(player){
			if (!player.id) return;
			player.id = Utils.trimUUID(player.id);
		});

		// Store the player statistics in the database.
		async.each(status.players, function (player, next) {

			// Skip if no uuid.
			if (!player.id) next();

			// TODO: BungeeCord Support
			// BungeeCord proxies will need their player UUIDs verified, since they run in offline mode.
			// A proper proxy would be running a Spigot derivative with BungeeCord pass-through set, but
			// we can't count on that.

			// Skip if invalid uuid.
			// function verifyUUID(id, next) {
				// Utils.getPlayerNameUsingUUID(id, function (err, name) {
					// if (err) return next(err);
				// });
			// }

			// Utils.getPlayerNameUsingUUID(player.id, function (err, valid) {
				// if (err)
			// });

			// DEPRECIATED: Future versions will track playtime using the Minecraft Plugin or OnTime.
			async.parallel({
				playtime: function (next) {
					NodeBB.db.getObjectField('yuuid:' + player.id, 'lastonline', function (err, data) {
						if (parseInt(data) !== updateTime) {
							NodeBB.db.setObjectField('yuuid:' + player.id, 'lastonline', updateTime);
							NodeBB.db.incrObjectField('yuuid:' + player.id, 'playtime', next);
						}else{
							NodeBB.db.getObjectField('yuuid:' + player.id, 'playtime', next);
						}
					});
				},
				name: async.apply(NodeBB.db.setObjectField, 'yuuid:' + player.id, 'name', player.name)
			}, function (err, results) {
				if (err) {
					console.log('[Minecraft Integration] Error setting player object ' + player.id + ': ' + err);
				}else{
					NodeBB.db.sortedSetAdd('yuuid:playtime', results.playtime || "0", player.id, function (err) {
					});
				}
			});
		});

		async.waterfall([
			async.apply(Backend.updateServerStatus, status),
			function (next) {
				API.getServerStatus({sid:status.sid}, function (err, status) {
					Controller.sendStatusToUsers(status);
				});
				next();
			}
		], next);

	};

	API.getServerStatus = function (data, callback) {
		if (!(data && typeof data.sid !== 'undefined')) return callback(new Error("Invalid data."));

		var sid = data.sid;

		async.parallel({
			status: async.apply(Backend.getServerStatus, sid),
			config: async.apply(Backend.getServerConfig, {sid: sid})
		}, function (err, results) {
			if (err) return callback(err);

			var status = results.status;
			var config = results.config;

			if (!config) return callback(new Error("getServerStatus() No config exists for SID " + sid));
			if (!status) return callback(new Error("getServerStatus() No status exists for SID " + sid + " named " + config.name));

			// Parsed as arrays.
			try {
				if (status.players    && typeof status.players    === 'string' && status.players    !== 'undefined') status.players    = JSON.parse(status.players);
				if (status.modList    && typeof status.modList    === 'string' && status.modList    !== 'undefined') status.modList    = JSON.parse(status.modList);
				if (status.pluginList && typeof status.pluginList === 'string' && status.pluginList !== 'undefined') status.pluginList = JSON.parse(status.pluginList);
			}catch(e){
				console.log("Bad Status", status);
				return callback(e);
			}

			// Parsed as integers.
			status.maxPlayers = parseInt(status.maxPlayers, 10);
			status.onlinePlayers = parseInt(status.onlinePlayers, 10);

			// Parsed as booleans.
			status.isServerOnline = !!parseInt(status.isServerOnline, 10);
			status.hasMods = !!parseInt(status.hasMods, 10);
			status.hasPlugins = !!parseInt(status.hasPlugins, 10);

			// Strings
			status.sid = sid;
			status.address = config.address;
			status.version = Utils.parseVersion(status.version || 'unknown');

			// Hide plugins.
			if (parseInt(config.hidePlugins, 10)) status.pluginList = [ ];

			callback(null, status);
		});
	};

	API.eventPlayerJoin = function (data, callback) {

		// Assert parameters.
		if (!(data && data.id && data.name)) return callback();

		var name     = data.name;
		var nick     = data.nick;
		var id       = data.id;
		var prefix   = data.prefix;
		var suffix   = data.suffix;
		var groups   = data.groups;
		var playtime = data.playtime;

		// Parse prefix data.
		if (prefix || groups) {

			var	newPrefix = '';
			var primaryGroup = '';

			// MEMO: Research perm plugins which would assign primary groups to personal prefix.
			if (prefix) {
				var dupe = false;
				for (var i in groups) {
					if (prefix === groups[i].prefix) dupe = true;
				}
				if (!dupe) newPrefix = newPrefix + ' ' + Utils.parseFormatCodes(prefix);
			}

			if (groups) {
				for (var i in groups) {
					newPrefix = Utils.parseFormatCodes(groups[i].prefix) + ' ' + newPrefix;
				}
			}

			NodeBB.db.setObjectField('yuuid:' + id, 'prefix', newPrefix);
		}

		async.parallel({
			player: function (next) {

				// TODO:
				// I can get rid off all this nonsense by storing players in a set 'mi:server:sid:players'
				// Could use a sortedSet with lexicon stored names, or just a plain set with uuids.
				NodeBB.db.getObjectField('mi:server:' + data.sid, 'players', function (err, players) {
					if (err) return console.log(err);

					var found = false;

					try {
						players = JSON.parse(players);
					}catch(e){
						return console.log("Bad Players Object", e);
					}

					for (var i in players) {
						if (players[i] === null) continue;
						if (players[i].id === id) found = true;
					}
					if (!found) {
						players.push({id: id, name: name});

						try {
							players = JSON.stringify(players);
						}catch(e){
							return console.log(e);
						}

						// Updates widgets with new player.
						Controller.sendPlayerJoinToUsers({sid: data.sid, player: {id: id, name: name}});

						NodeBB.db.setObjectField('mi:server:' + data.sid, 'players', players, function (err) {
							if (err) console.log(err);
							next();
						});
					}else{
						next();
					}
				});
			},
			user: function (next) {
				Backend.getUser({id: id}, function (err, user) {
					next(null, user || null);
				});
			}
		}, callback);
	};

	API.eventPlayerQuit = function (data, next) {

		// Assert parameters.
		if (!(data && data.id && data.name)) return next();

		var	name = data.name,
			id   = data.id;

		NodeBB.db.getObjectField('mi:server:' + data.sid, 'players', function (err, players) {
			if (err) {
				console.log(err);
				return next();
			}

			try {
				players = JSON.parse(players);
			}catch(e){
				console.log(e);
				return next();
			}

			// TODO: Make this part not suck.
			for (var i in players) {
				if (players[i].id === id) {
					players.splice(i, 1);
				};
			}
			try {
				players = JSON.stringify(players);
				NodeBB.db.setObjectField('mi:server:' + data.sid, 'players', players, function (err) {
					if (err) return console.log(err);
				});
				Controller.sendPlayerQuitToUsers({sid: data.sid, player: {id: id, name: name}});
			}catch(e){
				console.log(e);
			}

			return next();
		});
	};

};
