"use strict";

var Admin = { },

	NodeBB = require('./nodebb'),
	Utils  = require('./utils'),
	Config = require('./config');

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
		callback(null);
	};
};

module.exports = Admin;
