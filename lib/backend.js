"use strict";

var	NodeBB     = require('./nodebb'),
	Config     = require('./config'),
	Utils      = require('./utils'),

	async      = require('async'),
	request    = require('request'),
	winston    = require('winston'),

	Backend = module.exports = { };

/////////////////////
// Player Profiles //
// yuuid:sorted    // SortedSet with all uuid object keys.
// yuuid:playtime  //
// yuuid:{uuid}    // Hash with global stats.
/////////////////////

// TODO: Need to remove console.log for winston.

Backend.getProfiles = Backend.getPlayers = function (options, next) {
	options = options || {};

	var	set = options.set || 'yuuid:playtime',
		min = options.min || 0,
		max = options.max || -1,
		profiles = [];

	NodeBB.db.getSortedSetRevRange(set, min, max, function (err, uuids) {
		async.each(uuids, function (id, next) {
			Backend.getProfileFromUuid(id, function (err, profile) {
				if (err) console.log("Error getting profile for " + id + ": " + err.message);

				if (err && "Bad Request" === err.message.slice(0,11)) {
					console.log("Corrupt UUID " + id + " found in set " + set + ", removing...");
					NodeBB.db.sortedSetRemove(set, id, function (err) {
						if (err) {
							console.log("Failed to remove corrupt uuid " + id + " from set " + set);
						}else{
							console.log("Removed corrupt uuid " + id + " from set " + set);
						}
					});
					NodeBB.db.delete('yuuid:' + id);
				} else if (!profile) {
					NodeBB.db.getObject('yuuid:' + id, function (err, profile) {
						if (err) return;
						if (!profile) {
							console.log("No profile found for " + id + ", but it was in set " + set + ", removing...");
							NodeBB.db.sortedSetRemove(set, id, function (err) {
								if (err) {
									console.log("Failed to remove corrupt uuid " + id + " from set " + set);
								}else{
									console.log("Removed corrupt uuid " + id + " from set " + set);
								}
							});
							NodeBB.db.delete('yuuid:' + id);
						}else{
							console.log("Stale profile for UUID " + id + ", omitting from results.");
							console.dir(profile);
						}
					});
				}else{
					profiles.push(profile);
				}
				next();
			});
		}, function () {
			next(null, profiles);
		});
	});
};

Backend.getProfile = Backend.getPlayer = function (data, next) {
	if (!data || !(data.name || data.id)) return next(new Error("No data for player lookup."));
	if (data.id) return Backend.getProfileFromUuid(data.id, next);
	if (data.name) return Backend.getProfileFromName(data.name, next);
};

Backend.getProfileFromName = function (name, next) {

	// Look in the cache first.
	NodeBB.db.get('mi:name:' + name, function (err, id) {

		// Return if db error.
		if (err) return next(err);

		// Return if found in cache.
		if (id) return Backend.getProfileFromUuid(id, next);

		// If not in cache, query Mojang.
		Utils.getPlayerUUID(name, function (err, id) {

			// Return if db error.
			if (err) return next(err);

			// Store results in the cache.
			NodeBB.db.set('mi:name:' + name, id);
			NodeBB.db.expire('mi:name:' + name, Config.getProfileExpiry());

			// Return the Profile.
			return Backend.getProfileFromUuid(id, next);
		});
	});
};

