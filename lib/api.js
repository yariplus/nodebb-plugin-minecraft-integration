"use strict";

var API = { },

	NodeBB = require('./nodebb'),
	Config = require('./config');

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

	NodeBB.router.post('/api/minecraft-integration/register', API.register);
};

API.register = function (req, res) {
	if ('https' == req.protocol) {
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

	if (req.body.key === Config.settings.get('api-key')) {
		User.create({ username: req.body.username, password: req.body.password, email: req.body.email }, function (err, uid) {
			if (err) {
				console.log(typeof err);
				console.log(err);
				res.send(err);
			}else{
				User.setUserField(uid, 'uuid', req.body.uuid, function(){
					console.log("Set UUID for " + uid + " to " + req.body.uuid);
				});
				res.send("SUCCESS");
			}
		});
	}else{
		console.log("An incorrect api key was sent from " + req.ip);
		res.send("FAILKEY");
	}
};

module.exports = API;
