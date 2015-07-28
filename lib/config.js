"use strict";

var Config = {
		getServer: getServer,
		cdns: {
			mojang: {
				format: "http://skins.minecraft.net/MinecraftSkins/{name}.png",
				styles: {
					flat: {
						transform: function (buffer, next) {
							lwip.open(buffer, 'png', function (err, image) {
								if (err) return next(err);

								image.crop(8, 8, 15, 15, function (err, image) {
									image.resize(64, 64, "nearest-neighbor", function (err, image) {
										image.toBuffer("png", next)
									});
								});
							});
						}
					}
				}
			},
			brony: {
				format: "http://minelpskins.voxelmodpack.com/skins/{uuid}.png",
				styles: {
					flat: {
						transform: function (buffer, next) {
							lwip.open(buffer, 'png', function (err, image) {
								if (err) return next(err);

								var scale = image.height()/4;
								image.crop(scale, scale, scale*2-1, scale*2-1, function (err, image) {
									image.resize(64, 64, "nearest-neighbor", function (err, image) {
										image.toBuffer("png", next)
									});
								});
							});
						}
					}
				}
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
		}
	},

	NodeBB = require('./nodebb'),
	Utils  = require('./utils'),

	async   = require('async'),
	util    = require('util'),
	request = require('request'),
	lwip    = require('lwip'),

	defaultSettings = {
		'APIKey':      "SECRETPASSWORD",
		'avatarCDN':   "mojang",
		'avatarSize':  "40",
		'avatarStyle': "flat",
		'pingExpiry':  365,
		'serverPingFrequency': '1000',
		'servers': [],
	};

Config.settings = new NodeBB.Settings('minecraft-integration', '0.4.0', defaultSettings);

Config.getConfig = function (data, next) {
	var config = Config.settings.get();

	delete config.APIKey;

	next(null, config);
};

Config.logActiveServers = function () {
	Config.logServers(true);
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
		}
		next();
	});
};

Config.logSettings = function () {
	console.log(util.inspect(Config.settings.get(), { showHidden: true, depth: null }));
};

Config.getAvatarExpiry = function () {
	// An hour
	// TODO: Make it a config option.
	return 60 * 60;
};

Config.getPingExpiry = function () {
	return Config.settings.get('pingExpiry') ? (Config.settings.get('pingExpiry') * 24 * 60 * 60) : (365 * 24 * 60 * 60);
};

Config.getProfileExpiry = function () {
	// A day
	// TODO: Make it a config option.
	return 60 * 60 * 24;
};

Config.getConfigValue = function (data, next) {
	if (!data || !data.key) {
		next("[[error:no-key]]");
	}else if (!defaultSettings.hasOwnProperty(data.key)) {
		next("[[error:invalid-key]]");
	}else if (data.key === 'APIKey') {
		next("[[error:invalid-key]]");
	}else{
		next(null, Config.settings.get(data.key) || defaultSettings[data.key]);
	}
};

function getServer(sid) {
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

Config.getAvatarUrl = function (data, callback) {
	var cdn = Config.settings.get('avatarCDN');

	if (cdn === 'custom') {
		cdn = Config.settings.get('customCDN');
	}else{
		cdn = Config.cdns[Config.settings.get('avatarCDN')].format;
	}

	if (data && data.size) {
		cdn = cdn.replace("{size}", data.size)
	}else{
		cdn = cdn.replace("{size}", Config.settings.get('avatarSize'));
	}
	if (data && data.name) cdn = cdn.replace("{name}", data.name);

	console.log("Returning avatar url for " +data.name+ ": " + cdn);

	callback(null, cdn);
};

module.exports = Config;