Backend.getProfileFromUuid = function (id, next) {

	// Get the object from the db.
	NodeBB.db.getObject('yuuid:' + id, function (err, profile) {

		// Return if db error.
		if (err) return next(err);

		// Create if null.
		profile = profile || {};

		// console.log("id:" + id);
		// console.log("name:" + profile.name);
		// console.log("lastupdate:" + profile.lastupdate);
		// console.log("expiry:" + Config.getProfileExpiry());
		// console.log("needs update:" + !!(!profile.name || (!profile.lastupdate || (Date.now() - parseInt(profile.lastupdate, 10) > Config.getProfileExpiry()))));

		// Does the profile need updating?
		if (!profile.name || (!profile.lastupdate || (Date.now() - parseInt(profile.lastupdate, 10) > Config.getProfileExpiry()))) {

			// Get the name from Mojang.
			Utils.getPlayerNameUsingUUID(id, function (err, name) {

				// Return if db error.
				if (err) return next(err);

				// Update the profile.
				profile.name = name;
				NodeBB.db.setObjectField('yuuid:' + id, 'name', name);
				NodeBB.db.setObjectField('yuuid:' + id, 'lastupdate', Date.now());
				NodeBB.db.isSortedSetMember('yuuid:sorted', id, function (err, isMember) {
					if (!err && !isMember) NodeBB.db.sortedSetAdd('yuuid:sorted', Date.now(), id);
				});
				NodeBB.db.isSortedSetMember('yuuid:playtime', id, function (err, isMember) {
					if (!err && !isMember) NodeBB.db.sortedSetAdd('yuuid:playtime', 0, id);
				});

				// Return the profile.
				profile.id = id;
				return next(null, profile);
			});
		}else{
			// Return the profile.
			profile.id = id;
			return next(null, profile);
		}
	});
};

Backend.deleteProfiles = Backend.deletePlayers = {};

Backend.deleteProfile = Backend.deletePlayer = function (data, next) {
	Backend.getProfile(data, function (err, profile) {
		if (err) return next(err);
		if (!profile || !profile.name || !profile.id) return next(new Error("No profile data."));

		NodeBB.db.delete('mi:name:' + profile.name);
		NodeBB.db.delete('yuuid:' + profile.id);
		NodeBB.db.sortedSetRemove('yuuid:sorted', profile.id);
		NodeBB.db.sortedSetRemove('yuuid:playtime', profile.id);

		next();
	});
};

Backend.getPrefix = function (options, next) {
	Backend.getUserUuid(options, function (err, id) {
		if (err) {
			winston.error(err);
			return next(err);
		}

		NodeBB.db.getObjectField('yuuid:' + id, 'prefix', function (err, prefix) {
			next(err, {prefix:prefix});
		});
	});
};

///////////////////////////////////
// Server Status                 //
///////////////////////////////////
// mi:server:{sid}               // Object
// mi:server:{sid}:pings         // List of JSON strings
// mi:server:{sid}:players       // SortedSet of UUIDs by playtime.
// mi:server:{sid}:player:{uuid} // Object of player statistics.
// mi:server:{sid}:config        // Object of server configuration.
///////////////////////////////////

Backend.getServer = Backend.getServerStatus = function (data, next) {
	if (!(data && typeof data.sid !== 'undefined')) return next(new Error("Invalid data."));

	var sid = data.sid;

	async.parallel({
		status: async.apply(NodeBB.db.getObject, 'mi:server:' + sid),
		config: async.apply(Backend.getServerConfig, {sid: sid})
	}, function (err, results) {

		var	status = results.status,
			config = results.config;

		if (err) return next(err);
		if (!config) return next(new Error("Backend.getServerStatus() No config exists for SID " + sid));
		if (!status) return next(new Error("Backend.getServerStatus() No status exists for SID " + sid + " named " + config.name));

		// Parse player, mod, and plugin lists.
		try {
			if (status.players    && typeof status.players    === 'string' && status.players    !== 'undefined') status.players    = JSON.parse(status.players);
			if (status.modList    && typeof status.modList    === 'string' && status.modList    !== 'undefined') status.modList    = JSON.parse(status.modList);
			if (status.pluginList && typeof status.pluginList === 'string' && status.pluginList !== 'undefined') status.pluginList = JSON.parse(status.pluginList);
		}catch(e){
			console.log("Bad Status", status);
			return next(e);
		}

		status.sid = sid;

		if (parseInt(config.hidePlugins, 10)) status.pluginList = [ ];

		next(null, status);

	});

};

function sort(a,b) {
    return a - b;
}

// Exposed to admin api only.
Backend.getServerConfig = function (data, next) {
	if (!(data && data.sid)) return next(new Error("Backend.getServerConfig() No SID.", data));

	var sid = data.sid;

	NodeBB.db.getObject('mi:server:' + sid + ':config', function (err, config) {
		if (err) return next(err);
		if (!config) return next(new Error("Backend.getServerConfig() invalid SID: " + data.sid));

		config.sid = sid;

		next(null, config);
	});
};

