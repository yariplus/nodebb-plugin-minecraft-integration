"use strict";

var NodeBB = require('./nodebb'),
  API = require('./api'),
	Backend = require('./backend'),
	Config = require('./config'),
	Views = require('./views'),
	async = require('async'),
	Hooks = {
		filter: {
			scripts: {
				get: function (data, next) {
					next(null, data);
				}
			},
			admin: {
				header: {
					build: Views.buildAdminHeader
				}
			},
			config: {
				get: function (config, next) {
					config.MinecraftIntegration = Config.settings.get();
					next(null, config);
				}
			},
			widgets: {
				getWidgets: Views.getWidgets
			},
			post: {
				get: function (data, next) {
					//console.log("Post Data");
					//console.dir(data);
					next(null, data);
				},
				getPosts: function (data, next) {
					//{posts: posts, uid: uid}
					//console.log("Post Data");
					//console.dir(data);
					next(null, data);
				}
			},
			topic: {
				build: function (data, next) {
					if (!Config.settings.get('showPrefixes')) return next(null, data);

					//{req: req, res: res, templateData: data}
					if (!(data && data.templateData && data.templateData.posts && data.templateData.posts[0])) return next(null, data);

					data.templateData.prefixes = {};

					async.each(data.templateData.posts, function (post, next) {

						if (!(post && post.user && post.user.uid && data.templateData.prefixes[post.user.uid] === void 0)) return next();

            API.getUserPrefix(post.user.uid, function (err, prefix) {
              data.templateData.prefixes[post.user.uid] = prefix
							next()
						})
					}, function (err) {
						next(null, data);
					});
				}
			},
			user: {
				account: function (data, callback) {
					if (!Config.settings.get('showPrefixes')) return callback(null, data);
					API.getUserPrefix(data.userData.uid, function (err, prefix) {
						data.userData.prefix = prefix;
						callback(null, data);
					});
				},
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
						name: 'Minecraft'
					});
					next(null, links);
				}
			},
			users: {
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
