import async from 'async';
import { db, User } from '../nodebb';
import Backend from '../backend';
import Config from '../config';
import Updater from '../updater';
import Utils from '../utils';

export function resetPlayerKey (data, cb) {
  cb = cb || (() => {});

  if (!(data && data.uid)) return cb(new Error("Bad data sent to Backend.resetPlayerKey."));

  const uid = parseInt(data.uid, 10);

  // Reset all keys with uid.
  db.sortedSetsRemoveRangeByScore(['playerkey:uid'], uid, uid, () => {
    API.getPlayerKey(data, cb);
  });
};

// Gets and/or creates the player key.
export function getPlayerKey (data, cb) {
  cb = cb || (() => {});

  if (!(data && data.uid)) return cb(new Error("Bad data sent to API.getPlayerKey."));

  const uid = data.uid;

  db.getSortedSetRangeByScore('playerkey:uid', 0, 1, uid, uid, (err, key) => {
    if (err || !key || !key.length) {
      key = Utils.getKey();
      db.sortedSetAdd('playerkey:uid', uid, key);
    }else{
      key = key[0];
    }
    return cb(err, {key});
  });
};

export function getPlayerKeyUID (data, cb) {
  if (!(data && data.key)) return cb(new Error("Bad data sent to Backend.getPlayerKeyUID."));

  db.sortedSetScore('playerkey:uid', data.key, (err, uid) => {
    if (err || !uid) err = err || new Error("FAILKEY");

    return cb(err, uid);
  });
};

// Get all linked users.
export function getUsers (options, next) {
  const fields = ['uid', 'username', 'yuuid', 'picture'];

  if (options.fields && Array.isArray(options.fields)) {
    for (let i = 0; i < options.fields.length; i++) {
      if (typeof options.fields[i] === 'string') fields.push(options.fields[i]);
    }
  }

  Backend.getLinkedUids((err, uids) => {
    User.getUsersFields(uids, fields, (err, usersData) => {
      async.map(usersData, (userData, next) => {
        Backend.getUuidsFromUid(userData.uid, (err, uuids) => {
          if (err || !uuids) return next(null, userData) // TODO: Remove from sortedset if links are missing from db.
          Backend.getPlayersFromUuids(uuids, (err, players) => {
            userData.players = players
            next(null, userData)
          })
        })
      }, next)
    })
  })
}

// Get the primary linked user from uid, yuuid, or name.
export function getUser (options, next) {

  // Assert parameters
  if (!(typeof next === 'function' && options && (options.uid || options.id || options.name))) return next("Backend.getUser() Invalid params.");

  // Convert name to uuid if needed.
  if (options.id) {
    getUserFromUuid(options.id, options.extraFields, next);
  } else if (options.name) {
    Backend.getPlayerFromName(options.name, (err, profile) => {
      if (err || !profile) return next(err, profile);
      getUserFromUuid(profile.id, options.extraFields, next);
    });
  }
};

function getUserFromUuid(id, extraFields, next) {

  // Get primary user.
  db.getObjectField(`yuuid:${id}`, 'uid', (err, uid) => {
    if (err || !uid) return next(err);
    User.getUserData(uid, (err, userData) => {
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

export function deleteUser (data, next) {
  if (!data || !data.uid) return next(new Error("No uid"));

  const uid = parseInt(data.uid, 10);

  // Backend.sortedSetRemove()
  // Backend.getUuidsFromUid( uid, function (yuuids, next) {
    // async.each(yuuids, function (yuuid, next) {
      // Backend.getUidsFromUuid(yuuid, function (err, uids) {
        // Backend.getPrimaryUid(yuuid, function (err, primaryuid) {
          // if (!err && primaryuid && parseInt(primaryuid, 10) === uid) {
            // db.getSortedSetRange('yuuid:' + yuuid  + ':uids', 0, -1, function (err, uids) {
            // })
          // }
        // })
      // })
    // })
  // })

  // async.parallel([
    // Get all uuids, get primary uids, reset primary uid to something else if equal, remove from set.
    
    // // async.apply(db.deleteObjectField, 'yuuid:' + id,  'uid'),
    // async.apply(db.sortedSetRemove,   'yuuids:linked', id),
    // function (next) {
      // db.getSortedSetRange('yuuid:' + id  + ':uids', 0, -1, function (err, uids) {
        // async.each(uids, function (uid, next) {
          // async.parallel([
            // async.apply(db.sortedSetRemove, 'yuuid:' + id  + ':uids',   uid),
            // async.apply(db.sortedSetRemove, 'uid:'   + uid + ':yuuids', id)
          // ], next);
        // }, next);
      // })
    // }
  // ], next);
}

export function refreshUser (data, next) {
}

export function resetUsers (data, next) {
}

export function getUserPrefix (data, next) {
  if (!(data && data.uid)) return next(new Error('Invalid params sent to API.getUserPrefix'))
  Backend.getPrimaryUuid(data.uid, (err, uuid) => {
    if (err || !uuid) return next(err)
    Backend.getPlayerPrefix(uuid, next)
  })
}
