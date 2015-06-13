"use strict";

var TopList = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils'),

	async = require('async');

TopList.render = function (data, callback) {
	data.show = parseInt(data.show);
	data.show = isNaN(data.show) ? 5 : data.show;
	data.show = data.show > 20 ? 20 : data.show;
	data.show = data.show < 3 ? 3 : data.show;

	data.statname = "Minutes";

	async.waterfall([
		async.apply(Config.getTopPlayersByPlaytimes, data.show),
		function (players, next) {
			async.map(players, function (player, next) {
				Config.getAvatar({base64: true, player: player.playername}, function (err, avatar) {
					player.avatar = avatar;
					player.score = player.playtime;
					next(null, player);
				});
			}, next);
		}
	], function (err, players) {
		data.players = players;
		callback(null, data);
	});
};

module.exports = TopList;
