import { db } from './nodebb';
import Controller from './controller';
import async from 'async';
const Chat = module.exports = {};

Chat.getChat = (data, next) => {

	const sid = data.sid, amount = (data.chats ? data.chats : 15) * -1;

	db.getSortedSetRange(`mi:server:${sid}:cid:time`, amount, -1, (err, cids) => {
		async.map(cids, (cid, next) => {
			next(null, `mi:server:${sid}:chat:${cid}`);
		}, (err, keys) => {
			db.getObjects(keys || [], (err, chats) => {
				next(null, {sid, chats});
			});
		});
	});

};
