"use strict";

var API = { },

	NodeBB     = require('./nodebb'),
	Backend    = require('./backend'),
	Config     = require('./config'),
	Controller = require('./controller'),

	async = require('async');

API.init = function () {

	// Initialize socket namespace
	NodeBB.SocketPlugins.MinecraftIntegration = { };

	// Define API Functions
	function callHTTP(method, respondWith, req, res, next) {
		var data = { };

		for (var param in req.params) {
			data[param] = req.params[param];
		}

		method(data, function (err, response) {
			if (err) console.log(err);
			switch (respondWith) {
				default:
				case "JSON":
					res.json(response);
					break;
				case "Buffer":
					res.writeHead(200, {
					  'Content-Type': 'image/jpeg'
					});
					res.end(response, 'binary');
					break;
				case "String":
					res.writeHead(200, {
					  'Content-Type': 'text/plain'
					});
					res.end(response, 'binary');
					break;
			}
		});
	}

	function addToAPI(method, name, path, respondWith) {
		respondWith = respondWith || "JSON";

		NodeBB.router.get('/api/minecraft-integration/' + path, function (req, res, next) { callHTTP(method, respondWith, req, res, next); });

		NodeBB.SocketPlugins.MinecraftIntegration[name] = function (socket, data, next) {
			method(data, next);
		};
	}

	function addToWriteAPI(method, name, path, respondWith) {
		respondWith = respondWith || "JSON";

		NodeBB.router.get('/api/minecraft-integration/' + path, function (req, res, next) {
			if (!isValid(req.params)) return callback("Invalid Packet", {});

			callHTTP(method, respondWith, req, res, next);
		});

		NodeBB.SocketPlugins.MinecraftIntegration[name] = function (socket, data, next) {
			if (!isValid(data)) return callback("Invalid Packet", {});

			method(data, next);
		};
	}

	// Read API
	addToAPI(Backend.getServerStatus,         'getServerStatus',         'server/:sid');
	addToAPI(Backend.getRecentPings,          'getRecentPings',          'server/:sid/pings');
	addToAPI(Backend.getRecentPings,          'getRecentPings',          'server/:sid/pings/:last');
	addToAPI(Backend.getServerIcon,           'getServerIcon',           'server/:sid/icon',           'Buffer');
	addToAPI(Backend.getServerPlugins,        'getServerPlugins',        'server/:sid/plugins');

	addToAPI(Backend.getAvatars,              'getAvatars',              'avatars');
	addToAPI(Backend.getAvatarBase64ByPlayer, 'getAvatarBase64ByPlayer', 'avatar/:name/base64',        "String");
	addToAPI(Backend.getAvatarByNameAtSize,   'getAvatarByNameAtSize',   'avatar/:name/:size',         "Buffer");

	addToAPI(Backend.getPlayers,              'getPlayers',              'players');
	addToAPI(Backend.getPlayer,               'getPlayer',               'players/uuid/:id');
	addToAPI(Backend.getPlayer,               'getPlayer',               'players/name/:name');

	addToAPI(Backend.getRegisteredUsers,      'getRegisteredUsers',      'users');
	addToAPI(Backend.getRegisteredUser,       'getRegisteredUser',       'users/uuid/:id');
	addToAPI(Backend.getRegisteredUser,       'getRegisteredUser',       'users/name/:name');

	addToAPI(Config.getConfig,                'getConfigValue',          'config');
	addToAPI(Config.getConfig,                'getSettingsValue',        'settings');
	addToAPI(Config.getConfigValue,           'getConfigValue',          'config/:key');
	addToAPI(Config.getConfigValue,           'getSettingsValue',        'settings/:key');

	addToAPI(Config.getAvatarUrl,   'getAvatarUrl',     'avatar');

	// TODO: add post routes.
	addToAPI(PlayerChat, 'PlayerChat', 'event/PlayerChat');

	addToAPI(Backend.getPlaytimes,             'getPlaytimes',             'playtimes');
	addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top');
	addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top/:show');

	// Write API
	addToWriteAPI(register, 'register', 'register/:id/:name/:pass/:key');

	// Socket Only
	function PlayerChat(socket, data, callback) {
		NodeBB.db.increment('mi:server:' + data.sid + ':cid', function (err, cid) {
			NodeBB.db.sortedSetAdd('mi:server:' + data.sid + ':cid:time', Date.now(), cid, function (err) {
				NodeBB.db.setObject('mi:server:' + data.sid + ':chat:' + cid, {playername: data.player, message: data.message}, function (err) {
					Controller.sendPlayerChatToUsers(data);
				});
			});
		});
	}

	function getChat(socket, data, next) {
		var sid = data.sid;

		NodeBB.db.getSortedSetRange('mi:server:' + sid + ':cid:time', -10, -1, function (err, cids) {
			async.map(cids, function (cid, next) {
				next(null, 'mi:server:' + sid + ':chat:' + cid);
			}, function (err, keys) {
				NodeBB.db.getObjects(keys || [], function (err, chats) {
					next(null, {sid: sid, chats: chats});
				});
			});
		});
	}

	NodeBB.SocketPlugins.MinecraftIntegration.PlayerChat      = PlayerChat;
	NodeBB.SocketPlugins.MinecraftIntegration.getChat         = getChat;

	function register(data, next) {
		var key   = data.key,
			id    = data.id,
			email = data.email,
			name  = data.name,
			pass  = data.pass;

		if (key === ( Config.settings.get('APIKey') || "SECRETPASSWORD" )) {
			NodeBB.User.getUidByEmail(email.toLowerCase(), function (err, uid) {
				if (!!uid) {
					async.parallel({
						forumpass: async.apply(NodeBB.db.getObjectField, 'user:' + uid, 'password')
					}, function (err, results) {
						console.log(results);
						NodeBB.Password.compare(pass, results.forumpass, function (err, result) {
							if (!err && !!result) {
								async.parallel([
									// TODO
									// async.apply(User.updateProfile, uid, {fields: ['username'], username: name}),
									async.apply(NodeBB.User.setUserField, uid, 'yuuid', id),
									async.apply(NodeBB.db.sortedSetAdd, 'yuuid:sorted', 0, id + ':' + uid),
									async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, id)
								], function (err, results) {
									if (err) console.log("Register err: " + err);
									console.log("Set UUID for " + uid + " to " + id);
									res.send("REREGISTER");
								});
							}else{
								res.send("FAILPASS");
							}
						});
					});
				}else{
					NodeBB.User.create({ username: name, password: pass, email: email }, function (err, uid) {
						if (err) {
							console.log(err.message);
							res.send(err.message);
						}else{
							async.parallel([
								async.apply(NodeBB.User.setUserField, uid, 'yuuid', id),
								async.apply(NodeBB.db.sortedSetAdd, 'yuuid:sorted', 0, id + ':' + uid),
								async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, id)
							], function (err, results) {
								if (err) console.log("Register err: " + err);
								console.log("Set UUID for " + uid + " to " + id);
								res.send("SUCCESS");
							});
						}
					});
				}
			});
		}else{
			console.log("An incorrect api key was sent.");
			next("FAILKEY");
		}
	};
};

module.exports = API;
