"use strict";

var NodeBB = require('./nodebb'),
	async = require('async'),
	util = require('util'),
	defaultSettings = {
		'serverPingFrequency': '1000',
		'avatarCDN': "mojang",
		'avatarSize': "40",
		'avatarStyle': "flat",
		'servers': [],
		'pingExpiry': 365
	},
	Config = {
	settings: new NodeBB.Settings('minecraft-integration', '0.4.0', defaultSettings),
	getServer: function (sid) {
		return Config.settings.get('servers')[sid];
	},
	getServerByName: function (name, callback){
		async.detect(Config.settings.get('servers'), function(server, next){
			next(server.name === name ? true : false);
		}, function(server){
			callback(server === void 0, server);
		});
	},
	getServers: function (getActiveOnly) {
		var data = [], di, sid, servers = Config.settings.get('servers');
		for (sid in servers){
			if (!getActiveOnly || servers[sid].active) {
				di = data.push(JSON.parse(JSON.stringify(servers[sid]))) - 1;
				if (!data[di].active) data[di].name = servers[sid].name + ' (Inactive)';
				data[di].sid = sid;
			}
		}
		return data;
	},
	getActiveServers: function () {
		return Config.getServers(true);
	},
	getServerNames: function (getActiveOnly) {
		var serverNames = [],
			server;
		for (server in Config.settings.get('servers')){
			serverNames.push(server.name);
		}
		return serverNames;
	},
	getActiveServerNames: function () {
		return Config.getServerNames(true);
	},
	logServers: function (getActiveOnly) {
		console.log('MI: Loggging servers...');
		var servers = Config.settings.get('servers');

		async.each(servers, function (server, next) {
			var serverNum = servers.indexOf(server);

			if (!getActiveOnly || servers[serverNum].active) {
				NodeBB.db.getObject('mi:server:' + serverNum, function (err, data) {
					if (err) {
						console.log(err);
					}else{
						console.log('SERVER STATUS:\n', util.inspect(data, { showHidden: true, depth: null }));
					}
				});
				NodeBB.db.getListRange('mi:server:' + serverNum + ':pings', 0, 4, function (err, data) {
					if (err) {
						console.log(err);
					}else{
						console.log('timestamps: ', JSON.stringify(data));
						for (var i in data) {
							console.log('getting key: ' + 'mi:server:' + serverNum + ':ping:' + data[i]);
							NodeBB.db.getObject('mi:server:' + serverNum + ':ping:' + data[i], function (err, data) {
								if (err) {
									console.log(err);
								}
								console.log(util.inspect(data, { depth: null }));
								console.log(typeof data.players);
							});
						}
					}
				});
			}
			next();
		});
	},
	logActiveServers: function () {
		Config.logServers(true);
	},
	logSettings: function () {
		console.log(util.inspect(Config.settings.get(), { showHidden: true, depth: null }));
	},
	getPingExpiry: function () {
		return Config.settings.get('pingExpiry') ? (Config.settings.get('pingExpiry') * 24 * 60 * 60) : (365 * 24 * 60 * 60);
	}
};

module.exports = Config;
