"use strict";

(function(){

	var	NodeBB     = require('./nodebb'),
		Controller = require('./controller'),

		async  = require('async'),

		Chat = module.exports = {};

	Chat.getChat = function (socket, data, next) {
		var sid = data.sid;

		NodeBB.db.getSortedSetRange('mi:server:' + sid + ':cid:time', -10, -1, function (err, cids) {
			async.map(cids, function (cid, next) {
				next(null, 'mi:server:' + sid + ':chat:' + cid);
			}, function (err, keys) {
				NodeBB.db.getObjects(keys || [], function (err, chats) {
					next(null, {sid: sid, chats: chats});
				});
			});
		});
	};

	Chat.eventWebChat = function (socket, data, next) {
		console.log("web msg");
		console.log(data);
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
	
	Chat.eventPlayerChat = function (data, next) {

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

}());
