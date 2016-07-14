"use strict";

var NodeBB     = require('./nodebb');
var Config     = require('./config');
var Utils      = require('./utils');

var async      = require('async');
var request    = require('request');
var winston    = require('winston');

var Backend = module.exports = { };

/////////////////////
// Player Objects  //
// yuuid:{uuid}    // Hash for player object.
// yuuid:sorted    // SortedSet value:yuuid score:lastpinged
// yuuid:playtime  // SortedSet value:yuuid score:playtime
/////////////////////

// TODO: Need to remove console.log for winston.

// Get all stored player uuids.
Backend.getUuids = function (options, next) {
	options = options || {};

	var	set = options.set || 'yuuid:playtime',
		min = options.min || 0,
		max = options.max || -1,
		profiles = [];

	NodeBB.db.getSortedSetRevRange(set, min, max, next)
};

// Get the player hash of uuids.
Backend.getPlayersFromUuids = function (yuuids, callback) {
	var keys = yuuids.map(function (yuuid) { return 'yuuid:' + yuuid; })

	NodeBB.db.getObjects(keys, function (err, players) {

    // Add the yuuid to the player object for display.
		for (var i in players) {
			players[i] = players[i] || {}
			players[i].id = yuuids[i];
		}

		callback(err, players)
	});
};

Backend.getUuidFromName = function (name, next) {
	// Look in the cache first.
	NodeBB.db.get('mi:name:' + name, function (err, uuid) {

      // Return if db error.
      if (err) return next(err)

      // Return if found in cache.
      if (uuid) return next(null, uuid)

      // If not in cache, query Mojang.
      Utils.getUUID(name, function (err, uuid) {

        // Return if db error.
        if (err) return next(err)

        // Store results in the cache.
        NodeBB.db.set('mi:name:' + name, uuid)
        NodeBB.db.expire('mi:name:' + name, Config.getPlayerExpiry())

        // Return the UUID.
        return next(null, uuid)
      })
  })
}

// Get the primary player linked to a user.
Backend.getPrimaryUuid = function (uid, next) {
	NodeBB.User.getUserField(uid, 'yuuid', next)
}

// Get the primary user linked to a player.
Backend.getPrimaryUid = function (yuuid, next) {
	NodeBB.db.getObjectField('yuuid:' + yuuid, 'uid', next)
}

// Get the all players linked to a user.
Backend.getUuidsFromUid = function (uid, next) {
	NodeBB.db.getSortedSetRevRange('uid:' + uid + ':yuuids', 0, -1, next)
}

// Get the all users linked to a player.
Backend.getUidsFromUuid = function (yuuid, next) {
	NodeBB.db.getSortedSetRevRange('yuuid:' + yuuid + ':uids', 0, -1, next)
}

// Remove primary user linked to a player.
Backend.removePrimaryUid = function (yuuid, next) {
  NodeBB.db.deleteObjectField('yuuid:' + yuuid, 'uid', next)
}

// Remove primary player linked to a user.
Backend.removePrimaryUuid = function (uid, next) {
  NodeBB.db.deleteObjectField('user:' + uid, 'yuuid', next)
}

// Add link to sortedsets and primaries.
Backend.linkUuidtoUid = function (yuuid, uid, next) {
  async.parallel([
    async.apply(NodeBB.db.sortedSetAdd,   'mi:uid:linked',              Date.now(), uid),
    async.apply(NodeBB.db.sortedSetAdd,   'yuuid:' + yuuid + ':uids',   Date.now(), uid),
    async.apply(NodeBB.db.sortedSetAdd,   'yuuid:linked',               Date.now(), yuuid),
    async.apply(NodeBB.db.sortedSetAdd,   'uid:'   + uid   + ':yuuids', Date.now(), yuuid),
    async.apply(NodeBB.db.setObjectField, 'yuuid:' + yuuid, 'uid', uid),
    async.apply(NodeBB.db.setObjectField, 'user:' + uid, 'yuuid', yuuid)
  ], next);
}

Backend.resetPrimaryUid = function (yuuid, next) {
  Backend.removePrimaryUid(yuuid, function () {
    Backend.getUidsFromUuid(yuuid, function (err, uids) {
      if (!err && uids && uids[0]) {
        NodeBB.db.setObjectField('yuuid:' + id, 'uid', uids[0], next)
      } else {
        next()
      }
    })
  })
}

Backend.resetPrimaryUuid = function (uid, next) {
  Backend.removePrimaryUuid(uid, function () {
    Backend.getUuidsFromUid(uid, function (err, uuids) {
      if (!err && uuids && uids[0]) {
        NodeBB.db.setObjectField('user:' + id, 'uid', uids[0], next)
      } else {
        next()
      }
    })
  })
}

