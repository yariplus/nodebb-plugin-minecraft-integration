"use strict";

var Admin = { },

	NodeBB  = require('./nodebb'),
	Backend = require('./backend'),
	Utils   = require('./utils'),
	Config  = require('./config'),

	winston = require('winston');

Admin.init = function () {
	NodeBB.SocketAdmin.settings.syncMinecraftIntegration = function(){
		Config.settings.sync(function(){
			Config.logSettings();
		});
	};

	NodeBB.SocketAdmin.settings.resetMinecraftIntegration = function(){
		Config.settings.reset(Config.logSettings);
	};

	NodeBB.SocketAdmin.MinecraftIntegration = { };

	NodeBB.SocketAdmin.MinecraftIntegration.resetCachedAvatars = function (socket, data, callback) {
		Backend.clearAvatars(function (err) {
			if (err) console.log(err);

			callback();
		});
	};

	NodeBB.SocketAdmin.MinecraftIntegration.resetCachedAvatar = function (socket, data, callback) {
		Backend.clearAvatar(data.playerName, function (err) {
			if (err) console.log(err);

			callback();
		});
	};

	NodeBB.SocketAdmin.MinecraftIntegration.refreshAvatar = function (socket, data, callback) {
		Backend.refreshAvatar(data.playerName, function (err, data) {
			if (err) console.log(err);

			callback(err, data);
		});
	};

	function addAdminSocket(name, func) {
		NodeBB.SocketAdmin.MinecraftIntegration[name] = function (socket, data, next) {
			func(data, function (err, data) {
				if (err) winston.error(err);
				next(err, data);
			});
		};
	}

	addAdminSocket('deleteProfile', Backend.deleteProfile);
};

module.exports = Admin;
