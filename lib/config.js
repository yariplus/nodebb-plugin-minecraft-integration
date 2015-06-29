"use strict";

// Functions to pull info from the database and admin page.

var Config = {
		getServer: getServer,
	},

	NodeBB = require('./nodebb'),

	async = require('async'),
	util = require('util'),
	request = require('request'),

	defaultSettings = {
		'serverPingFrequency': '1000',
		'avatarCDN': "mojang",
		'avatarSize': "40",
		'avatarStyle': "flat",
		'servers': [],
		'pingExpiry': 365
	},
	cdns = {
		mojang: {
			format: "http://s3.amazonaws.com/MinecraftSkins/{name}.png"
		},
		cravatar: {
			format: "http://cravatar.eu/avatar/{name}/{size}"
		},
		signaturecraft: {
			format: "http://signaturecraft.us/avatars/{size}/face/{name}.png"
		},
		minotar: {
			format: "http://minotar.net/avatar/{name}/{size}"
		},
	};

Config.settings = new NodeBB.Settings('minecraft-integration', '0.4.0', defaultSettings);

// TODO: Make all of these have callbacks.

function getServer(sid) {
	return Config.settings.get('servers')[sid];
};

Config.getServerByName = function (name, callback) {
	async.detect(Config.settings.get('servers'), function(server, next){
		next(server.name === name ? true : false);
	}, function(server){
		callback(server === void 0, server);
	});
};

Config.getServers = function (getActiveOnly) {
	var data = [], di, sid, servers = Config.settings.get('servers');
	for (sid in servers){
		if (!getActiveOnly || servers[sid].active) {
			di = data.push(JSON.parse(JSON.stringify(servers[sid]))) - 1;
			if (!data[di].active) data[di].name = servers[sid].name + ' (Inactive)';
			data[di].sid = sid;
		}
	}
	return data;
};

Config.getActiveServers = function () {
	return Config.getServers(true);
};

Config.getServerNames = function (getActiveOnly) {
	var serverNames = [],
		server;
	for (server in Config.settings.get('servers')){
		serverNames.push(server.name);
	}
	return serverNames;
};

Config.getActiveServerNames = function () {
	return Config.getServerNames(true);
};

Config.getServerStatus = function (sid, callback) {
	NodeBB.db.getObject('mi:server:' + sid, function (err, status) {
		if (err) {
			console.log(err);
			callback({ });
		}else{
			try {
				if (status.players && typeof status.players === 'string' && status.players !== 'undefined') status.players = JSON.parse(status.players);
				if (status.modList && typeof status.modList === 'string' && status.modList !== 'undefined') status.modList = JSON.parse(status.modList);
				if (status.pluginList && typeof status.pluginList === 'string' && status.pluginList !== 'undefined') status.pluginList = JSON.parse(status.pluginList);
			}catch(e){
				console.log("JSON ERROR: " + e);
			}
			status.sid = sid;
			if (Config.getServer(sid).hidePlugins) status.pluginList = [ ];
			callback(status);
		}
	});
};

Config.logServers = function (getActiveOnly) {
	console.log('[Minecraft Integration] Loggging servers...');
	var servers = Config.settings.get('servers');

	async.each(servers, function (server, next) {
		var serverNum = servers.indexOf(server);

		if (!getActiveOnly || servers[serverNum].active) {
			NodeBB.db.getObject('mi:server:' + serverNum, function (err, data) {
				if (err) {
					console.log(err);
				}else{
					data.icon = data.icon ? true : false;
					data.pluginList = data.pluginList ? true : false;
					data.modList = data.modList ? true : false;
					console.log('[Minecraft Integration] [' + server.name + '] SERVER STATUS:\n', util.inspect(data, { showHidden: true, depth: null }));
				}
			});
			Config.getRecentPings(serverNum, 2, function (pings) {
				console.log('[Minecraft Integration] [' + server.name + '] LAST 3 PINGS:\n', util.inspect(pings, { showHidden: true, depth: null }));
			});
		}
		next();
	});
};

Config.getRecentPings = function (sid, amount, callback) {
	var pings = { };

	if (typeof amount === 'function') {
		callback = amount;
		amount = 10;
	}

	NodeBB.db.getListRange('mi:server:' + sid + ':pings', 0, amount, function (err, stamps) {
		if (err) {
			console.log("stamps err: ", err);
			return callback({ });
		}else{
			async.eachSeries(stamps, function (stamp, next) {
				NodeBB.db.getObject('mi:server:' + sid + ':ping:' + stamp, function (err, ping) {
					if (err) {
						console.log("ping err: ", err);
						return next(err);
					}
					if (typeof ping.players !== 'string') return next();

					try {
						ping.players = JSON.parse(ping.players);
					}catch(e){
						console.log("JSON ERROR: " + e);
					}

					if (amount === "1") {
						pings = pings = ping;
					}else{
						pings[stamp] = ping;
					}

					next();
				});
			}, function (err) {
				if (err) {
					console.log("pings err: ", err);
					return callback({ });
				}

				return callback(pings);
			});
		}
	});
};

