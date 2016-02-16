"use strict";

var	NodeBB     = require('./nodebb'),
	Controller = require('./controller'),

	async  = require('async'),

	Chat = module.exports = {};

Chat.getChat = function (data, next) {

	var	sid = data.sid,
		amount = (data.chats ? data.chats : 15) * -1;

	NodeBB.db.getSortedSetRange('mi:server:' + sid + ':cid:time', amount, -1, function (err, cids) {
		async.map(cids, function (cid, next) {
			next(null, 'mi:server:' + sid + ':chat:' + cid);
		}, function (err, keys) {
			NodeBB.db.getObjects(keys || [], function (err, chats) {
				next(null, {sid: sid, chats: chats});
			});
		});
	});

};
