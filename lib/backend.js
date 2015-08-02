"use strict";

var Backend = { },

	NodeBB     = require('./nodebb'),
	Config     = require('./config'),
	Controller = require('./controller'),
	Utils      = require('./utils'),

	async      = require('async'),
	request    = require('request');

////////////////////
// Player Records //
// yuuid:playtime //
// yuuid:{uuid}   //
////////////////////

Backend.getPlayers = function (options, next) {
	NodeBB.db.getSortedSetRevRange('yuuid:playtime', 0, -1, function (err, uuids) {
		async.map(uuids, function (uuid, next) {
			NodeBB.db.getObject('yuuid:' + uuid, function (err, player) {
				player.id = uuid;
				next(null, player);
			});
		}, next);
	});
};

Backend.getPlayer = function (options, next) {
	if (!options.id) return next(true, {});

	NodeBB.db.getObject('yuuid:' + uuid, function (err, player) {
		player.id = uuid;
		next(null, player);
	});
};

////////////////////////////
// Avatars                //
////////////////////////////
// mi:avatar:{playername} // String, base64 encoded png.
////////////////////////////

Backend.clearAvatar = function (playerName, next) {
	Backend.getAvatarList({}, function (err, avatarList) {
		var key = 'mi:avatar:' + playerName;

		NodeBB.db.delete(key);
		NodeBB.db.sortedSetRemove('mi:avatars', playerName);

		next();
	});
};

Backend.refreshAvatar = function (playerName, next) {
	Backend.clearAvatar(playerName, function () {
		Backend.getAvatarBase64ByPlayer({name: playerName}, function (err, base64) {
			next(err, {base64: base64});
		});
	});
};

////////////////////////////
// Profile Lookup         //
// Still working on this. //
////////////////////////////

Backend.getProfile = function (data, next) {
	if (!data) {
		next("getProfile() No data.");
	}else if (data.uuid || data.id) {
		var id = data.uuid || data.id;

		console.log("Looking for profile for uuid: " + id);
		NodeBB.db.getObject('yuuid:' + id, function (err, data) {
			if (err) console.log(err);
			console.log(data);
			next(err, data);
		});
	}else if (data.name) {
		NodeBB.db.exists('mi:name:' + data.name, function (err, exists) {
			if (err) return next(err);

			if (exists) {
				NodeBB.db.get('mi:name:' + data.name, function (err, uuid) {
					next(err, {id: uuid, name: data.name});
				});
			}else{
				Utils.getPlayerUUID(data.name, function (err, uuid) {
					if (err) return("Backend.getProfile() Couldn't get UUID from Mojang for user " + data.name);

					NodeBB.db.set('mi:name:' + data.name, uuid);
					NodeBB.db.expire('mi:name:' + data.name, Config.getProfileExpiry());

					next(err, {id: uuid, name: data.name});
				});
			}
		});
	}else{
		next("getProfile() invalid data.");
	}
};

///////////////////////////////////
// Server Status                 //
///////////////////////////////////
// mi:server:{sid}               // Object
// mi:server:{sid}:pings         // List of JSON strings
// mi:server:{sid}:players       // SortedSet of UUIDs by playtime.
// mi:server:{sid}:player:{uuid} // Object of player statistics.
///////////////////////////////////

