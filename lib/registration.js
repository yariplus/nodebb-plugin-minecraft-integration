"use strict";

var	Registration = module.exports = {},

	NodeBB  = require('./nodebb'),
	Backend = require('./backend'),

	async = require('async');

Registration.register = function (data, next) {

	// Assert parameters.
	if (!(data && data.id && data.email && data.name && data.password)) return next(new Error("FAILDATA"));

	// Local vars.
	var	id    = data.id,
		email = data.email,
		name  = data.name,
		pass  = data.password;

	console.log('Got "/register" command from Minecraft server ' + data.sid + '.');

	NodeBB.User.getUidByEmail(email.toLowerCase(), function (err, uid) {
		if (!!uid) {
			async.parallel({
				forumpass: async.apply(NodeBB.db.getObjectField, 'user:' + uid, 'password')
			}, function (err, results) {
				NodeBB.Password.compare(pass, results.forumpass, function (err, result) {
					if (!err && !!result) {
						async.parallel([
							// TODO: Create an account renaming option.
							// async.apply(User.updateProfile, uid, {fields: ['username'], username: name}),
							// TODO: Check validity of uuid and create a player profile.
							async.apply(NodeBB.User.setUserField, uid, 'yuuid', id),
							async.apply(NodeBB.db.setObjectField, 'yuuid:' + id, 'uid', uid),
							async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, id),
							async.apply(Backend.getProfileFromUuid, id)
						], function (err, results) {
							if (err) {
								console.log("Register err: " + err);
								next(err);
							}else{
								console.log("Set UUID for " + uid + " to " + id);
								next(null, {task: "REREGISTER"});
							}
						});
					}else{
						next(new Error("FAILPASS"));
					}
				});
			});
		}else{
			// MEMO: This is disabled for now.
			return next(new Error("FAILPASS"));

			NodeBB.User.create({ username: name, password: pass, email: email }, function (err, uid) {
				if (err) {
					console.log("Register err: " + err.message);
					next(err);
				}else{
					// TODO: Should be a backend method.
					async.parallel([
						async.apply(NodeBB.User.setUserField, uid, 'yuuid', id),
						async.apply(NodeBB.db.sortedSetAdd, 'yuuid:sorted', 0, id + ':' + uid),
						async.apply(NodeBB.db.sortedSetAdd, 'yuuid:uid', uid, id)
					], function (err, results) {
						if (err) {
							console.log("Register err: " + err);
							next(err);
						}else{
							console.log("Set UUID for " + uid + " to " + id);
							next(null, {task: "REGISTER"});
						}
					});
				}
			});
		}
	});
};
