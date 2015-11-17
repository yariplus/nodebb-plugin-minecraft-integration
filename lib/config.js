"use strict";

// Nearest-neighbour algorithm.
function resize(image, width, height, next) {

	var result = new jimp(width, height);
	var _width = image.bitmap.width;
	var _height = image.bitmap.height;
	var x_ratio = _width/width;
	var y_ratio = _height/height;
	var pixels = [];
	var px, py;

	image.scan(0, 0, _width, _height, function (x, y, idx) {
		pixels.push(image.getPixelColor(x, y));
	});

	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			px = Math.floor( j * x_ratio );
			py = Math.floor( i * y_ratio );
			result.setPixelColor(pixels[Math.floor((py*_height) + px)], j, i);
		}
	}

	next(null, result);

}

var	Config = {
		getServer: getServer,
		cdns: {
			mojang: {
				format: "http://skins.minecraft.net/MinecraftSkins/{name}.png",
				styles: {
					flat: {
						transform: function (buffer, next) {
							jimp.read(buffer, function (err, image) {
								if (err) return next(err);
								image.crop(8, 8, 8, 8, function (err, image) {
									resize(image, 64, 64, function (err, image) {
										image.getBuffer(jimp.MIME_PNG, next);
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
							jimp.read(buffer, function (err, image) {
								if (err) return next(err);

								var scale = image.bitmap.width/8;

								var face = image.clone().crop(scale, scale, scale, scale);
								var hair = image.crop(scale*5, scale, scale, scale);

								face.composite(hair, 0, 0);

								resize(face, 64, 64, function (err, face) {
									face.getBuffer(jimp.MIME_PNG, next);
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
		},
		steve: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90KBgcJNY+Ri8MAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAABgklEQVRo3u2aPUvDUBSGkyZpquLHZB0E3R3UvXQUP0bdHQo6+BNEV0VxcRHEydEiDjp06tBZB1eF+kFRO5RCqZa0SeMfeDIEjCK8Z3zuzb15wuGcXBJzdnrYoPD7iA3bTCH3Ap/X8QPkqRSv49gW8jDk++FV/lFIQAISkMDfhh1V76PCD/mCoUwa+WjaRB4YXO8bbY/nh4FSSAISkIAEEugDUQOHW+vIXYfr/UBmBHnns8UbWPzsmh9vyPevSkohCUhAAhL4+TAvdjZwYNB1kX95/L5uWTy/2Woin8qOI395flAKSUACEpDAL54Hour9yvYx8tX8AfJCvhqr3p/cZJFfVo6QF3c3lUISkIAEJJDAeeCssIAD2YlJbhzuGPLrcjnWxmuLOeS110fk1XpDKSQBCUhAAgmcB9o9/v7arfH7fbFyi3xpZj7Wxnun58iXc3PcsAxHKSQBCUhAAgn0gaf3Og70+/F+JCrd3yG3HDvWOu0O9yWv11UKSUACEpDAz8c3YzNWaIbjJFkAAAAASUVORK5CYII='
	},

	NodeBB = require('./nodebb'),
	Utils  = require('./utils'),

	async   = require('async'),
	util    = require('util'),
	request = require('request'),
	jimp    = require('jimp'),

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
