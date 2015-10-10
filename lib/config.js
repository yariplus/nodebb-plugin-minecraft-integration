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

								var scale = image.width()/8;

								image.extract(scale, scale, scale*2-1, scale*2-1, function (err, face) {
									image.extract(scale*5, scale, scale*6-1, scale*2-1, function (err, hair) {
										hair.crop((hair.width()/8), (hair.width()/8), hair.width()-(hair.width()/8)-1, hair.width()-(hair.width()/8)-1, function (err, hair) {
											hair.resize(64, 64, "nearest-neighbor", function (err, hair) {
												face.resize(64, 64, "nearest-neighbor", function (err, face) {
													face.paste(0, 0, hair, function (err, avatar) {
														avatar.toBuffer("png", next);
													});
												});
											});
										});
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
		'servers': []
	};

Config.settings = new NodeBB.Settings('minecraft-integration', '0.4.0', defaultSettings);

Config.getConfig = function (data, next) {

	// Shallow copy
	var config = JSON.parse(JSON.stringify(Config.settings.get()));

	// Remove API Keys
	for (var sid in config.servers) delete config.servers[sid].APIKey;

	next(null, config);
};

Config.getAPIKey = function (sid) {
	var server = getServer(sid);
	return (!!server && !!server.APIKey ? server.APIKey : null);
};

Config.getSidUsingAPIKey = function (key) {
	var servers = Config.settings.get('servers');

	for (var sid = 0; sid < servers.length; sid++) {
		if (servers[sid].APIKey === key) return sid;
	}
	return -1;
}

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
	return 1000 * 60 * 60 * 24;
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
	sid = sid >= 0 ? sid : 0;
	return Config.settings.get('servers')[sid];
};

Config.getServerConfig = function (data, next) {
	if (data && data.sid !== null && typeof data.sid !== 'undefined' && data.sid !== -1) {
		// Shallow copy
		var server = JSON.parse(JSON.stringify(getServer(data.sid)));

		// Remove API Key
		delete server.APIKey;

		return next(null, server);
	}else{
		return next(null, null);
	}
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

	callback(null, cdn);
};

Config.setServerSocket = function (data) {
	var settings = Config.settings.get();

	settings.servers[data.sid].socketid = data.socketid;

	Config.settings.set(settings);
	Config.settings.persist();
};

module.exports = Config;
