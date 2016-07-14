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
		// TODO: getMultipleUsersData?
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

  API.getUserLinkedPlayers = function (uid, callback) {
    async.waterfall([
      async.apply(Backend.getUuidsFromUid, uid),
      async.apply(Backend.getPlayersFromUuids)
    ], callback)
  }

	function getPlayerFromUuid(uuid, callback) {
		Backend.getPlayersFromUuids([uuid], function (err, players) {
			callback(err, players && players[0] ? players[0] : null)
		})
	}

	function getPlayerFromName(name, callback) {
		async.waterfall([
			async.apply(Backend.getUuidFromName, name),
			async.apply(getPlayerFromUuid)
		], callback)
	}

	function getPlayerFromUid(name, callback) {
		async.waterfall([
			async.apply(Backend.getUuidFromUid, name),
			async.apply(getPlayerFromUuid)
		], callback)
	}

	API.getPlayer = function (data, callback) {
		if (!data || !(data.id || data.name || data.uid)) return next(new Error("No data for player lookup."));
		if (data.id) return getPlayerFromUuid(data.id, next);
		if (data.name) return getPlayerFromName(data.name, next);
		if (data.uid) return getPlayerFromUid(data.uid, next);
	}

  // API.resetPrimaryUid = function (yuuid, next) {
    // Backend.removePrimaryUid(yuuid, function () {
      // Backend.getUidsFromUuid(yuuid, function (err, uids) {
        // if (!err && uids && uids[0]) {
          // NodeBB.db.setObjectField('yuuid:' + id, 'uid', uids[0], next)
        // } else {
          // next()
        // }
      // })
    // })
  // }

  API.getPlayerPrefix = function (data, callback) {
    if (!(data && (data.uuid || data.name))) return callback(new Error('Invalid params sent to API.getPlayerPrefix'))
    
    if (data.name) {
      async.waterfall([
        async.apply(Backend.getUuidFromName, name),
        async.apply(Backend.getPlayerPrefix)
      ], callback)
    } else {
      Backend.getPlayerPrefix(uuid, callback)
    }
  }
}
