"use strict";

var NodeBB		= require('./nodebb'),
	Config		= require('./config'),
	SocketIO	= require('socket.io-client'),
	Sockets		= { sockets: { } };

Sockets.init = function () {
};

function initServer(sid) {
	var server = Config.getServer(sid),
		uri = server.xAPI || server.address || "http://0.0.0.0:25565/";

	Sockets.sockets[sid] = SocketIO(uri);

	Sockets.sockets[sid].on('connect', function(){
		console.log("[MinecraftIntegration] Successfully established socket connection to Minecraft server " + server.name + " (" + uri + ")");
	});
	Sockets.sockets[sid].on('someevent', function(data){
		console.log("[MinecraftIntegration] Received event from Minecraft server " + server.name + " (" + uri + ")");
		console.log(data);
	});
	Sockets.sockets[sid].on('disconnect', function(){
		console.log("[MinecraftIntegration] Lost socket connection to Minecraft server " + server.name + " (" + uri + ")");
	});
	Sockets.sockets[sid].on('error', function(err){
		console.log("[MinecraftIntegration] Socket Error from Minecraft server " + server.name + " (" + uri + ")");
		console.log(err);
	});
}

Sockets.isConnected = function (sid) {
	if (Sockets.sockets[sid] !== void 0) {
		console.log("[MinecraftIntegration] Server id " + sid + " has socket id " + Sockets.sockets[sid].id + ".");
	}else{
		console.log("[MinecraftIntegration] Server id " + sid + " does not have a socket id.");
	}
	return Sockets.sockets[sid] !== void 0;
};

Sockets.canHasServer = function (sid, callback) {
	if (Sockets.isConnected(sid)) {
		callback(null, true);
	}else{
		initServer(sid);
		setTimeout(function () {
			callback(null, Sockets.isConnected);
		}, 3000);
	}
};

module.exports = Sockets;
