"use strict";

var Controller = { },

	NodeBB = require('./nodebb');

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

module.exports = Controller;
