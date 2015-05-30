"use strict";

var NodeBB = require('./nodebb'),
	Config = require('./config');

module.exports = {
	init: function () {
		NodeBB.router.get('/api/minecraft-integration/server/:sid', function (req, res, next) {
			Config.getServerStatus(req.params.sid, function (status) {
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
			Config.getAvatarUrl({name: req.params.name}, function (err, url) {
				res.json(url);
			});
		});

		NodeBB.router.get('/api/minecraft-integration/avatar/:name/:size', function (req, res, next) {
			Config.getAvatarUrl({name: req.params.name, size: req.params.size}, function (err, url) {
				res.json(url);
			});
		});
	}
};
