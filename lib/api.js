"use strict";

var	API = module.exports = { },

	NodeBB       = require('./nodebb'),
	Backend      = require('./backend'),
	Config       = require('./config'),
	Controller   = require('./controller'),
	Utils        = require('./utils'),
	Chat         = require('./chat'),
	Registration = require('./registration');

require('./api/chat')(API)
require('./api/players')(API)
require('./api/status')(API)
require('./api/users')(API)

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
			if (err) {
				console.log(err);
				return res.sendStatus(404);
			}
			switch (respondWith) {
				default:
				case "JSON":
					res.json(response);
					break;
				case "Buffer":
					if (req.get('If-Modified-Since') === response.modified) {
						res.sendStatus(304);
					}else{
						res.writeHead(200, {
							'Cache-Control' : 'private',
							'Last-Modified' : response.modified,
							'Content-Type'  : 'image/png'
						});
						res.end(response.buffer || new Buffer(response.base, 'base64'), 'binary');
					}
					break;
				case "String":
					res.writeHead(200, {
					  'Content-Type': 'text/plain'
					});
					res.end(response.base || response, 'binary');
					break;
			}
		});
	}

	function addToAPI(method, name, path, respondWith) {
		respondWith = respondWith || "JSON";

		NodeBB.router.get('/api/minecraft-integration/' + path, function (req, res, next) { callHTTP(method, respondWith, req, res, next); });

		NodeBB.SocketPlugins.MinecraftIntegration[name] = function (socket, data, next) {
			data.sender = socket.uid;
			method(data, next);
		};
	}

	function addToWriteAPI(method, name, path, respondWith) {

		// TODO: A write request probably wouldn't respond with anything but JSON.
		respondWith = respondWith || "JSON";

		// Write using HTTP.
		if (!!path) {

			// TODO: Should be a PUT request.
			NodeBB.router.get('/api/minecraft-integration/' + 'write/:key/' + path, function (req, res, next) {

				if (!(req.params && req.params.key)) return res.json(new Error("No API key."));

				Backend.getSidUsingAPIKey(req.params.key, function (err, sid) {

					if (err) return res.json({error: "Invalid API key."});
					if (!sid) return res.json({error: "Invalid API key."});

					req.params.sid = sid;

					callHTTP(method, respondWith, req, res, next);

				});

			});
		}

		// Write using sockets.
		NodeBB.SocketPlugins.MinecraftIntegration[name] = function (socket, data, next) {

			if (!(data && data.key)) return next(new Error("No API key."));

			// TODO: Proper logger.
			// Log.info('Write API connection attempt with key ' + data.key);

			// Verify API key.
			Backend.getSidUsingAPIKey(data.key, function (err, sid) {

				if (err || !sid) {
					// TODO
					console.log("Invalid API key for " + data.sid);
					return next("Invalid API key.", {});
				}

				data.sid = sid;

				// If event has a player id, trim it to Mojang's format.
				if (data.id) data.id = Utils.trimUUID(data.id);

				// Set the socket.id so that we can send events back to the server.
				NodeBB.db.setObjectField('mi:server:' + data.sid + ':config', 'socketid', socket.id);

				// Detach key from data response.
				delete data.key;

				method(data, next);

			});

		};
	}

	// Read API

	addToAPI(Backend.getServers,              'getServers',              'servers');

	addToAPI(API.getServerStatus,             'getServerStatus',         'server/:sid');
	addToAPI(Backend.getRecentPings,          'getRecentPings',          'server/:sid/pings');
	addToAPI(Backend.getRecentPings,          'getRecentPings',          'server/:sid/pings/:last');
	addToAPI(Backend.getServerIcon,           'getServerIcon',           'server/:sid/icon',           'Buffer');
	addToAPI(Backend.getServerPlugins,        'getServerPlugins',        'server/:sid/plugins');

	addToAPI(Chat.getChat,                    'getChat',                 'server/:sid/chat');
	addToAPI(Chat.getChat,                    'getChat',                 'server/:sid/chat/:chats');
	addToAPI(Chat.getChat,                    'getChat',                 'server/:sid/chat/:chats/:max');

	addToAPI(Backend.getAvatars,              'getAvatars',              'avatars');
	addToAPI(Backend.getAvatar,               'getAvatar',               'avatar/:name',               "String");
	addToAPI(Backend.getAvatar,               'getAvatar',               'avatar/:name/:size',         "Buffer");

	// Tracked player objects.
	addToAPI(API.getPlayers,                  'getPlayers',              'players');
	addToAPI(API.getPlayer,                   'getPlayer',               'players/name/:name');
	addToAPI(API.getPlayer,                   'getPlayer',               'players/uuid/:id');
	addToAPI(API.getPlayer,                   'getUserPlayers',          'players/uid/:uid');

	addToAPI(API.getUsers,                'getUsers',                'users');
	addToAPI(API.getUser,                 'getUser',                 'users/uuid/:id');
	addToAPI(API.getUser,                 'getUser',                 'users/name/:name');

	addToAPI(Registration.resetPlayerKey,     'resetPlayerKey',          'users/reset/:uid');

	addToAPI(Config.getSettings,              'getSettings',             'settings');
	addToAPI(Config.getSettings,              'getSettings',             'settings/:key');

	addToAPI(API.getPlayerPrefix,               'getPrefix',               'players/prefix/:name');

	addToAPI(Config.getAvatarUrl,   'getAvatarUrl',     'avatar');

	addToAPI(Utils.getKey,          'getKey',           'key');

	addToAPI(Backend.getPlaytimes,             'getPlaytimes',             'playtimes');
	addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top');
	addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top/:show');

	// Write API

	addToWriteAPI(API.updateServerStatus, 'eventStatus');

	addToWriteAPI(API.eventPlayerChat,   'eventPlayerChat', 'chat/:id/:name/:message');
	addToWriteAPI(API.eventPlayerJoin,   'eventPlayerJoin', 'join/:id/:name');
	addToWriteAPI(API.eventPlayerQuit,   'eventPlayerQuit', 'quit/:id/:name');

	addToWriteAPI(Registration.register, 'commandRegister');

	addToWriteAPI(Controller.PlayerVotes, 'PlayerVotes');

	// Request API

	NodeBB.SocketPlugins.MinecraftIntegration.eventWebChat = API.eventWebChat;
	NodeBB.SocketPlugins.MinecraftIntegration.eventGetPlayerVotes = Controller.eventGetPlayerVotes;

};
