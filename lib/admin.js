"use strict";

var	Admin = module.exports = { },

	NodeBB  = require('./nodebb'),
	Backend = require('./backend'),
	Utils   = require('./utils'),
	Config  = require('./config'),

	winston = require('winston');

Admin.init = function () {

	// Settings
	NodeBB.SocketAdmin.settings.syncMinecraftIntegration = function(){
		Config.settings.sync(function(){
			Config.logSettings();
		});
	};

	NodeBB.SocketAdmin.settings.resetMinecraftIntegration = function(){
		Config.settings.reset(Config.logSettings);
	};

	// ACP
	NodeBB.SocketAdmin.MinecraftIntegration = { };

	function addAdminSocket(name, func) {
		NodeBB.SocketAdmin.MinecraftIntegration[name] = function (socket, data, next) {
			func(data, function (err, data) {
				if (err) winston.error(err);
				next(err, data);
			});
		};
	}

	addAdminSocket('deleteUser',    Backend.deleteUser);
	addAdminSocket('refreshUser',   Backend.refreshUser);
	addAdminSocket('resetUsers',    Backend.resetUsers);
	addAdminSocket('deleteAvatar',  Backend.deleteAvatar);
	addAdminSocket('refreshAvatar', Backend.refreshAvatar);
	addAdminSocket('resetAvatars',  Backend.resetAvatars);
	addAdminSocket('deletePlayer',  Backend.deletePlayer);
	addAdminSocket('refreshPlayer', Backend.refreshPlayer);
	addAdminSocket('resetPlayers',  Backend.resetPlayers);

};