Backend.setServerConfig = function (data, next) {
	if (!(data && data.sid)) return next(new Error("Backend.setServerConfig() No SID."));

	data.name    = data.name    || "Unnamed Server";
	data.address = data.address || "example.com";

	// Score is used for sorting.
	NodeBB.db.sortedSetAdd('mi:servers', Date.now(), data.sid);
	NodeBB.db.setObject('mi:server:' + data.sid + ':config', data.config, next);
};

Backend.getSidUsingAPIKey = function (key, next) {
	var payload = null;

	Backend.getServersConfig({}, function (err, configs) {
		if (err) return next(err);

		configs.forEach(function (config) {
			if (config.APIKey === key) payload = config.sid;
		});

		return next(payload ? null : new Error("Invalid API Key"), payload);
	});
};

Backend.getServerIcon = function (data, next) {

	if (!data || !data.sid) return next("Backend.getServerIcon() No SID.");

	var sid = data.sid;

	NodeBB.db.getObjectField('mi:server:' + sid, 'icon', function (err, icon) {
		if (err || !icon) return next(err);

		var	base = icon.replace("data:image/png;base64,", "");

		next(err, {
			base     : base,
			modified : new Date().toUTCString()
		});
	});
};

Backend.getServerPlugins = function (data, next) {

	var	sid = data.sid;

	async.parallel({
		pluginList : async.apply(NodeBB.db.getObjectField, 'mi:server:' + sid, 'pluginList'),
		config     : async.apply(Backend.getServerConfig, {sid: sid})
	}, function (err, results) {

		if (err) return next(err);

		if (!results.pluginList || parseInt(results.config.hidePlugins, 10)) {
			next(null, [ ]);
		}else{
			try {
				results.pluginList = JSON.parse(results.pluginList);
			}catch(err){
				console.log("JSON ERROR: " + err);
				return next(err, [ ]);
			}

			next(null, results.pluginList);
		}
	});

};

