import async from 'async'
import { db, User } from '../nodebb'
import Backend from '../backend'
import Config from '../config'
import Updater from '../updater'
import Utils from '../utils'

function updateUuids (players, callback) {
  const uuids = []

  for (const i in players) {
    const player = players[i]

    if (!player.lastupdate || (Date.now() - parseInt(player.lastupdate, 10) > Config.getPlayerExpiry())) {
      uuids.push(player.id)
    }
  }

  Updater.updateUuids(uuids)
  callback(null, players)
}

function addUserData (players, callback) {
  async.each(players, (player, next) => {
    // TODO: getMultipleUsersData?
    User.getUserData(player.uid, (err, user) => {
      if (user) player.user = user
      next()
    })
  }, () => {
    callback(null, players)
  })
}

export function getPlayers (data, callback) {
  async.waterfall([
    async.apply(Backend.getUuids, data),
    async.apply(Backend.getPlayersFromUuids),
    async.apply(updateUuids),
    async.apply(addUserData)
  ], callback)
}

export function getUserLinkedPlayers (uid, callback) {
  async.waterfall([
    async.apply(Backend.getUuidsFromUid, uid),
    async.apply(Backend.getPlayersFromUuids),
    (players, next) => {
      Backend.getPrimaryUuid(uid, (err, uuid) => {
        for (const i in players) {
          if (players[i].id === uuid) players[i].isPrimary = true
        }
        next(null, players)
      })
    }
  ], callback)
}

function getPlayerFromUuid (uuid, callback) {
  Backend.getPlayersFromUuids([uuid], (err, players) => {
    callback(err, players && players[0] ? players[0] : null)
  })
}

function getPlayerFromName (name, callback) {
  async.waterfall([
    async.apply(Backend.getUuidFromName, name),
    async.apply(getPlayerFromUuid)
  ], callback)
}

function getPlayerFromUid (name, callback) {
  async.waterfall([
    async.apply(Backend.getUuidFromUid, name),
    async.apply(getPlayerFromUuid)
  ], callback)
}

export function getPlayer (data, callback) {
  if (!data || !(data.id || data.name || data.uid)) return next(new Error('No data for player lookup.'))
  if (data.id) return getPlayerFromUuid(data.id, next)
  if (data.name) return getPlayerFromName(data.name, next)
  if (data.uid) return getPlayerFromUid(data.uid, next)
}

// API.resetPrimaryUid = function (yuuid, next) {
// Backend.removePrimaryUid(yuuid, function () {
// Backend.getUidsFromUuid(yuuid, function (err, uids) {
// if (!err && uids && uids[0]) {
// db.setObjectField('yuuid:' + id, 'uid', uids[0], next)
// } else {
// next()
// }
// })
// })
// }

export function getPlayerPrefix (data, callback) {
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