Config.logActiveServers = function () {
	Config.logServers(true);
};

Config.logSettings = function () {
	console.log(util.inspect(Config.settings.get(), { showHidden: true, depth: null }));
};

Config.getPingExpiry = function () {
	return Config.settings.get('pingExpiry') ? (Config.settings.get('pingExpiry') * 24 * 60 * 60) : (365 * 24 * 60 * 60);
};

Config.getAvatarUrl = function (data) {
	var cdn = Config.settings.get('avatarCDN');

	if (cdn === 'custom') {
		cdn = Config.settings.get('customCDN');
	}else{
		cdn = cdns[Config.settings.get('avatarCDN')].format;
	}

	if (data && data.name) cdn = cdn.replace("{name}", data.name);
	if (data && data.size) cdn = cdn.replace("{size}", data.size);

	return cdn;
};

Config.setAvatar = function (data) {
};

Config.getAvatarByPlayer = function (data, callback) {
	if (!data || !data.player || typeof data.player !== 'string') return callback(new Error('[[invalid_player]]'));

	var player = data.player.toLowerCase(),
		key    = 'avatar:' + data.player;

	NodeBB.db.get(key, function (err, base64) {
		if (err) console.log(err);

		if (!base64) {
			var url = Config.getAvatarUrl({name: player, size: Config.settings.get('avatarSize')});

			request({url: url, encoding: null}, function (err, response, body) {
				if (err) return callback(err);

				var avatar = new Buffer(body);

				base64 = avatar.toString('base64');

				NodeBB.db.set(key, base64, function (err) {
					if (err) return callback(err);

					// Expire the avatar.
					NodeBB.db.expire(key, Config.getAvatarExpiry());

					if (data.base64) {
						callback(null, base64);
					}else{
						callback(null, avatar);
					}
				});
			});
		}else{
			if (data.base64) {
				callback(null, base64);
			}else{
				callback(null, new Buffer(base64, 'base64'));
			}
		}
	});
};

Config.getAvatar = Config.getAvatarByPlayer;

Config.getAvatarExpiry = function () {
	// An hour
	// TODO: Make it a config option.
	return 60 * 60;
};

Config.getPlaytimes = function (callback) {
	NodeBB.db.getSortedSetRangeWithScores('yuuid:playtime', 0, -1, function (err, data) {
		callback(err, data);
	});
};

Config.getTopPlayersByPlaytimes = function (amount, callback) {
	NodeBB.db.getSortedSetRevRangeByScore('yuuid:playtime', 0, amount, '+inf', 0, function (err, data) {
		async.map(data, Config.getUuidWithUuid, callback);
	});
};

Config.getUuid = function (uuid, callback) {
	NodeBB.db.getObject('yuuid:' + uuid, function (err, data) {
		callback(err, data);
	});
};

Config.getUuidWithUuid = function (uuid, callback) {
	Config.getUuid(uuid, function (err, data) {
		data.uuid = uuid;
		callback(err, data);
	});
};

Config.getUuidWithAvatar = function (uuid, callback) {
	Config.getUuid(uuid, function (err, data) {
		data.uuid = uuid;
		Config.getAvatar({base64: true, name: player.playername}, function (err, avatar) {
			data.avatar = avatar;
			callback(err, data);
		});
	});
};

Config.getPlayers = function (callback) {
	NodeBB.db.getSortedSetRange('yuuid:sorted', 0, -1, function (err, data) {
		callback(err, data);
	});
};

Config.getUuids = function (callback) {
	Config.getPlayers(function (err, data) {
		var uuids = { };
		for (var i in data) {
			var split = data[i].split(':');
			if (!uuids[split[0]]) uuids[split[0]] = split[1];
		}
		callback(err, uuids);
	});
};

Config.getUsernameByUuid = function (uuid, callback) {
	NodeBB.db.sortedSetScore('yuuid:uid', uuid, function (err, uid) {
		NodeBB.User.getUsernamesByUids([uid], function (err, username) {
			callback(err, username[0]);
		});
	});
};

Config.getUsers = function (callback) {
	Config.getUuids(function (err, uuids) {
		if (err || !uuids) return callback(new Error("No users."));

		var uids = [ ];

		for (var uuid in uuids) {
			uids.push(uuids[uuid]);
		}

		NodeBB.User.getUsersData(uids, callback);
	});
};

Config.getUserByUuid = function (uuid, callback) {
	NodeBB.db.sortedSetScore('yuuid:uid', uuid, function (err, uid) {
		if (err || !uid || uid < 1) return callback(new Error("No user."));

		NodeBB.User.getUserData(uid, function (err, userData) {
			callback(err, userData);
		});
	});
};

module.exports = Config;
