"use strict";

// Functions to pull info from the database and admin page.

// TODO: Most of these are badly named and a messy.
// Most should be in the Backend namespace if they
// primarily read from the database.

var Config = {
		getServer: getServer,
	},

	NodeBB = require('./nodebb'),
	Utils  = require('./utils'),

	async   = require('async'),
	util    = require('util'),
	request = require('request'),
	lwip    = require('lwip'),

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
			format: "http://skins.minecraft.net/MinecraftSkins/{name}.png",
			styles: {
				flat: {
					transform: function (buffer, next) {
						lwip.open(buffer, 'png', function (err, image) {
							if (err) return next(err);

							image.crop(8, 8, 15, 15, function (err, image) {
								image.resize(64, 64, "nearest-neighbor", function (err, image) {
									image.toBuffer("png", next)
								});
							});
						});
					}
				}
			}
		},
		brony: {
			format: "http://minelpskins.voxelmodpack.com/skins/{uuid}.png",
			styles: {
				flat: {
					transform: function (buffer, next) {
						lwip.open(buffer, 'png', function (err, image) {
							if (err) return next(err);

							var scale = image.height()/4;
							image.crop(scale, scale, scale*2-1, scale*2-1, function (err, image) {
								image.resize(64, 64, "nearest-neighbor", function (err, image) {
									image.toBuffer("png", next)
								});
							});
						});
					}
				}
			}
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

Config.getServerStatus = function (data, callback) {
	var sid = data.sid;

	NodeBB.db.getObject('mi:server:' + sid, function (err, status) {
		if (err) {
			console.log(err);
			callback(null, { });
		}else if (!status) {
			console.log("Error: SID was ");
			console.log(sid);
			callback(null, { });
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
			callback(null, status);
		}
	});
};

Config.getServerPlugins = function (data, next) {
	var sid = data.sid;

	NodeBB.db.getObjectField('mi:server:' + sid, 'pluginList', function (err, pluginList) {
		if (err) {
			console.log(err);
			next(err, [ ]);
		}else if (!pluginList || Config.getServer(sid).hidePlugins) {
			next(null, [ ]);
		}else{
			try {
				pluginList = JSON.parse(pluginList);
			}catch(err){
				console.log("JSON ERROR: " + err);
				return next(err, [ ]);
			}

			next(null, pluginList);
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

Config.getRecentPings = function (data, next) {
	var pings = { },
		sid = data.sid,
		amount = data.last;

	if (typeof amount === 'function') {
		next = amount;
		amount = 10;
	}

	NodeBB.db.getListRange('mi:server:' + sid + ':pings', 0, amount, function (err, stamps) {
		if (err) {
			console.log("stamps err: ", err);
			return next(err, { });
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
					return next(err, { });
				}

				return next(err, pings);
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

Config.getAvatarUrl = function (data, callback) {
	var cdn = Config.settings.get('avatarCDN');

	if (cdn === 'custom') {
		cdn = Config.settings.get('customCDN');
	}else{
		cdn = cdns[Config.settings.get('avatarCDN')].format;
	}

	if (data && data.size) {
		cdn = cdn.replace("{size}", data.size)
	}else{
		cdn = cdn.replace("{size}", Config.settings.get('avatarSize'));
	}
	if (data && data.name) cdn = cdn.replace("{name}", data.name);

	console.log("Returning avatar url for " +data.name+ ": " + cdn);

	callback(null, cdn);
};

Config.getAvatars = function (callback) {
	Config.getAvatarList(function (err, avatarList) {
		var avatars = [ ];

		async.each(avatarList, function (name, next) {
			Config.getAvatarByPlayer({name: name, base64: true}, function (err, base64) {
				avatars.push({name: name, base64: base64});
				next();
			});
		}, function (err) {
			callback(err, avatars);
		});
	});
};

Config.getAvatarList = function (callback) {
	NodeBB.db.getSortedSetRange('mi:avatars', 0, -1, function (err, data) {
		if (!err && data) {
			callback(null, data.sort());
		}else{
			callback(err, []);
		}
	});
};

Config.clearAvatars = function (callback) {
	Config.getAvatarList(function (err, avatarList) {
		async.each(avatarList, function (player, next) {
			var key    = 'mi:avatar:' + player;

			NodeBB.db.delete(key);
			NodeBB.db.sortedSetRemove('mi:avatars', player);

			next();
		}, function (err) {
			callback(err);
		});
	});
};

Config.setAvatar = function (data) {
};

Config.getAvatarByPlayer = function (data, callback) {
	if (!data || !data.name || typeof data.name !== 'string') return callback(new Error('[[invalid_player]]'));

	var name = data.name,
		key  = 'mi:avatar:' + name;

	NodeBB.db.get(key, function (err, base64) {
		if (err) console.log(err);

		if (!base64) {
			console.log("Avatar at " +key+ " was not found.");
			Config.fetchAvatar(name, function (err, avatar, base64) {
				if (data.base64) {
					callback(null, base64);
				}else{
					callback(null, avatar);
				}
			});
		}else{
			console.log("Found existing avatar at " +key);
			if (data.base64) {
				callback(null, base64);
			}else{
				callback(null, new Buffer(base64, 'base64'));
			}
		}
	});
};

Config.fetchAvatar = function (name, next) {
	var key  = 'mi:avatar:' + name;
	console.log(typeof Config.getAvatarUrl);
	console.log(typeof Utils.getPlayerUUID);
	async.parallel({
		url:  async.apply(Config.getAvatarUrl, {name: name, size: 64}),
		uuid: async.apply(Utils.getPlayerUUID, name)
	}, function (err, payload) {
		if (err) {
			console.log(err);
			return next(err, null, null);
		}

		var url = payload.url.replace('{uuid}', payload.uuid);

		console.log("Fetching: " + url);

		function transform(response, body, next) {
			var cdn = Config.settings.get('avatarCDN');
			if (cdns[cdn].styles && cdns[cdn].styles.flat && cdns[cdn].styles.flat.transform) {
				cdns[cdn].styles.flat.transform(body, next);
			}else{
				next(null, body);
			}
		}

		function storeAvatar(avatar, next) {
			avatar = new Buffer(avatar);
			var base64 = avatar.toString('base64');
			NodeBB.db.set(key, base64, function (err) {
				if (err) return callback(err);

				// Expire the avatar.
				NodeBB.db.expire(key, Config.getAvatarExpiry());

				return next(null, avatar, base64);
			});

			// Add to avatar set.
			NodeBB.db.sortedSetAdd('mi:avatars', Date.now(), name);
		}

		async.waterfall([
			async.apply(request, {url: url, encoding: null}),
			async.apply(transform)
		], function (err, avatar) {
			if (err) {
				console.log("Could not retrieve skin using the cdn: " + Config.settings.get('avatarCDN'));
				if (Config.settings.get('avatarCDN') === 'mojang') return next(err, null, null);

				// Try Mojang
				async.waterfall([
					async.apply(request, {url: 'http://skins.minecraft.net/MinecraftSkins/' + name + '.png', encoding: null}),
					function (response, body, next) {
						console.log("Defaulting to Mojang skin.");
						cdns['mojang'].styles.flat.transform(body, next);
					}
				], function (err, avatar) {
					if (err) {
						console.log(err);
						return next(err, null, null);
					}else{
						storeAvatar(avatar, next);
					}
				});
			}else{
				storeAvatar(avatar, next);
			}
		});
	});
};

Config.getAvatarBase64ByPlayer = function (data, callback) {
	if (!data || !data.name || typeof data.name !== 'string') {
		console.log("Invalid request for base64: " + util.inspect(data, { showHidden: true, depth: null }));
		callback(null, null);
	}

	console.log("Getting Base64 for " +data.name);
	Config.getAvatarByPlayer({name: data.name, base64: true}, callback);
};

Config.getAvatarByNameAtSize = function (data, callback) {
	if (!data || !data.name || typeof data.name !== 'string') {
		console.log("Invalid request for base64: " + util.inspect(data, { showHidden: true, depth: null }));
		callback(null, null);
	}

	console.log("Getting Avatar for " +data.name+ " at size " +data.size);
	Config.getAvatarByPlayer({name: data.name, size: data.size}, callback);
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

Config.getPlayers = function (options, next) {
	if (typeof options === 'function') next = options;

	NodeBB.db.getSortedSetRange('yuuid:sorted', 0, -1, function (err, data) {
		if (err) return next(err, null);

		next(err, data);
	});
};

Config.getUuids = function (next) {
	var uuids = { };

	Config.getPlayers({}, function (err, data) {
		if (err) return next(err, null);

		for (var i in data) {
			var split = data[i].split(':');

			if (!uuids[split[0]]) uuids[split[0]] = split[1];
		}
		next(err, uuids);
	});
};

Config.getUsernameByUuid = function (uuid, callback) {
	NodeBB.db.sortedSetScore('yuuid:uid', uuid, function (err, uid) {
		NodeBB.User.getUsernamesByUids([uid], function (err, username) {
			callback(err, username[0]);
		});
	});
};

Config.getUsers = function (options, next) {
	if (typeof options === 'function') next = options;

	Config.getUuids(function (err, uuids) {
		if (err || !uuids) return next(new Error("No users."), null);

		var uids = [ ];

		for (var uuid in uuids) {
			uids.push(uuids[uuid]);
		}

		NodeBB.User.getUsersData(uids, next);
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
