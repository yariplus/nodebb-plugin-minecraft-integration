'use strict';

var async = require('async')

var NodeBB = require('../nodebb')
var Backend = require('../backend')
var Config = require('../config')
var Updater = require('../updater')
var Utils = require('../utils')

module.exports = function (API) {

  API.resetPlayerKey = function (data, cb) {
    cb = cb || function(){};

    if (!(data && data.uid)) return cb(new Error("Bad data sent to Backend.resetPlayerKey."));

    var uid = parseInt(data.uid, 10);

    // Reset all keys with uid.
    NodeBB.db.sortedSetsRemoveRangeByScore(['playerkey:uid'], uid, uid, function () {
      API.getPlayerKey(data, cb);
    });
  };

  // Gets and/or creates the player key.
  API.getPlayerKey = function (data, cb) {
    cb = cb || function(){};

    if (!(data && data.uid)) return cb(new Error("Bad data sent to API.getPlayerKey."));

    var uid = data.uid;

    NodeBB.db.getSortedSetRangeByScore('playerkey:uid', 0, 1, uid, uid, function (err, key) {
      if (err || !key || !key.length) {
        key = Utils.getKey();
        NodeBB.db.sortedSetAdd('playerkey:uid', uid, key);
      }else{
        key = key[0];
      }
      return cb(err, {key: key});
    });
  };

  API.getPlayerKeyUID = function (data, cb) {
    if (!(data && data.key)) return cb(new Error("Bad data sent to Backend.getPlayerKeyUID."));

    NodeBB.db.sortedSetScore('playerkey:uid', data.key, function (err, uid) {
      if (err || !uid) err = err || new Error("FAILKEY");

      return cb(err, uid);
    });
  };

  // Get all linked users.
  API.getUsers = function (options, next) {
    var fields = ['uid', 'username', 'yuuid', 'picture']

    if (options.fields && Array.isArray(options.fields)) {
      for (var i = 0; i < options.fields.length; i++) {
        if (typeof options.fields[i] === 'string') fields.push(options.fields[i]);
      }
    }

    Backend.getLinkedUids(function (err, uids) {
      NodeBB.User.getUsersFields(uids, fields, function (err, usersData) {
        async.map(usersData, function (userData, next) {
          Backend.getUuidsFromUid(userData.uid, function (err, uuids) {
            if (err || !uuids) return next(null, userData) // TODO: Remove from sortedset if links are missing from db.
            Backend.getPlayersFromUuids(uuids, function (err, players) {
              userData.players = players
              next(null, userData)
            })
          })
        }, next)
      })
    })
  }

  // Get the primary linked user from uid, yuuid, or name.
  API.getUser = function (options, next) {

    // Assert parameters
    if (!(typeof next === 'function' && options && (options.uid || options.id || options.name))) return next("Backend.getUser() Invalid params.");

    // Convert name to uuid if needed.
    if (options.id) {
      getUserFromUuid(options.id, options.extraFields, next);
    } else if (options.name) {
      Backend.getPlayerFromName(options.name, function (err, profile) {
        if (err || !profile) return next(err, profile);
        getUserFromUuid(profile.id, options.extraFields, next);
      });
    }
  };

  function getUserFromUuid(id, extraFields, next) {

    // Get primary user.
    NodeBB.db.getObjectField('yuuid:' + id, 'uid', function (err, uid) {
      if (err || !uid) return next(err);
      NodeBB.User.getUserData(uid, function (err, userData) {
        if (err || !userData) return next(err);
        // Backend.getPlayerFromUuid(id, function (err, player) {
          // if (err || !player) return next(err);

          // TEMP
          // player.user = undefined;
          // userData.player = player;
          // next(null, userData);
        // });
        next(null, userData);
      });
    });
  }

  API.deleteUser = function (data, next) {
    if (!data || !data.uid) return next(new Error("No uid"));

    var uid = parseInt(data.uid, 10);

    // Backend.sortedSetRemove()
    // Backend.getUuidsFromUid( uid, function (yuuids, next) {
      // async.each(yuuids, function (yuuid, next) {
        // Backend.getUidsFromUuid(yuuid, function (err, uids) {
          // Backend.getPrimaryUid(yuuid, function (err, primaryuid) {
            // if (!err && primaryuid && parseInt(primaryuid, 10) === uid) {
              // NodeBB.db.getSortedSetRange('yuuid:' + yuuid  + ':uids', 0, -1, function (err, uids) {
              // })
            // }
          // })
        // })
      // })
    // })

    // async.parallel([
      // Get all uuids, get primary uids, reset primary uid to something else if equal, remove from set.
      
      // // async.apply(NodeBB.db.deleteObjectField, 'yuuid:' + id,  'uid'),
      // async.apply(NodeBB.db.sortedSetRemove,   'yuuids:linked', id),
      // function (next) {
        // NodeBB.db.getSortedSetRange('yuuid:' + id  + ':uids', 0, -1, function (err, uids) {
          // async.each(uids, function (uid, next) {
            // async.parallel([
              // async.apply(NodeBB.db.sortedSetRemove, 'yuuid:' + id  + ':uids',   uid),
              // async.apply(NodeBB.db.sortedSetRemove, 'uid:'   + uid + ':yuuids', id)
            // ], next);
          // }, next);
        // })
      // }
    // ], next);
  }

  API.refreshUser = function (data, next) {
  };

  API.resetUsers = function (data, next) {
  };

  API.getUserPrefix = function (data, next) {
    if (!(data && data.uid)) return next(new Error('Invalid params sent to API.getUserPrefix'))
    Backend.getPrimaryUuid(data.uid, function (err, uuid) {
      if (err || !uuid) return next(err)
      Backend.getPlayerPrefix(uuid, next)
    })
  }
}