Backend.getServerStatus = function (data, callback) {
	var sid = data.sid;

	NodeBB.db.getObject('mi:server:' + sid, function (err, status) {
		if (err) {
			console.log(err);
			callback(err, { });
		}else if (!status) {
			console.log("Error: No status for server: " + data.name);
			callback("nostatus", { });
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

Backend.getServerIcon = function (data, next) {
	if (!data || !data.sid) return next("Backend.getServerIcon() No SID.");

	var sid = data.sid;

	NodeBB.db.getObjectField('mi:server:' + sid, 'icon', function (err, icon) {
		if (!err && icon) icon = new Buffer(icon.replace("data:image/png;base64,", ""), 'base64');
		next(err, icon);
	});
};

Backend.getServerPlugins = function (data, next) {
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

Backend.getRecentPings = function (data, next) {
	var pings = { },
		sid = data.sid,
		amount = data.last || 10;

	if (!data.sid) return next(null, pings);

	amount--;

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

/////////////////////
// Avatars         //
/////////////////////

Backend.getAvatars = function (data, next) {
	Backend.getAvatarList({}, function (err, avatarList) {
		var avatars = [ ];

		async.each(avatarList, function (name, next) {
			Backend.getAvatarByPlayer({name: name, base64: true}, function (err, base64) {
				avatars.push({name: name, base64: base64});
				next();
			});
		}, function (err) {
			next(err, avatars);
		});
	});
};

Backend.getAvatarList = function (data, next) {
	NodeBB.db.sortedSetsRemoveRangeByScore(['mi:avatars'], 0, Date.now() - Config.getAvatarExpiry() * 1000, function (err) {
		if (err) return next(err, []);

		NodeBB.db.getSortedSetRange('mi:avatars', 0, -1, function (err, data) {
			if (!err && data) {
				next(null, data.sort());
			}else{
				next(err, []);
			}
		});
	});
};

Backend.clearAvatars = function (callback) {
	Backend.getAvatarList({}, function (err, avatarList) {
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

Backend.setAvatar = function (data) {
};

Backend.getAvatarByPlayer = function (data, callback) {
	if (!data || !data.name || typeof data.name !== 'string') return callback(new Error('[[invalid_player]]'));

	var name = data.name,
		key  = 'mi:avatar:' + name;

	NodeBB.db.get(key, function (err, base64) {
		if (err) console.log(err);

		if (!base64) {
			console.log("Avatar at " +key+ " was not found.");
			Backend.fetchAvatar(name, function (err, avatar, base64) {
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

Backend.fetchAvatar = function (name, next) {
	var key  = 'mi:avatar:' + name;

	async.parallel({
		url:     async.apply(Config.getAvatarUrl, {name: name, size: 64}),
		profile: async.apply(Backend.getProfile, {name: name})
	}, function (err, payload) {
		if (err) {
			console.log(err);
			return next(err, null, null);
		}

		var url = payload.url.replace('{uuid}', payload.profile.id);

		console.log("Fetching: " + url);

		function transform(response, body, next) {
			var cdn = Config.settings.get('avatarCDN');
			if (Config.cdns[cdn].styles && Config.cdns[cdn].styles.flat && Config.cdns[cdn].styles.flat.transform) {
				Config.cdns[cdn].styles.flat.transform(body, next);
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
						Config.cdns['mojang'].styles.flat.transform(body, next);
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

Backend.getAvatarBase64ByPlayer = function (data, callback) {
	if (!data || !data.name || typeof data.name !== 'string') {
		console.log("Invalid request for base64: " + util.inspect(data, { showHidden: true, depth: null }));
		callback(null, null);
	}

	console.log("Getting Base64 for " +data.name);
	Backend.getAvatarByPlayer({name: data.name, base64: true}, callback);
};

Backend.getAvatarByNameAtSize = function (data, callback) {
	if (!data || !data.name || typeof data.name !== 'string') {
		console.log("Invalid request for base64: " + util.inspect(data, { showHidden: true, depth: null }));
		callback(null, null);
	}

	console.log("Getting Avatar for " +data.name+ " at size " +data.size);
	Backend.getAvatarByPlayer({name: data.name, size: data.size}, callback);
};

Backend.getAvatar = Backend.getAvatarByPlayer;

///////////////////////
// Global Stats      //
///////////////////////

Backend.getPlaytimes = function (options, next) {
	NodeBB.db.getSortedSetRangeWithScores('yuuid:playtime', 0, -1, function (err, data) {
		next(err, data);
	});
};

Backend.getTopPlayersByPlaytimes = function (data, callback) {
	data.show = data.show || 5;

	NodeBB.db.getSortedSetRevRangeByScoreWithScores('yuuid:playtime', 0, data.show, '+inf', 0, function (err, data) {
		async.map(data, function (value, next) {
			Backend.getProfile({uuid: value.value}, function (err, profile) {
				if (err) return next(err);
				next(null, {uuid: value.value, name: profile.name || profile.playername, playtime: value.score});
			});
		}, callback);
	});
};

//////////////////////
// Registered Users //
// yuuid:sorted     //
// yuuid:uid        //
//////////////////////

Backend.getRegisteredUsers = function (options, next) {
	if (typeof options === 'function') {
		next = options;
		options = {};
	}

	var users = [],
		fields = ['uid', 'username', 'yuuid'];

	if (options.fields && Array.isArray(options.fields)) {
		for (var i = 0; i < options.fields.length; i++) {
			if (typeof options.fields[i] === 'string') fields.push(options.fields[i]);
		}
	}

	NodeBB.db.getSortedSetRange('users:joindate', 0, -1, function (err, uids) {
		async.each(uids, function (uid, next) {
			NodeBB.db.getObjectFields('user:' + uid, fields, function (err, userData) {
				if (!!userData.yuuid) {
					Backend.getProfile({id: userData.yuuid}, function (err, profile) {
						if (!err && profile && profile.playername) userData.name = profile.playername;
						users.push(userData);
						next();
					});
				}else{
					next();
				}
			});
		}, function (err) {
			if (err) users = [];

			next(err, users);
		});
	});
};

Backend.getRegisteredUser = function (options, next) {
	if (typeof next !== 'function' || !options || (!options.uid && !options.id)) {
		return next("Backend.getRegisteredUser() Invalid params.");
	}

	var fields = ['uid', 'username', 'yuuid'],
		user = null;

	if (options.fields && Array.isArray(options.fields)) {
		for (var i = 0; i < options.fields.length; i++) {
			if (typeof options.fields[i] === 'string') fields.push(options.fields[i]);
		}
	}

	if (options.id) {
		options.id = Utils.trimUUID(options.id);

		NodeBB.db.getSortedSetRange('users:joindate', 0, -1, function (err, uids) {
			async.eachSeries(uids, function (uid, next) {
				NodeBB.db.getObjectFields('user:' + uid, fields, function (err, userData) {
					if (!!userData.yuuid && userData.yuuid === options.id) {
						user = userData;
						return next(true);
					}
					next();
				});
			}, function (err) {
				next(null, user);
			});
		});
	}
};

module.exports = Backend;
