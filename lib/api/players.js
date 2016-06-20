'use strict';

var async = require('async')

var NodeBB = require('../nodebb')
var Backend = require('../backend')
var Config = require('../config')
var Updater = require('../updater')
var Utils = require('../utils')

function updateUuids(players, callback) {
	var uuids = []

	for (var i in players) {
		var player = players[i];

		if (!player.lastupdate || (Date.now() - parseInt(player.lastupdate, 10) > Config.getPlayerExpiry())) {
			uuids.push(player.id)
		}
	}

	Updater.updateUuids(uuids);
	callback(null, players);
}

function addUserData(players, callback) {
	async.each(players, function (player, next) {
		NodeBB.User.getUserData(player.uid, function (err, user) {
			if (user) player.user = user
			next()
		})
	}, function () {
		callback(null, players)
	})
}

module.exports = function (API) {
	API.getPlayers = function (data, callback) {
		async.waterfall([
			async.apply(Backend.getUuids, data),
			async.apply(Backend.getPlayersFromUuids),
			async.apply(updateUuids),
			async.apply(addUserData)
		], callback)
	}
}
