"use strict";

var Controller = { },

	NodeBB = require('./nodebb'),

	async = require('async');

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

Controller.sendWebChatToServer = function (data, callback) {
	if (!NodeBB.SocketIO.server.sockets.connected[data.socketid]) return console.log("Server disconnected...not sending eventWebChat.");
	NodeBB.SocketIO.server.sockets.connected[data.socketid].emit("eventWebChat", data.chat);
};

var Shouts = { };

Shouts.parse = function(raw, userData, callback) {
	async.parallel({
		parsed: async.apply(NodeBB.Plugins.fireHook, 'filter:parse.raw', raw),
		isAdmin: async.apply(NodeBB.User.isAdministrator, userData.uid),
		status: function(next) {
			next(null, NodeBB.SocketIO.isUserOnline(userData.uid) ? (userData.status || 'online') : 'offline');
		}
	}, function(err, result) {
		if (err) {
			callback(null, {
				user: userData,
				content: raw
			});
		}

		userData.status = result.status;
		userData.isAdmin = result.isAdmin;

		callback(null, {
			user: userData,
			content: result.parsed
		});
	});
};

Controller.sendShout = function () {
	var fromuid = 1, content = "Test Shout",
		userFields = ['uid', 'username', 'userslug', 'picture', 'status'];

	NodeBB.db.incrObjectField('global', 'nextSid', function(err, sid) {
		if (err) return;

		var shout = {
			sid: sid,
			content: content,
			timestamp: Date.now(),
			fromuid: fromuid,
			deleted: '0'
		};

		async.parallel([
			async.apply(NodeBB.db.setObject, 'shout:' + sid, shout),
			async.apply(NodeBB.db.listAppend, 'shouts', sid)
		], function(err) {
			if (err) return;

			NodeBB.db.getObject('shout:' + shout.sid, function(err, shout) {
				if (err) return;

				// Get a list of unique uids of the users of non-deleted shouts
				// uids = shouts.map(function(s) {
					// return parseInt(s.deleted, 10) !== 1 ? parseInt(s.fromuid, 10) : null;
				// }).filter(function(u, index, self) {
					// return u === null ? false : self.indexOf(u) === index;
				// });

				NodeBB.User.getUserFields(1, userFields, function(err, userData) {
					if (err) return;

					Shouts.parse(shout.content, userData, function(err, s) {
						shout.user = s.user;
						shout.content = s.content;

						NodeBB.SocketIO.server.sockets.emit('event:shoutbox.receive', shout);

						//next(null, shout);
					});
				});
			});

			//getShouts([sid], callback);
		});
	});
};

module.exports = Controller;
