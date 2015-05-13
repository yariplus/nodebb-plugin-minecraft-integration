"use strict";

var NodeBB		= require('./nodebb'),
	Config		= require('./config'),
	SocketIO	= require('socket.io-client'),
	Sockets		= { sockets: { } };

Sockets.init = function () {
	// TODO:
	// Get active servers
	// Connect clients
};

Sockets.isConnected = function (sid) {
	// TODO:
	// Do a real test
	// Reconnect if instance exists, but lost connection
	return !!Sockets.sockets[sid];
};

Sockets.connect = function (sid) {
	if (!Sockets.isConnected[sid]) {
		Sockets.sockets[sid] = SocketIO(Config.getServer(sid).xAPI || Config.getServer(sid).address || "http://0.0.0.0:25565/");
		Sockets.sockets[sid].on('connect', function(){
			console.log("Successfully established socket connection to Minecraft server.");
			Sockets.sockets[sid].emit("someevent", "data");
		});
		Sockets.sockets[sid].on('event', function(data){
			console.log("=================");
		});
		Sockets.sockets[sid].on('disconnect', function(){
			console.log("Lost connection to Minecraft server.");
		});
		Sockets.sockets[sid].on('error', function(err){
			console.log(err);
		});
		return false;
	}else{
		return true;
	}
};

module.exports = Sockets;
