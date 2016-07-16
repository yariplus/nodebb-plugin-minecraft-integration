const Admin = module.exports = { };
import deleteUser from './api'
import { SocketAdmin } from './nodebb';
import Backend from './backend';
import Utils from './utils';
import Config from './config';
import winston from 'winston';

Admin.init = () => {

	// Settings
	SocketAdmin.settings.syncMinecraftIntegration = () => {
		Config.settings.sync(() => {
			Config.logSettings();
		});
	};

	SocketAdmin.settings.resetMinecraftIntegration = () => {
		Config.settings.reset(Config.logSettings);
	};

	// ACP
	SocketAdmin.MinecraftIntegration = { };

	function addAdminSocket(name, func) {
		SocketAdmin.MinecraftIntegration[name] = (socket, data, next) => {
			func(data, (err, data) => {
				if (err) winston.error(err);
				next(err, data);
			});
		};
	}

	addAdminSocket('setServerConfig',  Backend.setServerConfig);
	addAdminSocket('getServersConfig', Backend.getServersConfig);
	addAdminSocket('deleteUser',       deleteUser);
	addAdminSocket('refreshUser',      Backend.refreshUser);
	addAdminSocket('resetUsers',       Backend.resetUsers);
	addAdminSocket('deleteAvatar',     Backend.deleteAvatar);
	addAdminSocket('refreshAvatar',    Backend.refreshAvatar);
	addAdminSocket('resetAvatars',     Backend.resetAvatars);
	addAdminSocket('deletePlayer',     Backend.deletePlayer);
	addAdminSocket('refreshPlayer',    Backend.refreshPlayer);
	addAdminSocket('resetPlayers',     Backend.resetPlayers);
	addAdminSocket('deleteServer',     Backend.deleteServer);

};
