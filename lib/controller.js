// This is a wrapper for the API to send and receive messages from the Minecraft server(s).

"use strict";

var	NodeBB = require('./nodebb'),
	Config = require('./config'),

	async = require('async'),

	Controller = module.exports = { };

Controller.sendPingToUsers = function (ping, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.ping', ping);
};

Controller.sendStatusToUsers = function (status, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.status', status);
};

Controller.sendPlayerJoinToUsers = function (player, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.PlayerJoin', player);
};

Controller.sendPlayerQuitToUsers = function (player, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.PlayerQuit', player);
};

Controller.sendPlayerChatToUsers = function (chat, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.PlayerChat', chat);
};

Controller.sendTimeToUsers = function (timeData, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.time', timeData);
};

Controller.sendWebChatToServer = function (data, callback) {
	var server = Config.settings.get('servers')[data.sid];

	if (server.socketid) {
		if (!NodeBB.SocketIO.server.sockets.connected[server.socketid]) return console.log("Server disconnected...not sending eventWebChat.");
		NodeBB.SocketIO.server.sockets.connected[server.socketid].emit("eventWebChat", data.chat);
	}
};

Controller.sendRewardToServer = function (rewardData, callback) {
	// TODO: Send a Reward object to the server.
};
