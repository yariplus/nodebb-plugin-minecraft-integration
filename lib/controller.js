// This is a wrapper for the API to send and receive messages from the Minecraft server(s).

"use strict";

var	NodeBB = require('./nodebb'),
	Config = require('./config'),
	Backend = require('./backend'),

	async = require('async'),

	Controller = module.exports = { };

// Socket event received from a user. Find the server config and socket.
function getServer(data, next)
{
	if (data.sid === void 0) return next(new Error("Data with no SID was sent to the socket controller."));

	Backend.getServerConfig({sid: data.sid}, function (err, server)
	{
		if (err) return callback(err);

		var socket = null;
		if (server.config.socketid && NodeBB.SocketIO.server.sockets.connected[server.config.socketid])
		{
			socket = NodeBB.SocketIO.server.sockets.connected[server.config.socketid];
		}

		return next(null, {server: server, socket: socket});
	});
}

Controller.sendPingToUsers = function (ping, callback) {
	NodeBB.SocketIO.in("online_users").emit('mi.ping', ping);
};

Controller.sendStatusToUsers = function (status, callback) {
	callback = callback || function(){};
	NodeBB.SocketIO.in("online_users").emit('mi.status', status);
	callback();
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

Controller.sendWebChatToServer = function (data, callback)
{
	getServer(data, function (err, serverData)
	{
		if (err) return console.log(err);
		if (!serverData || !serverData.socket) return console.log(new Error("Invalid response from controller getServer()"));

		serverData.socket.emit("eventWebChat", data.chat);
	});
};

Controller.sendRewardToServer = function (rewardData, callback) {
	// TODO: Send a Reward object to the server.
};

Controller.eventGetPlayerVotes = function (socket, data, callback)
{
	console.dir(data);
	getServer(data, function (err, serverData)
	{
		if (err) return console.log(err);
		if (!serverData || !serverData.socket) return console.log(new Error("Invalid response from controller getServer()"));

		callback();
		serverData.socket.emit("eventGetPlayerVotes", data.data);
	});
}

Controller.PlayerVotes = function (data, callback)
{
	console.log("Got PlayerVotes");
	console.dir(data);
	// Assert parameters.
	if (!(data && data.name && data.votes)) return callback();
	callback = callback || function(){};

	var	name    = data.name,
		votes   = data.votes,
		sid     = data.sid;

	Backend.getRegisteredUser({name: name}, function (err, user)
	{
		if (err) console.log(err);
		if (user) {
			console.log("Got user");
			console.dir(user);
			NodeBB.SocketIO.in('uid_' + user.uid).emit('mi.PlayerVotes', votes);
		}
	});

	callback();
};
