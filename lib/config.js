"use strict";

var NodeBB = require('./nodebb'),
	util = require('util'),
	defaultSettings = {
		'serverPingFrequency': '1000',
		'avatarCDN': "mojang",
		'avatarSize': "40",
		'avatarStyle': "flat",
		'servers': []
	},
	Config = {
	settings: new NodeBB.Settings('minecraft-essentials', '0.4.0', defaultSettings),
	getServerByName: function(name, callback){
		async.detect(Config.settings.get('servers'), function(server, next){
			next(server.name === name ? true : false);
		}, function(server){
			callback(server === void 0, server);
		});
	},
	getServerNames: function(){
		var serverNames = [],
			server;
		for (server in Config.settings.get('servers')){
			serverNames.push(server.name);
		}
		return serverNames;
	},
	logServers: function () {
		var server;
		for (server in Config.settings.get('servers')){
			console.log(server);
		}
	},
	logSettings: function () {
		console.log(util.inspect(Config.settings.get(), { showHidden: true, depth: null }));
	}
};

module.exports = Config;
