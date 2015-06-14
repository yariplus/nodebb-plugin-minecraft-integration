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

			Sockets.sockets[sid].on('PlayerJoin', function (data) {
				data = data.split(":");
				data = {
					sid: sid,
					player: {
						id: data[0] || 'unknown uuid',
						name: data[1] || 'unknown name'
					}
				};

				NodeBB.db.getObjectField('mi:server:' + data.sid, 'players', function (err, players) {
					if (err) return console.log(err);

					var found = false;

					try {
						players = JSON.parse(players);
					}catch(e){
						return console.log(e);
					}
					for (var i in players) {
						if (players[i] === null) continue;
						if (players[i].id === data.player.id) found = true;
					}
					if (!found) {
						players.push({id: data.player.id, name: data.player.name});
					}
					try {
						players = JSON.stringify(players);
					}catch(e){
						return console.log(e);
					}

					NodeBB.db.setObjectField('mi:server:' + data.sid, 'players', players, function (err) {
						if (err) return console.log(err);
					});
				});

				Controller.sendPlayerJoinToUsers(data);
			});

			Sockets.sockets[sid].on('PlayerQuit', function (data) {
				data = data.split(":");
				data = {
					sid: sid,
					player: {
						id: data[0] || 'unknown uuid',
						name: data[1] || 'unknown name'
					}
				};

				NodeBB.db.getObjectField('mi:server:' + data.sid, 'players', function (err, players) {
					if (err) return console.log(err);

					try {
						players = JSON.parse(players);
					}catch(e){
						return console.log(e);
					}

					for (var i in players) {
						if (players[i].id === data.player.id) {
							players.splice(i, 1);
						};
					}
					try {
						players = JSON.stringify(players);
					}catch(e){
						players = '[]';
						return console.log(e);
					}

					NodeBB.db.setObjectField('mi:server:' + data.sid, 'players', players, function (err) {
						if (err) return console.log(err);
					});
				});

				Controller.sendPlayerQuitToUsers(data);
			});

			Sockets.sockets[sid].on('PlayerChat', function (data) {
				data = data.split(":");
				data = {
					sid: sid,
					chat: {
						playername: data[0] || 'unknown playername',
						message: data[1] || 'unknown message'
					}
				};

				NodeBB.db.increment('mi:server:' + sid + ':cid', function (err, cid) {
					NodeBB.db.sortedSetAdd('mi:server:' + sid + ':cid:time', Date.now(), cid, function (err) {
						NodeBB.db.setObject('mi:server:' + sid + ':chat:' + cid, {playername: data.chat.playername, message: data.chat.message}, function (err) {
							Controller.sendPlayerChatToUsers(data);
						});
					});
				});
			});

			Sockets.sockets[sid].on('TPS', function (data) {
				var updateTime = Math.round(Date.now()/60000) * 60000;
				NodeBB.db.setObjectField('mi:server:' + sid + ':ping:' + updateTime, 'tps', data, function (err) {
					NodeBB.db.expire('mi:server:' + sid + ':ping:' + updateTime, Config.getPingExpiry(), function (err) {
						if (err) console.log("[Minecraft Integration] TPS Error: " + err);
					});
				});
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
			console.log("[Minecraft Integration] Server id " + sid + " has a disconnected socket.");
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
