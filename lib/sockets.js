"use strict";

var Sockets      = { sockets: { } },

	NodeBB       = require('./nodebb'),
	Config       = require('./config'),
	Controller   = require('./controller'),

	SocketClient = require('socket.io-client');

function initServer(sid) {
	var server = Config.getServer(sid),
		uri = server.xAPI || server.address || "http://0.0.0.0:25565/";

	console.log("[Minecraft Integration] Attempting socket connection to " + uri);

	if (Sockets.sockets[sid] === void 0) {
		Sockets.sockets[sid] = SocketClient(uri, { reconnection: false, transports: ['websocket'] });

		// If the instance is new, add callbacks.
		if (Sockets.sockets[sid]._callbacks.connect.length === 1) {

			Sockets.sockets[sid].on('connect', function () {
				console.log('[Minecraft Integration] [' + server.name + '] Successfully established socket connection to Minecraft API at ' + uri);
			});

			Sockets.sockets[sid].on('ping', function (ping) {
				Controller.sendPingToUsers(ping);
			});

			Sockets.sockets[sid].on('disconnect', function () {
				console.log('[Minecraft Integration] [' + server.name + '] Lost socket connection to Minecraft API at ' + uri);
			});

			Sockets.sockets[sid].on('error', function (err) {
				console.log('[Minecraft Integration] [' + server.name + '] Socket Error from Minecraft API at ' + uri + ' : ' + err);
			});
		}
	}else{
		Sockets.sockets[sid].connect();
	}
}

Sockets.isConnected = function (sid) {
	if (Sockets.sockets[sid]) {
		if (Sockets.sockets[sid].io.engine.id) {
			console.log("[Minecraft Integration] Server id " + sid + " has socket id", Sockets.sockets[sid].io.engine.id);
			return true;
		}else{
			console.log("[Minecraft Integration] Server id " + sid + " has a disconnected socket. ", Sockets.sockets[sid]);
			return false;
		}
	}else{
		console.log("[Minecraft Integration] Server id " + sid + " does not have a socket connection.");
		return false;
	}
};

Sockets.canHasServer = function (sid, callback) {
	if (Sockets.isConnected(sid)) {
		callback(null, true);
	}else{
		initServer(sid);
		setTimeout(function () {
			callback(null, Sockets.isConnected(sid));
		}, 3000);
	}
};

module.exports = Sockets;