Backend.getLinkedUids = function (next) {
  NodeBB.db.getSortedSetRevRange('mi:uid:linked', 0, -1, next)
}
Backend.getLinkedUuids = function (next) {
  NodeBB.db.getSortedSetRevRange('yuuid:linked', 0, -1, next)
}

Backend.deletePlayer = function (data, next) {
	if (!(data && data.id)) return next(new Error("Bad data sent to Backend.deletePlayer()"));

	var id = data.id;

	async.parallel([
		async.apply(NodeBB.db.delete,            'yuuid:' + id),
		//async.apply(NodeBB.db.deleteObjectField, 'yuuid:' + id,  'uid'),
		async.apply(NodeBB.db.sortedSetRemove,   'yuuids:linked', id),
		function (next) {
			NodeBB.db.getSortedSetRange('yuuid:' + id  + ':uids', 0, -1, function (err, uids) {
				async.each(uids, function (uid, next) {
					async.parallel([
						async.apply(NodeBB.db.sortedSetRemove, 'yuuid:' + id  + ':uids',   uid),
						async.apply(NodeBB.db.sortedSetRemove, 'uid:'   + uid + ':yuuids', id)
					], next);
				}, next);
			})
		}
	], next);
};

Backend.deleteUser = function (uid, next) {
  
};

Backend.getPlayerPrefix = function (uuid, next) {
  NodeBB.db.getObjectField('yuuid:' + uuid, 'prefix', next)
}

///////////////////////////////////
// Server Status                 //
///////////////////////////////////
// mi:server:{sid}               // Object
// mi:server:{sid}:pings         // List of JSON strings
// mi:server:{sid}:players       // SortedSet of UUIDs by playtime.
// mi:server:{sid}:player:{uuid} // Object of player statistics.
// mi:server:{sid}:config        // Object of server configuration.
///////////////////////////////////

Backend.getServer = Backend.getServerStatus = function (sid, callback) {
	NodeBB.db.getObject('mi:server:' + sid, callback);
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

	var	pings = [];
	var sid = data.sid;
	var amount = data.last || 30;
	var stamps = [];
	var now = Date.now();

	if (sid < 0) return next(new Error("Invalid sid sent to getRecentPings: " + sid), pings);

	// Get stamps of the last 'amount' minutes.
	now = now - now % 60000;

	NodeBB.db.getObject('mi:server:' + sid + ':ping:' + now, function (err, ping) {
		if (!ping) now -= 60000;

		for (var i = 0; i < amount + 1; i++) stamps.push(now - i * 60000);

		stamps = stamps.reverse();

		// Read and parse the stored pings for each stamp.
		async.map(stamps, function (stamp, next) {

			NodeBB.db.getObject('mi:server:' + sid + ':ping:' + stamp, function (err, ping) {
				if (err) return next(err);

				if (!ping && stamps[stamps.length-1] === stamp) stamp = {players: -1};

				// Make missing pings blank instead of erroring.
				ping = ping || defaultPing;
				for (var p in defaultPing) ping[p] = ping[p] || defaultPing[p];

				// TODO: Read players as a separate hash.
				if (typeof ping.players === 'string') {
					try {
						ping.players = JSON.parse(ping.players);
					}catch(e){
						ping.players = [];
					}
				}

				// Remove invalid TPS values.
				if (parseInt(ping.tps, 10) > 100) ping.tps = "0";

				// Store stamp for charting, and human time for display.
				ping.timestamp = stamp;
				ping.humanTime = Utils.getHumanTime(stamp);

				next(null, ping);
			});
		}, next);
	});
};

var defaultPing = {
	players: [],
	tps: 0
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
		async.apply(updatePingList,           'mi:server:' + status.sid + ':pings', status.updateTime)
	], next);
};

function updatePingList(key, value, cb) {
	NodeBB.db.getListRange(key, 0, 0, function (err, values) {
		if (err) return cb(err);

		// Is the most recent ping stamp empty or outdated?
		if (!values || !values[0] || !values[0] === value) {
			NodeBB.db.listPrepend(key, value);
		}

		cb();
	});
}

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

        Backend.getUuidFromName(name, function (err, uuid) {
					if (err || !uuid) return next();

					avatars.push({name: name, base64: base64, id: uuid});
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
		url : async.apply(Config.getAvatarUrl, {name: name, size: 64}), // The full url for the avatar.
		id  : async.apply(Backend.getUuidFromName, name)             // We need this for cdns that use uuids.
	}, function (err, payload) {

		if (err) return next(err);

		var url = payload.url.replace('{uuid}', payload.id);

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
			Backend.getPlayerFromUuid(value.value, function (err, profile) {
				if (err) return next(err);
				next(null, {id: value.value, name: profile.name, playtime: value.score, playtimeHuman: Utils.parseMinutesDuration(value.score)});
			});
		}, callback);
	});
};
