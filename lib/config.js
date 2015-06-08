"use strict";

var Config = { },

	NodeBB = require('./nodebb'),

	async = require('async'),
	util = require('util'),
	request = require('request'),

	defaultSettings = {
		'serverPingFrequency': '1000',
		'avatarCDN': "mojang",
		'avatarSize': "40",
		'avatarStyle': "flat",
		'servers': [],
		'pingExpiry': 365
	},
	cdns = {
		mojang: {
			format: "http://s3.amazonaws.com/MinecraftSkins/{name}.png"
		},
		cravatar: {
			format: "http://cravatar.eu/avatar/{name}/{size}"
		},
		signaturecraft: {
			format: "http://signaturecraft.us/avatars/{size}/face/{name}.png"
		},
		minotar: {
			format: "http://minotar.net/avatar/{name}/{size}"
		},
	};

Config.settings = new NodeBB.Settings('minecraft-integration', '0.4.0', defaultSettings);

Config.getServer = function (sid) {
	return Config.settings.get('servers')[sid];
};

Config.getServerByName = function (name, callback) {
	async.detect(Config.settings.get('servers'), function(server, next){
		next(server.name === name ? true : false);
	}, function(server){
		callback(server === void 0, server);
	});
};

Config.getServers = function (getActiveOnly) {
	var data = [], di, sid, servers = Config.settings.get('servers');
	for (sid in servers){
		if (!getActiveOnly || servers[sid].active) {
			di = data.push(JSON.parse(JSON.stringify(servers[sid]))) - 1;
			if (!data[di].active) data[di].name = servers[sid].name + ' (Inactive)';
			data[di].sid = sid;
		}
	}
	return data;
};

Config.getActiveServers = function () {
	return Config.getServers(true);
};

Config.getServerNames = function (getActiveOnly) {
	var serverNames = [],
		server;
	for (server in Config.settings.get('servers')){
		serverNames.push(server.name);
	}
	return serverNames;
};

Config.getActiveServerNames = function () {
	return Config.getServerNames(true);
};

Config.getServerStatus = function (sid, callback) {
	NodeBB.db.getObject('mi:server:' + sid, function (err, status) {
		if (err) {
			console.log(err);
			callback({ });
		}else{
			try {
				if (status.players && typeof status.players === 'string' && status.players !== 'undefined') status.players = JSON.parse(status.players);
				if (status.modList && typeof status.modList === 'string' && status.modList !== 'undefined') status.modList = JSON.parse(status.modList);
				if (status.pluginList && typeof status.pluginList === 'string' && status.pluginList !== 'undefined') status.pluginList = JSON.parse(status.pluginList);
			}catch(e){
				console.log("JSON ERROR: " + e);
			}
			callback(status);
		}
	});
};

Config.logServers = function (getActiveOnly) {
	console.log('[Minecraft Integration] Loggging servers...');
	var servers = Config.settings.get('servers');

	async.each(servers, function (server, next) {
		var serverNum = servers.indexOf(server);

		if (!getActiveOnly || servers[serverNum].active) {
			NodeBB.db.getObject('mi:server:' + serverNum, function (err, data) {
				if (err) {
					console.log(err);
				}else{
					data.icon = data.icon ? true : false;
					data.pluginList = data.pluginList ? true : false;
					data.modList = data.modList ? true : false;
					console.log('[Minecraft Integration] [' + server.name + '] SERVER STATUS:\n', util.inspect(data, { showHidden: true, depth: null }));
				}
			});
			Config.getRecentPings(serverNum, 2, function (pings) {
				console.log('[Minecraft Integration] [' + server.name + '] LAST 3 PINGS:\n', util.inspect(pings, { showHidden: true, depth: null }));
			});
		}
		next();
	});
};

Config.getRecentPings = function (sid, amount, callback) {
	var pings = { };

	NodeBB.db.getListRange('mi:server:' + sid + ':pings', 0, amount, function (err, stamps) {
		if (err) {
			console.log("stamps err: ", err);
			return callback({ });
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
					return callback({ });
				}

				return callback(pings);
			});
		}
	});
};

Config.logActiveServers = function () {
	Config.logServers(true);
};

Config.logSettings = function () {
	console.log(util.inspect(Config.settings.get(), { showHidden: true, depth: null }));
};

Config.getPingExpiry = function () {
	return Config.settings.get('pingExpiry') ? (Config.settings.get('pingExpiry') * 24 * 60 * 60) : (365 * 24 * 60 * 60);
};

Config.getAvatarUrl = function (data) {
	var cdn = Config.settings.get('avatarCDN');

	if (cdn === 'custom') {
		cdn = Config.settings.get('customCDN');
	}else{
		cdn = cdns[Config.settings.get('avatarCDN')].format;
	}

	if (data && data.name) cdn = cdn.replace("{name}", data.name);
	if (data && data.size) cdn = cdn.replace("{size}", data.size);

	return cdn;
};

Config.setAvatar = function (data) {
};

Config.getAvatar = function (player, callback) {
	NodeBB.db.get('mi:' + player + ':avatar', function (err, avatar) {
		if (err) console.log(err);

		if (!avatar) {
			request({url: 'http://cravatar.eu/avatar/yariplus/40', encoding: null}, function (error, response, body) {
				if (!error) {
					var base64 = new Buffer(body).toString('base64');

					NodeBB.db.set('mi:' + player + ':avatar', base64, function (err) {
						if (err) {
							console.log(err);
							callback(err, null);
						}else{
							callback(null, img);
						}
					});
				}else{
					console.log(error);
					callback(error, null);
				}
			});
		}else{
			console.log("Found db avatar: " + avatar);
			avatar = new Buffer(avatar.replace("data:image/png;base64,", ""), 'base64');
			callback(null, avatar);
		}
	});
};

module.exports = Config;
