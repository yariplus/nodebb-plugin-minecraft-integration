"use strict";

var	Registration = module.exports = {},

	NodeBB  = require('./nodebb'),
	Backend = require('./backend'),

	async = require('async');

Registration.register = function (data, next) {

	// Assert parameters.
	if (!(data && data.id && data.key)) return next(new Error("FAILDATA"));

	// Local vars.
	var	sid = data.sid,
		id  = data.id,
		key = data.playerkey;

	console.log('Got "/register" command from Minecraft server ' + sid + '.');

	NodeBB.db.sortedSetScore('playerkey:uid', key, function (err, uid) {
		if (err && !uid) return next(new Error("FAILKEY"));

		async.parallel([
			// TODO: Create an account renaming option.
			// async.apply(User.updateProfile, uid, {fields: ['username'], username: data.name}),
			async.apply(NodeBB.User.setUserField, uid, 'yuuid', id),
			async.apply(NodeBB.db.setObjectField, 'yuuid:' + id, 'uid', uid),
			async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, id),
			async.apply(Backend.getProfileFromUuid, id)
		], function (err, results) {
			if (err) {
				console.log("Register err for UID " + uid + ": " + err);
				next(new Error("FAILDB"));
			}else{
				console.log("Set the Minecraft UUID for UID " + uid + " to " + id);
				next(null, {result: "REGISTER"});
			}
		});
	});
};