// TODO: Make this retrieve a time range instead of a fixed amount.
Backend.getRecentPings = function (data, next) {

	var	pings = { },
		sid = data.sid,
		amount = data.last || 30;

	if (sid < 0) return next(new Error("Invalid sid sent to getRecentPings: " + sid), pings);

	amount--;

	NodeBB.db.getListRange('mi:server:' + sid + ':pings', 0, amount, function (err, stamps) {
		if (err) {
			console.log("stamps err: ", err);
			return next(err, { });
		}else{
			stamps = stamps.reverse();
			async.eachSeries(stamps, function (stamp, next) {
				NodeBB.db.getObject('mi:server:' + sid + ':ping:' + stamp, function (err, ping) {
					if (err) {
						console.log("ping err: ", err);
						return next(err);
					}

					if (ping.players === '') ping.players = [];

					if (typeof ping.players === 'string') {
						try {
							ping.players = JSON.parse(ping.players);
						}catch(e){
							ping.players = [];
						}
					}

					if (parseInt(ping.tps, 10) > 100) ping.tps = "0";
					if (parseInt(ping.tps, 10) > 20) ping.tps = "20";

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

Backend.updateServerStatus = function (status, next) {

	if (typeof status.players !== 'string') status.players = JSON.stringify(status.players);

	if (status.pluginList && typeof status.pluginList !== 'string') status.pluginList = JSON.stringify(status.pluginList);
	if (status.modList    && typeof status.modList    !== 'string') status.modList    = JSON.stringify(status.modList);

	async.waterfall([
		async.apply(NodeBB.db.delete,         'mi:server:' + status.sid),
		async.apply(NodeBB.db.setObject,      'mi:server:' + status.sid, status),
		async.apply(NodeBB.db.expire,         'mi:server:' + status.sid, Config.getPingExpiry()),
		async.apply(NodeBB.db.setObjectField, 'mi:server:' + status.sid + ':ping:' + status.updateTime, 'players', status.players),
		async.apply(NodeBB.db.setObjectField, 'mi:server:' + status.sid + ':ping:' + status.updateTime, 'tps', status.tps),
		async.apply(NodeBB.db.expire,         'mi:server:' + status.sid + ':ping:' + status.updateTime, Config.getPingExpiry()),
		async.apply(NodeBB.db.listPrepend,    'mi:server:' + status.sid + ':pings', status.updateTime)
	], next);
};

Backend.deleteServer = function (data, next) {
	if (!data || !(parseInt(data.sid, 10)>-1)) return next(new Error("Invalid data sent to Backend.deleteServer()"));

	var sid = parseInt(data.sid, 10);

	winston.warn("DELETING MINECRAFT SERVER SID:" + sid);

	async.waterfall([
		async.apply(NodeBB.db.getListRange, 'mi:server:' + sid + ':pings', 0, -1),
		function (stamps, next) {
			async.each(stamps, function (stamp, next) {
				NodeBB.db.delete('mi:server:' + sid + ':ping:' + stamp, next);
			}, next);
		},
		async.apply(NodeBB.db.delete, 'mi:server:' + sid + ':pings'),
		async.apply(NodeBB.db.delete, 'mi:server:' + sid),
		async.apply(NodeBB.db.delete, 'mi:server:' + sid + ':config'),
		async.apply(NodeBB.db.sortedSetRemove, 'mi:servers', sid)
		// mi:server:{sid}:players       // SortedSet of UUIDs by playtime.
		// mi:server:{sid}:player:{uuid} // Object of player statistics.
	], next);
};

////////////////////////////////
// Servers                    //
////////////////////////////////
// mi:servers                 //
// mi:servers:apikeys         //
////////////////////////////////

Backend.getServers = Backend.getServersStatus = function (data, next) {
	Backend.getServersSids(data, function (err, sids) {
		async.map(sids, function (sid, next) {
			Backend.getServer({sid: sid}, function (err, server) {
				if (err) winston.error(err);
				next(null, server);
			});
		}, function (err, servers) {
			next(null, servers.filter(function (server) { return server; }));
		});
	});
};

// Exposed to admin api only.
Backend.getServersConfig = function (data, callback) {
	var payload = [];

	Backend.getServersSids(data, function (err, sids) {
		async.each(sids, function (sid, next) {
			Backend.getServerConfig({sid: sid}, function (err, config) {
				if (err) return next();
				if (!config) return next();
				payload.push(config);
				next();
			});
		}, function () {
			callback(null, payload);
		});
	});
};

Backend.getServersSids = Backend.getServerSids = function (data, next) {
	if (!data || typeof data !== 'object') return next(new Error("No data sent to Backend.getServersSids()"));

	if (data.start) data.start = parseInt(data.start, 10);
	if (data.end) data.start = parseInt(data.end, 10);

	var start = data.start >= 0 ? data.start : 0;
	var end = data.end >= -1 ? data.end : -1;

	NodeBB.db.getSortedSetRange('mi:servers', 0, -1, function (err, sids) {

		if (err || !sids) return next(err, []);

		if (data.sort) {
			if (data.sort === "sid") sids = sids.sort(sort);
		}else{
			sids = sids.sort(sort);
		}

		next(err, sids);
	});
};

/////////////////////////////////////
// Avatars                         //
/////////////////////////////////////
// mi:avatars                      // SortedSet, value: player name of stored avatar, score: last update time.
// mi:avatar:{playername}          // String, base64 encoded png.
// mi:avatar:{playername}:modified // String, ISO Date of last time the image was modified.
/////////////////////////////////////

// ACP list
Backend.getAvatars = function (data, next) {
	Backend.getAvatarList({}, function (err, avatarList) {
		var avatars = [ ];

		// TODO: This needs to be a multi-key operation.
		async.each(avatarList, function (name, next) {
			getAvatar(name, function (err, base64) {
				if (err || !base64) return next();

				Backend.getProfileFromName(name, function (err, profile) {
					if (err || !profile) return next();

					avatars.push({name: name, base64: base64, id: profile.id});
					next();
				});
			});
		}, function (err) {
			next(err, avatars);
		});
	});
};

// Get the avatar base64 from the database.
function getAvatar(name, callback) {

	// Database keys used.
	var	keyBase     = 'mi:avatar:' + name,
		keyModified = 'mi:avatar:' + name + ":modified",
		keySorted   = 'mi:avatars';

	// Store a fetched avatar binary as base64 and update fetch time.
	function storeAvatar(avatar, next) {

		// Convert buffer to a base64.
		avatar = avatar.toString('base64');

		// Set base64.
		NodeBB.db.set(keyBase, avatar, function (err) {
			if (err) return next(err);

			return next(null, avatar);
		});

		// Update the avatar fetch time.
		NodeBB.db.sortedSetAdd(keySorted, Date.now(), name);
	}

	// Get fetch time.
	// If old or null, Fetch avatar and update fetch time.
	// If different, Set modified.
	async.parallel({
		fetchTime    : async.apply(NodeBB.db.sortedSetScore, 'mi:avatars', name),
		base         : async.apply(NodeBB.db.get,            'mi:avatar:' + name),
		modifiedTime : async.apply(NodeBB.db.get,            'mi:avatar:' + name + ':modified')
	}, function (err, results) {
		if (err) return callback(err);

		var	fetchTime    = results.fetchTime,
			base         = results.base,
			modifiedTime = results.modifiedTime,
			buffer;

		async.waterfall([
			function (next) {
				if (!fetchTime || !base || !modifiedTime || Date.now() - fetchTime > 1000 * 60 * 10) {
					fetchAvatar(name, next);
				}else{
					next(null, false);
				}
			},
			function (_buffer, next) {
				if (_buffer) {
					buffer = _buffer;
					storeAvatar(buffer, next);
				}else{
					next(null, base);
				}
			},
			function (_base, next) {
				if (_base !== base || !modifiedTime) {
					modifiedTime = new Date().toUTCString();
					NodeBB.db.set(keyModified, modifiedTime, next);
					base = _base;
				}else{
					next();
				}
			}
		], function (err) {
			if (err) return callback(err);

			callback(err, {
				buffer   : buffer,
				base     : base,
				modified : modifiedTime
			});
		});
	});
}

Backend.getAvatar = function (data, callback) {

	// Asserts
	if (!(data && data.name && typeof data.name === 'string')) return callback(new Error("Invalid Data passed to getAvatar: " + data));

	getAvatar(data.name, callback);

};

// Get list of avatar names in the database
Backend.getAvatarList = function (data, callback) {
	NodeBB.db.getSortedSetRange('mi:avatars', 0, -1, function (err, list) {
		callback(err, list ? list.sort() : []);
	});
};

Backend.clearOldAvatars = function (options, next) {
	NodeBB.db.sortedSetsRemoveRangeByScore(['mi:avatars'], 0, Date.now() - Config.getAvatarExpiry() * 1000, function (err) {
		if (err) console.log("Backend.clearOldAvatars error:", err);
		if (typeof next === 'function') next();
	});
};

Backend.refreshAvatar = function (data, next) {

	var	name = data.name;

	Backend.deleteAvatar(data, function (err) {
		getAvatar(name, function (err, data) {
			next(err, {base64: data.base});
		});
	});
};

Backend.deleteAvatar = function (data, next) {
	if (!data || !data.name) return next(new Error("Backend.deleteAvatar() no name passed."));

	var	name = data.name;

	NodeBB.db.sortedSetRemove('mi:avatars', name);

	next();
};

Backend.resetAvatars = function (data, callback) {
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

// Gets the avatar from the configured cdn.
function fetchAvatar(name, next) {

	async.parallel({
		url:     async.apply(Config.getAvatarUrl, {name: name, size: 64}), // The full url for the avatar.
		profile: async.apply(Backend.getProfileFromName, name)             // We need this for cdns that use uuids.
	}, function (err, payload) {

		if (err) return next(err);

		var url = payload.url.replace('{uuid}', payload.profile.id);

		console.log("Fetching avatar from CDN: " + url);

		async.waterfall([
			async.apply(request, {url: url, encoding: null}),
			async.apply(transform)
		], function (err, avatar) {
			if (err) {
				console.log("Could not retrieve skin using the cdn: " + Config.settings.get('avatarCDN'));
				if (Config.settings.get('avatarCDN') === 'mojang') return next(null, Config.steveBuffer);

				// Try Mojang
				async.waterfall([
					async.apply(request, {url: 'http://skins.minecraft.net/MinecraftSkins/' + name + '.png', encoding: null}),
					function (response, body, next) {
						console.log("Defaulting to Mojang skin.");
						Config.cdns['mojang'].styles.flat.transform(body, next);
					}
				], function (err, avatar) {
					if (err) {

						console.log("Couldn't connect to Mojang skin server.");

						return next(null, Config.steveBuffer);

					}else{
						next(null, new Buffer(avatar));
					}
				});
			}else{
				next(null, new Buffer(avatar));
			}
		});
	});
};

function transform(response, body, next) {
	var cdn = Config.settings.get('avatarCDN');
	if (Config.cdns[cdn].styles && Config.cdns[cdn].styles.flat && Config.cdns[cdn].styles.flat.transform) {
		Config.cdns[cdn].styles.flat.transform(body, next);
	}else{
		next(null, body);
	}
}

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
			Backend.getProfileFromUuid(value.value, function (err, profile) {
				if (err) return next(err);
				next(null, {id: value.value, name: profile.name, playtime: value.score});
			});
		}, callback);
	});
};

//////////////////////
// Registered Users //
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
					Backend.getProfileFromUuid(userData.yuuid, function (err, profile) {

						if (err && "Bad Request" === err.message.slice(0,11)) {
							console.log("Corrupt UUID " + userData.yuuid + " found in user object " + "user:" + uid + ", removing...");
							NodeBB.db.delete('yuuid:' + userData.yuuid);
							NodeBB.db.deleteObjectField('user:' + uid, 'yuuid');
						}

						if (err || !profile) return next();

						userData.name = profile.name;
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

// Get user data from player data.
Backend.getRegisteredUser = function (options, next) {

	// Assert parameters
	if (!(typeof next === 'function' && options && (options.uid || options.id || options.name))) return next("Backend.getRegisteredUser() Invalid params.");

	// Convert name to uuid if needed.
	if (options.id) {
		getUserFromUuid(options.id, options.extraFields, next);
	} else if (options.name) {
		Backend.getProfileFromName(options.name, function (err, profile) {
			if (err || !profile) return next(err, profile);
			getUserFromUuid(profile.id, options.extraFields, next);
		});
	}
};

function getUserFromUuid(id, extraFields, next) {

	var	fields = ['uid', 'username', 'yuuid', 'userslug'],
		user = null;

	// Add extra fields to the user fields query.
	if (extraFields && Array.isArray(extraFields)) {
		for (var i = 0; i < extraFields.length; i++) {
			if (typeof extraFields[i] === 'string') fields.push(extraFields[i]);
		}
	}

	// Get all user ids.
	NodeBB.db.getSortedSetRange('users:joindate', 0, -1, function (err, uids) {

		// Search the users until a match is found.
		async.eachSeries(uids, function (uid, next) {
			NodeBB.db.getObjectFields('user:' + uid, fields, function (err, userData) {
				if (!!userData.yuuid && userData.yuuid === id) {
					user = userData;
					return next(true);
				}
				next();
			});
		}, function (err) {
			next(user ? null : new Error("No user found for UUID " + id), user);
		});
	});
}

Backend.getUserUuid = function (options, next) {
	if (!(options && options.uid)) return next(new Error("Bad options."));

	NodeBB.User.getUserField(options.uid, 'yuuid', next);
};

Backend.deleteUser = function (data, next) {
	var	uid = data.uid;

	if (!uid) return next(new Error("No uid"));

	async.parallel([
		async.apply(NodeBB.db.deleteObjectField, 'user:'+uid, 'yuuid'),
		async.apply(NodeBB.db.sortedSetRemove, 'yuuid:uid', uid)
	], next);
};

Backend.refreshUser = function (data, next) {
};

Backend.resetUsers = function (data, next) {
};
