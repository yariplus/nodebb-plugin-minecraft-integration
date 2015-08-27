"use strict";

var API = { },

	NodeBB     = require('./nodebb'),
	Backend    = require('./backend'),
	Config     = require('./config'),
	Controller = require('./controller'),
	Utils      = require('./utils'),

	async = require('async');

	// TEMP
	var syncs = { };

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

		function isValid(params) {
			return (params && params.key);
		}

		NodeBB.router.get('/api/minecraft-integration/' + 'write/:key/' + path, function (req, res, next) {
			if (!isValid(req.params)) {
				return res.json({error: "No API key."});
			}else{
				req.params.sid = Config.getSidUsingAPIKey(req.params.key);
				if (req.params.sid === -1) return res.json({error: "Invalid API key."});
			}

			callHTTP(method, respondWith, req, res, next);
		});

		NodeBB.SocketPlugins.MinecraftIntegration[name] = function (socket, data, next) {
			if (!isValid(data)) {
				return next("No API key.", {});
			}else{
				data.sid = Config.getSidUsingAPIKey(data.key);
				if (data.sid === -1) return next("Invalid API key.", {});
			}

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

	addToAPI(Utils.getKey,          'getKey',           'key');

	// TODO: add post routes.
	addToAPI(Backend.getPlaytimes,             'getPlaytimes',             'playtimes');
	addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top');
	addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top/:show');

	// TODO: Move this somewhere else.
	function getChat(socket, data, next) {
		var sid = data.sid;

		console.log("Getting chat for " + sid);

		NodeBB.db.getSortedSetRange('mi:server:' + sid + ':cid:time', -10, -1, function (err, cids) {
			console.log(err);
			console.log(cids);
			async.map(cids, function (cid, next) {
				next(null, 'mi:server:' + sid + ':chat:' + cid);
			}, function (err, keys) {
				NodeBB.db.getObjects(keys || [], function (err, chats) {
					console.log(chats);
					next(null, {sid: sid, chats: chats});
				});
			});
		});
	}
	NodeBB.SocketPlugins.MinecraftIntegration.getChat = getChat;

	function eventWebChat(socket, data, next) {
		console.log("web msg");
		console.log(data);
		if (!(data && data.sid && data.name && data.message)) return next();

		var name    = data.name,
			//id      = data.id,
			message = data.message,
			sid     = data.sid;

		NodeBB.db.increment('mi:server:' + sid + ':cid', function (err, cid) {
			NodeBB.db.sortedSetAdd('mi:server:' + sid + ':cid:time', Date.now(), cid, function (err) {
				// TODO: Remove '[WEB]', add variable check.
				NodeBB.db.setObject('mi:server:' + sid + ':chat:' + cid, {name: '[WEB] ' + name, message: message}, function (err) {
					Controller.sendPlayerChatToUsers({sid: sid, chat: {name: '[WEB] ' + name, message: message}});
					if (syncs[''+sid]) {
						console.log("sending server eventWebChat");
						Controller.sendWebChatToServer({socketid: syncs[''+sid], chat: {name: name, message: message}});
					}else{
						console.log("failed server eventWebChat");
						console.log(syncs);
					}
					next();
				});
			});
		});
	}
	NodeBB.SocketPlugins.MinecraftIntegration.eventWebChat = eventWebChat;

	NodeBB.SocketPlugins.MinecraftIntegration.eventSyncServer = function (socket, data, next) {
		console.log("Got Server Sync");
		console.log(data);
		if (!(data && data.socketid && data.key)) return console.log("Failed Server Sync");

		var sid = Config.getSidUsingAPIKey(data.key);
		if (sid === -1) return console.log("Invalid API key.");
		syncs['' + sid] = data.socketid;
		console.log("Stored server " + sid + " socket id: " + syncs['' + sid]);
	};

	// Write API Functions

	function emitTPS(data, next) {
		var updateTime = Math.round(Date.now()/60000) * 60000,
			sid = data.sid,
			tps = data.tps;

		NodeBB.db.setObjectField('mi:server:' + sid + ':ping:' + updateTime, 'tps', tps, function (err) {
			NodeBB.db.expire('mi:server:' + sid + ':ping:' + updateTime, Config.getPingExpiry(), function (err) {
				if (err) {
					next(null, "");
					console.log("[Minecraft Integration] TPS Error: " + err);
				}else{
					next(null, "");
				}
			});
		});
	}

	function eventPlayerJoin(data, next) {
		if (!(data && data.id && data.name)) return next();

		var name = data.name,
			id   = data.id;

		NodeBB.db.getObjectField('mi:server:' + data.sid, 'players', function (err, players) {
			if (err) return console.log(err);

			var found = false;

			try {
				players = JSON.parse(players);
			}catch(e){
				return console.log(e);
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

				Controller.sendPlayerJoinToUsers({sid: data.sid, player: {id: id, name: name}});

				NodeBB.db.setObjectField('mi:server:' + data.sid, 'players', players, function (err) {
					if (err) console.log(err);
					next();
				});
			}else{
				next();
			}
		});
	}

	function eventPlayerQuit(data, next) {
		if (!(data && data.id && data.name)) return next();

		var name = data.name,
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
	}

	function eventPlayerChat(data, next) {
		console.log("Got server msg");
		console.log(data);
		if (!(data /*&& data.id*/ && data.name && data.message)) return next();

		var name    = data.name,
			id      = data.id,
			message = data.message,
			sid     = data.sid;

		NodeBB.db.increment('mi:server:' + sid + ':cid', function (err, cid) {
			NodeBB.db.sortedSetAdd('mi:server:' + sid + ':cid:time', Date.now(), cid, function (err) {
				NodeBB.db.setObject('mi:server:' + sid + ':chat:' + cid, {name: name, message: message}, function (err) {
					Controller.sendPlayerChatToUsers({sid: sid, chat: {name: name, message: message}});
					next();
				});
			});
		});
	}

	addToWriteAPI(function (data, next) {
		Config.getServerConfig({sid: Config.getSidUsingAPIKey(data.key)}, next);
	}, 'test', '');
	addToWriteAPI(register,        'commandRegister', 'register/:id/:name/:pass');
	addToWriteAPI(emitTPS,         'emitTPS',         'tps/:tps');
	addToWriteAPI(eventPlayerJoin, 'eventPlayerJoin', 'join/:id/:name');
	addToWriteAPI(eventPlayerQuit, 'eventPlayerQuit', 'quit/:id/:name');
	addToWriteAPI(eventPlayerChat, 'eventPlayerChat', 'chat/:id/:name/:message');

	function register(data, next) {
		console.log("Got register");
		var key   = data.key,
			id    = Utils.trimUUID(data.id),
			email = data.email,
			name  = data.name,
			pass  = data.password;

		NodeBB.User.getUidByEmail(email.toLowerCase(), function (err, uid) {
			if (!!uid) {
				async.parallel({
					forumpass: async.apply(NodeBB.db.getObjectField, 'user:' + uid, 'password')
				}, function (err, results) {
					NodeBB.Password.compare(pass, results.forumpass, function (err, result) {
						if (!err && !!result) {
							async.parallel([
								// TODO: Create an account renaming option.
								// async.apply(User.updateProfile, uid, {fields: ['username'], username: name}),
								// TODO: Check validity of uuid and create a player profile.
								async.apply(NodeBB.User.setUserField, uid, 'yuuid', id),
								async.apply(NodeBB.db.sortedSetAdd, 'yuuid:sorted', 0, id + ':' + uid),
								async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, id)
							], function (err, results) {
								if (err) console.log("Register err: " + err);
								console.log("Set UUID for " + uid + " to " + id);
								next("REREGISTER");
							});
						}else{
							next("FAILPASS");
						}
					});
				});
			}else{
				NodeBB.User.create({ username: name, password: pass, email: email }, function (err, uid) {
					if (err) {
						console.log(err.message);
						next({err: err.message}, {err: "something"});
					}else{
						async.parallel([
							async.apply(NodeBB.User.setUserField, uid, 'yuuid', id),
							async.apply(NodeBB.db.sortedSetAdd, 'yuuid:sorted', 0, id + ':' + uid),
							async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, id)
						], function (err, results) {
							if (err) console.log("Register err: " + err);
							console.log("Set UUID for " + uid + " to " + id);
							next("SUCCESS");
						});
					}
				});
			}
		});
	}
};

module.exports = API;
