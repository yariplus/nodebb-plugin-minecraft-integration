"use strict";

var NodeBB = require('./nodebb'),

	Controller = { };

Controller.updateClients = function (ping, callback) {
	NodeBB.SocketIO.server.emit('mi.ping', ping);
};

module.exports = Controller;
