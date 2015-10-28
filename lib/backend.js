"use strict";

var	Backend = module.exports = { },

	NodeBB     = require('./nodebb'),
	Config     = require('./config'),
	Controller = require('./controller'),
	Utils      = require('./utils'),

	async      = require('async'),
	request    = require('request'),
	winston    = require('winston');

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
///////////////////////////////////

Backend.getServerStatus = function (data, next) {
	if (!(data && typeof data.sid !== 'undefined')) return next(new Error("Invalid data."));

	var sid = data.sid;
	NodeBB.db.getObject('mi:server:' + sid, function (err, status) {

		if (err) return next(err);
		if (!status) return next(new Error("Error: No status for server " + data.sid + ": " + Config.getServer(data.sid).name));

		try {
			if (status.players && typeof status.players === 'string' && status.players !== 'undefined') status.players = JSON.parse(status.players);
			if (status.modList && typeof status.modList === 'string' && status.modList !== 'undefined') status.modList = JSON.parse(status.modList);
			if (status.pluginList && typeof status.pluginList === 'string' && status.pluginList !== 'undefined') status.pluginList = JSON.parse(status.pluginList);
		}catch(e){
			console.log("JSON ERROR: " + e);
		}
		status.sid = sid;
		if (Config.getServer(sid).hidePlugins) status.pluginList = [ ];
		next(null, status);

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

Backend.updateServerStatus = function (status, next) {
	if (typeof status.sid === 'undefined') return next(status);

	// Get the current minute.
	var updateTime = Math.round(Date.now()/60000) * 60000;

	// Trim UUIDs to Mojang format.
	if (status.players) {
		status.players.forEach(function(player){
			if (!player.id) return;
			player.id = Utils.trimUUID(player.id);
		});
	}

	// Shallow copy. We store a stringified version in the db, and send the original to the users.
	var _status = JSON.parse(JSON.stringify(status));

	// Send object to users.
	Controller.sendStatusToUsers(_status);

	// Store the user data in the db.
	async.each(_status.players, function (player, next) {
		// Skip if no uuid.
		if (!player.id) next();

		// Skip if invalid uuid.
		// function verifyUUID(id, next) {
			// Utils.getPlayerNameUsingUUID(id, function (err, name) {
				// if (err) return next(err);
			// });
		// }

		// Utils.getPlayerNameUsingUUID(player.id, function (err, valid) {
			// if (err)
		// });

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

	// Store lists as stringified objects.
	try {
		status.players = JSON.stringify(status.players);
	}catch(e){
		status.players = '[]';
		console.log("[Minecraft Integration] Error parsing players list: " + e);
	}
	try {
		status.modList = JSON.stringify(status.modList);
	}catch(e){
		status.modList = '[]';
		console.log("[Minecraft Integration] Error parsing mod list: " + e);
	}
	try {
		status.pluginList = JSON.stringify(status.pluginList);
	}catch(e){
		status.pluginList = '[]';
		console.log("[Minecraft Integration] Error parsing plugin list: " + e);
	}

	console.log("Setting status");
	console.dir(status);

	// Send status to database.
	NodeBB.db.setObject('mi:server:' + status.sid, status);
	NodeBB.db.expire('mi:server:' + status.sid, Config.getPingExpiry());

	// No reason to send an error here. If the database fails, what would we do?
	next(null, status);
};

////////////////////////////
// Avatars                //
////////////////////////////
// mi:avatars             // SortedSet, value: player name of stored avatar, score: last update time.
// mi:avatar:{playername} // String, base64 encoded png.
////////////////////////////

// ACP list
Backend.getAvatars = function (data, next) {
	Backend.getAvatarList({}, function (err, avatarList) {
		var avatars = [ ];

		// TODO: This needs to be a multi-key operation.
		async.each(avatarList, function (name, next) {
			Backend.getAvatarByPlayer({name: name, base64: true}, function (err, base64) {
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

Backend.getAvatarList = function (data, next) {
	// Get avatar names.
	NodeBB.db.getSortedSetRange('mi:avatars', 0, -1, function (err, data) {
		if (!err && data) {
			next(null, data.sort());
		}else{
			next(err, []);
		}
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

	Backend.deleteAvatar(data, function () {
		Backend.getAvatarBase64ByPlayer({name: name}, function (err, base64) {
			next(err, {base64: base64});
		});
	});
};

Backend.deleteAvatar = function (data, next) {
	var	name = data.name;

	Backend.getAvatarList({}, function (err, avatarList) {
		var key = 'mi:avatar:' + name;

		NodeBB.db.delete(key);
		NodeBB.db.sortedSetRemove('mi:avatars', name);

		next();
	});
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
		profile: async.apply(Backend.getProfileFromName, name)
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
				console.log("Expiring " + key + " in " + Config.getAvatarExpiry() + " seconds.");
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

						// TODO: Add Steve avatar.
						console.log("Couldn't connect to Mojang skin server.");
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

function getUserFromUuid = function (id, extraFields, next) {

	var	fields = ['uid', 'username', 'yuuid'],
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
};

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
