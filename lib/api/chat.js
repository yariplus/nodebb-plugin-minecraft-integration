"use strict";

var	async  = require('async'),

	NodeBB     = require('../nodebb'),
	Controller = require('../controller');

module.exports = function (API) {

	API.eventWebChat = function (socket, data, next) {

		if (!(data && data.sid && data.name && data.message)) return next();

		var	name    = data.name,
			message = data.message,
			sid     = data.sid;

		NodeBB.db.increment('mi:server:' + sid + ':cid', function (err, cid) {
			NodeBB.db.sortedSetAdd('mi:server:' + sid + ':cid:time', Date.now(), cid, function (err) {
				// TODO: Remove '[WEB]', add variable check.
				NodeBB.db.setObject('mi:server:' + sid + ':chat:' + cid, {name: '[WEB] ' + name, message: message}, function (err) {
					Controller.sendPlayerChatToUsers({sid: sid, chat: {name: '[WEB] ' + name, message: message}});
					Controller.sendWebChatToServer({sid: sid, chat: {name: name, message: message}});
					next();
				});
			});
		});
	};

	API.eventPlayerChat = function (data, next) {

		// Assert parameters.
		if (!(data && data.id && data.name && data.message)) return next();

		var	name    = data.name,
			id      = data.id,
			message = data.message,
			sid     = data.sid;

		NodeBB.db.increment('mi:server:' + sid + ':cid', function (err, cid) {
			NodeBB.db.sortedSetAdd('mi:server:' + sid + ':cid:time', Date.now(), cid, function (err) {
				NodeBB.db.setObject('mi:server:' + sid + ':chat:' + cid, {name: name, message: message}, function (err) {
					Controller.sendPlayerChatToUsers({sid: sid, chat: {name: name, message: message}});
					next();
				});
			});
		});
	};

};
