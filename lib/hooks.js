"use strict";

var NodeBB = require('./nodebb'),
	Config = require('./config'),
	Views = require('./views'),
	Hooks = {
		filter: {
			admin: {
				header: {
					build: Views.buildAdminHeader
				}
			},
			widgets: {
				getWidgets: Views.getWidgets
			},
			user: {
				create: function (userData, callback) {
					console.log('Setting new user avatar for ' + userData.username);
					//var picture = pic;
					//userData['picture'] = picture;
					//userData['uploadedpicture'] = picture;
					callback(null, userData);
				},
				profileLinks: function (links, next) {
					links.push({
						id: 'minecraft',
						public: true,
						route: 'minecraft',
						icon: 'fa-cube',
						name: 'Minecraft Profile'
					});
					next(null, links);
				}
			}
		},
		action: {
			user: {
				loggedIn: function (uid) {
					console.log("User uid " + uid + " logged in, checking avatar...");
					//.setUserAvatar(uid);
				},
				set: function (data) {
					if (data.field === 'picture') {
						//.setUserAvatar(data.uid);
					}
				}
			}
		}
	};

function setUserAvatar(uid) {
	NodeBB.User.getUserFields(uid, ['uuid','username','picture'], function (err, fields) {
		if (err) {
			console.log("Tried to check the avatar of user uid " + uid + ", but got an error:", err);
		}else if (!fields.uuid) {
			console.log("User uid " + uid + " does not have a UUID assigned, adding to refresh queue.");
			// TODO: Add a refresh queue. :P
		}else{
			var picture = Config.settings.get('avatarCDN').replace('{username}', fields.username);
			if (picture !== fields.picture) {
				console.log("Changing avatar for user " + uid);
				NodeBB.User.setUserFields(uid, {picture: picture, uploadedpicture: picture}, function (err) {
					if (err) {
						console.log(err);
					}
				});
			}else{
				console.log("User uid " + uid + " has the correct avatar!");
			}
		}
	});
}

module.exports = Hooks;
