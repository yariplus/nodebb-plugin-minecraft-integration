"use strict";

var API = { },

	NodeBB = require('./nodebb'),
	Config = require('./config'),

	async = require('async');

API.init = function () {
	NodeBB.router.get('/api/minecraft-integration/server/:sid', function (req, res, next) {
		Config.getServerStatus(req.params.sid, function (status) {
			status.sid = req.params.sid;
			res.json(status);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/server/:sid/pings', function (req, res, next) {
		Config.getRecentPings(req.params.sid, 10, function (pings) {
			res.json(pings);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/server/:sid/pings/:last', function (req, res, next) {
		Config.getRecentPings(req.params.sid, req.params.last, function (pings) {
			res.json(pings);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/server/:sid/icon', function (req, res, next) {
		Config.getServerStatus(req.params.sid, function (status) {
			if (status && status.icon) {
				var img = new Buffer(status.icon.replace("data:image/png;base64,", ""), 'base64');

				res.writeHead(200, {
				  'Content-Type': 'image/jpeg'
				});

				res.end(img);
			}else{
				res.send("No Icon Found.");
			}
		});
	});

	NodeBB.router.get('/api/minecraft-integration/server/:sid/plugins', function (req, res, next) {
		Config.getServerStatus(req.params.sid, function (status) {
			if (status && status.pluginList) {
				try {
					var plugins = JSON.parse(status.pluginList);
					res.json(plugins);
				} catch (e) {
					res.send("No Plugins Found.");
				}
			}else{
				res.send("No Plugins Found.");
			}
		});
	});

	NodeBB.router.get('/api/minecraft-integration/avatar', function (req, res, next) {
		res.json(Config.getAvatarUrl());
	});

	NodeBB.router.get('/api/minecraft-integration/avatar/size', function (req, res, next) {
		res.json(Config.settings.get('avatarSize'));
	});

	NodeBB.router.get('/api/minecraft-integration/avatar/:name', function (req, res, next) {
		Config.getAvatar({player: req.params.name}, function (err, img) {
			res.writeHead(200, {
			  'Content-Type': 'image/jpeg'
			});

			res.end(img, 'binary');
		});
	});

	NodeBB.router.get('/api/minecraft-integration/avatar/:name/base64', function (req, res, next) {
		Config.getAvatar({player: req.params.name, base64: true}, function (err, img) {
			res.writeHead(200, {
			  'Content-Type': 'text/plain'
			});

			res.end(img, 'binary');
		});
	});

	NodeBB.router.get('/api/minecraft-integration/avatar/:name/:size', function (req, res, next) {
		Config.getAvatarUrl({name: req.params.name, size: req.params.size}, function (err, url) {
			res.json(url);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/players', function (req, res, next) {
		Config.getPlayers(function (err, players) {
			res.json(players);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/playtimes', function (req, res, next) {
		Config.getPlaytimes(function (err, data) {
			res.json(data);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/playtimes/top', function (req, res, next) {
		Config.getTopPlayersByPlaytimes(20, function (err, data) {
			res.json(data);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/playtimes/top/:top', function (req, res, next) {
		Config.getTopPlayersByPlaytimes(req.params.top, function (err, data) {
			res.json(data);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/uuid/:uuid/playtime', function (req, res, next) {
		Config.getUuid(req.params.uuid, function (err, data) {
			res.json(data.playtime);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/uuid/:uuid', function (req, res, next) {
		Config.getUuid(req.params.uuid, function (err, data) {
			res.json(data);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/uuid/:uuid/username', function (req, res, next) {
		Config.getUsernameByUuid(req.params.uuid, function (err, data) {
			res.json(data);
		});
	});

	NodeBB.router.get('/api/minecraft-integration/uuids', function (req, res, next) {
		Config.getUuids(function (err, uuids) {
			res.json(uuids);
		});
	});

	NodeBB.router.post('/api/minecraft-integration/register', API.register);

	NodeBB.SocketPlugins.MinecraftIntegration = { };

	NodeBB.SocketPlugins.MinecraftIntegration.getPlayers = function (socket, data, callback) {
		Config.getPlayers(callback);
	};

	NodeBB.SocketPlugins.MinecraftIntegration.getPlayers = function (socket, data, callback) {
		Config.getPlayers(callback);
	};
};

API.register = function (req, res) {
	// TEMP
	var allowInsecure = true;

	if ('https' == req.protocol) {
		// This only works if the proxy is set up properly.
		console.log("Received secure connection from " + req.ip);
	}else{
		if (allowInsecure) {
			console.log("Allowing insecure connection from " + req.ip);
		}else{
			console.log("Denying insecure connection from " + req.ip);
			res.send("FAILSSL");
			return;
		}
	}

	if (req.body.key === Config.settings.get('api-key') || "SECRETPASSWORD") {
		NodeBB.User.getUidByEmail(req.body.email.toLowerCase(), function (err, uid) {
			if (!!uid) {
				async.parallel({
					forumpass: async.apply(NodeBB.db.getObjectField, 'user:' + uid, 'password')
					//reqpass: async.apply(NodeBB.User.hashPassword, req.body.password)
				}, function (err, results) {
					console.log(results);
					NodeBB.Password.compare(req.body.password, results.forumpass, function (err, result) {
						if (!err && !!result) {
							async.parallel([
								// TODO
								// async.apply(User.updateProfile, uid, {fields: ['username'], username: req.body.username}),
								async.apply(NodeBB.User.setUserField, uid, 'yuuid', req.body.uuid),
								async.apply(NodeBB.db.sortedSetAdd, 'yuuid:sorted', 0, req.body.uuid + ':' + uid),
								async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, req.body.uuid)
							], function (err, results) {
								if (err) console.log("Register err: " + err);
								console.log("Set UUID for " + uid + " to " + req.body.uuid);
								res.send("SUCCESS");
							});
						}else{
							res.send("FAILPASS");
						}
					});
				});
			}else{
				NodeBB.User.create({ username: req.body.username, password: req.body.password, email: req.body.email }, function (err, uid) {
					if (err) {
						console.log(err.message);
						res.send(err.message);
					}else{
						async.parallel([
							async.apply(NodeBB.User.setUserField, uid, 'yuuid', req.body.uuid),
							async.apply(NodeBB.db.sortedSetAdd, 'yuuid:sorted', 0, req.body.uuid + ':' + uid),
							async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, req.body.uuid)
						], function (err, results) {
							if (err) console.log("Register err: " + err);
							console.log("Set UUID for " + uid + " to " + req.body.uuid);
							res.send("SUCCESS");
						});
					}
				});
			}
		});
	}else{
		console.log("An incorrect api key was sent from " + req.ip);
		res.send("FAILKEY");
	}
};

module.exports = API;
