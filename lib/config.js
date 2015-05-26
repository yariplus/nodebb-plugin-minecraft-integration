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
	getServerStatus: function (sid, callback) {
		NodeBB.db.getObject('mi:server:' + sid, function (err, data) {
			if (err) {
				console.log(err);
				callback({ });
			}else{
				callback(data);
			}
		});
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
				Config.getRecentPings(serverNum, 3, function (pings) {
					console.log("Got pings: ");
					console.log(util.inspect(pings, { depth: null }));
				});
			}
			next();
		});
	},
	getRecentPings: function (sid, amount, callback) {
		var pings = { };

		console.log("Getting pings: ");

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

						pings[stamp] = ping;
						
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
