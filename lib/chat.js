"use strict";

var	NodeBB     = require('./nodebb'),
	Controller = require('./controller'),

	async  = require('async'),

	Chat = module.exports = {};

Chat.getChat = function (data, next) {

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
