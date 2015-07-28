"use strict";

var TopList = { },

	NodeBB  = require('../nodebb'),
	Backend = require('../backend'),
	Utils   = require('../utils'),

	async = require('async');

TopList.render = function (data, callback) {
	data.show = parseInt(data.show);
	data.show = isNaN(data.show) ? 5 : data.show;
	data.show = data.show > 20 ? 20 : data.show;
	data.show = data.show < 3 ? 3 : data.show;

	data.statname = "Minutes";

	async.waterfall([
		async.apply(Backend.getTopPlayersByPlaytimes, {show: data.show}),
		function (players, next) {
			async.map(players, function (player, next) {
				Backend.getAvatar({base64: true, name: player.name}, function (err, avatar) {
					player.avatar = avatar;
					player.playtime = parseInt(player.playtime, 10);
					if (player.playtime > 60) {
						player.playtime = Math.floor(player.playtime / 60).toString() + " Hours, " + (player.playtime % 60).toString();
					}
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
