"use strict";

var	API = module.exports = { },

	NodeBB       = require('./nodebb'),
	Backend      = require('./backend'),
	Config       = require('./config'),
	Controller   = require('./controller'),
	Utils        = require('./utils'),
	Chat         = require('./chat'),
	Registration = require('./registration');

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

		if (!!path) {
			NodeBB.router.get('/api/minecraft-integration/' + 'write/:key/' + path, function (req, res, next) {
				if (!isValid(req.params)) {
					return res.json({error: "No API key."});
				}else{
					req.params.sid = Config.getSidUsingAPIKey(req.params.key);
					if (req.params.sid === -1) return res.json({error: "Invalid API key."});
				}

				callHTTP(method, respondWith, req, res, next);
			});
		}

		NodeBB.SocketPlugins.MinecraftIntegration[name] = function (socket, data, next) {
			if (!isValid(data)) {
				return next("No API key.", {});
			}else{
				data.sid = Config.getSidUsingAPIKey(data.key);
				if (data.id) data.id = Utils.trimUUID(data.id);
				if (data.sid === -1) return next("Invalid API key.", {});
				Config.setServerSocket({sid: data.sid, socketid: socket.id});
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
	addToAPI(Backend.getPlayer,               'getPlayer',               'players/name/:name');
	addToAPI(Backend.getPlayer,               'getPlayer',               'players/uuid/:id');
	addToAPI(Backend.getProfiles,             'getProfiles',             'profiles');
	addToAPI(Backend.getProfile,              'getProfile',              'profile/name/:name');
	addToAPI(Backend.getProfile,              'getProfile',              'profile/uuid/:id');

	addToAPI(Backend.getRegisteredUsers,      'getRegisteredUsers',      'users');
	addToAPI(Backend.getRegisteredUser,       'getRegisteredUser',       'users/uuid/:id');
	addToAPI(Backend.getRegisteredUser,       'getRegisteredUser',       'users/name/:name');

	addToAPI(Config.getConfig,                'getConfigValue',          'config');
	addToAPI(Config.getConfig,                'getSettingsValue',        'settings');
	addToAPI(Config.getConfigValue,           'getConfigValue',          'config/:key');
	addToAPI(Config.getConfigValue,           'getSettingsValue',        'settings/:key');

	addToAPI(Backend.getPrefix,               'getPrefix',               'players/prefix/:name');

	addToAPI(Config.getAvatarUrl,   'getAvatarUrl',     'avatar');

	addToAPI(Utils.getKey,          'getKey',           'key');

	addToAPI(Backend.getPlaytimes,             'getPlaytimes',             'playtimes');
	addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top');
	addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top/:show');

	// Write API
	// TODO: Move the functions out.

	function eventStatus(status, next) {

		var	updateTime = Math.round(Date.now()/60000) * 60000,
			sid = status.sid,
			tps = status.tps;

		// TEMP
		console.log("Got socket status:");
		console.dir(status);

		status.isServerOnline = 1;

		// TODO: Add a sortedSet of timestamps so that we can adjust the expire time of all pings.
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

		Backend.updateServerStatus(status, function () {});

		next();
	}
	addToWriteAPI(eventStatus, 'eventStatus');

	function eventPlayerJoin(data, next) {

		// Assert parameters.
		if (!(data && data.id && data.name)) return next();

		var	name   = data.name,
			id     = data.id,
			prefix = data.prefix;

		// Update player profile.
		if (!!prefix) {
			console.log("Setting prefix: " + prefix + " for " + name + " (" + id + ")");
			NodeBB.db.setObjectField('yuuid:' + id, 'prefix', Utils.parseFormatCodes(prefix));
		}

		// Update server status.
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
	}

	NodeBB.SocketPlugins.MinecraftIntegration.getChat      = Chat.getChat;
	NodeBB.SocketPlugins.MinecraftIntegration.eventWebChat = Chat.eventWebChat;

	addToWriteAPI(Chat.eventPlayerChat, 'eventPlayerChat', 'chat/:id/:name/:message');

	addToWriteAPI(function (data, next) {
		Config.getServerConfig({sid: Config.getSidUsingAPIKey(data.key)}, next);
	}, 'test', '');
	addToWriteAPI(Registration.register, 'commandRegister', 'register/:id/:name/:pass');
	addToWriteAPI(eventPlayerJoin, 'eventPlayerJoin', 'join/:id/:name');
	addToWriteAPI(eventPlayerQuit, 'eventPlayerQuit', 'quit/:id/:name');

};
