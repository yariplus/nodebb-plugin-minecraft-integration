"use strict";

var Controller = { },

	NodeBB = require('./nodebb');

Controller.sendPingToUsers = function (ping, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.ping', ping);
};

Controller.sendStatusToUsers = function (status, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.status', status);
};

module.exports = Controller;
