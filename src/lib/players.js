import { async, db } from './nodebb'
import { getUUID, getProfile } from './utils'

import * as Config from './config'

export function getPlayersByUuids (uuids, next) {
  let keys = uuids.map(id => `mi:profile:${id}`)

  // TODO
  function addFormattedPrefix (players, next) {
    players.map(player => {
      player.prefix = parseFormatCodes(player.prefix)
      return player
    })

    next(null, players)
  }

  async.waterfall([
    async.apply(db.getObjects, keys),
    (profiles, next) => {
      async.eachOf(profiles, (profile, i, next) => {
        if (profile) return next(null, profile)

        let id = uuids[i]

        getProfile(id, (err, profile) => {
          if (err) return next(err)

          db.setObject(keys[i], profile, () => {
            db.expire(keys[i], 60 * 10, () => { // Ten minutes.
              profiles[i] = profile
              next()
            })
          })
        })
      }, err => {
        next(err, profiles)
      })
    }
  ], next)
}

export const getPlayerByUuid = (uuid, next) => getPlayersByUuids([uuid], (err, players) => next(err, players && players[0] ? players[0] : null))

function getPlayersByUid (uid, next) {
  async.waterfall([
    async.apply(getUserUuids, uid),
    async.apply(getPlayersByUuids),
    (players, next) => {
      getUserUuid(uid, (err, uuid) => {
        for (const i in players) {
          if (players[i].id === uuid) players[i].isPrimary = true
        }
        next(null, players)
      })
    }
  ], next)
}

function getPlayerByName (name, callback) {
  async.waterfall([
    async.apply(getUuidFromName, name),
    async.apply(getPlayerFromUuid)
  ], callback)
}

function getPlayerFromUid (name, callback) {
  async.waterfall([
    async.apply(getUuidFromUid, name),
    async.apply(getPlayerFromUuid)
  ], callback)
}

export function getPlayer (data, callback) {
  if (!data || !(data.id || data.name || data.uid)) return callback(new Error('No data for player lookup.'))
  if (data.id) return getPlayerFromUuid(data.id, callback)
  if (data.name) return getPlayerFromName(data.name, callback)
  if (data.uid) return getPlayerFromUid(data.uid, callback)
}

export function writeOfflinePlayers (players, callback) {
  for (let id in players) {
    console.log(id + ' ' + players[id].name)
  }
  callback()
}

function renderPlayers (req, res) {
  res.render('minecraft-integration/players', {})
}

// TODO
// Get all stored player uuids.
export function getUuids (options, next) {
  const { set, min, max } = options

  db.getSortedSetRevRange(set || 'yuuid:playtime', min || 0, max || -1, next)
}

export function getUuidFromName (name, next) {
  let key = `mi:name:${name}`

  // Look in the cache first.
  db.getObjectField(key, 'uuid', (err, uuid) => {
    // Return if db error or found in cache.
    if (err || uuid) return next(err, uuid)

    // If not in cache, query Mojang.
    getUUID(name, (err, uuid) => {
      // Return if db error.
      if (err) return next(err)

      // Store results in the cache.
      db.setObjectField(key, 'uuid', uuid)
      db.expire(key, Config.getPlayerExpiry())

      // Return the UUID.
      return next(null, uuid)
    })
  })
}

export function getUuidsFromUid (uid, next) { db.getSortedSetRevRange(`uid:${uid}:yuuids`, 0, -1, next) }

const getPlayerUids = (yuuid, next) => db.getSortedSetRevRange(`yuuid:${yuuid}:uids`, 0, -1, next)
const remPlayerUids = (yuuid, uid, next) => db.sortedSetRemove(`yuuid:${yuuid}:uids`, uid, next)
const addPlayerUids = (yuuid, uid, next) => db.sortedSetAdd(`yuuid:${yuuid}:uids`, uid, next)
const getPlayerUid = (yuuid, next) => db.getObjectField(`yuuid:${yuuid}`, 'uid', next)
const setPlayerUid = (yuuid, uid, next) => db.setObjectField(`yuuid:${yuuid}`, 'yuuid', yuuid, next)
const remPlayerUid = (yuuid, uid, next) => db.deleteObjectField(`yuuid:${yuuid}`, 'uid', next)

const getUserUuids = (uid, next) => db.getSortedSetRevRange(`uid:${uid}:yuuids`, 0, -1, next)
const remUserUuids = (uid, yuuid, next) => db.sortedSetRemove(`uid:${uid}:yuuids`, yuuid, next)
const addUserUuids = (uid, yuuid, next) => db.sortedSetAdd(`uid:${uid}:yuuids`, yuuid, next)
const getUserUuid = (uid, next) => db.getObjectField(`user:${uid}`, 'yuuid', next)
const setUserUuid = (uid, yuuid, next) => db.setObjectField(`user:${uid}`, 'yuuid', yuuid, next)
const remUserUuid = (uid, next) => db.deleteObjectField(`user:${uid}`, 'yuuid', next)

export const getLinkedUids = (next) => db.getSortedSetRevRange('mi:uid:linked', 0, -1, next)
export const getLinkedUuids = (next) => db.getSortedSetRevRange('yuuid:linked', 0, -1, next)

// Add link to sortedsets and set primary.
export function link (yuuid, uid, next) {
  async.parallel([
    async.apply(db.sortedSetAdd, 'mi:uid:linked', Date.now(), uid),
    async.apply(db.sortedSetAdd, `yuuid:${yuuid}:uids`, Date.now(), uid),
    async.apply(db.sortedSetAdd, 'yuuid:linked', Date.now(), yuuid),
    async.apply(db.sortedSetAdd, `uid:${uid}:yuuids`, Date.now(), yuuid),
    async.apply(db.setObjectField, `yuuid:${yuuid}`, 'uid', uid),
    async.apply(db.setObjectField, `user:${uid}`, 'yuuid', yuuid),
  ], next)
}

export function unlink (yuuid, uid, next) {
  console.log(`unlinking ${yuuid} with ${uid}`)

  // TODO: Reset primaries when unlinking.
  async.parallel([
    async.apply(db.sortedSetRemove, 'mi:uid:linked', uid),
    async.apply(db.sortedSetRemove, `yuuid:${yuuid}:uids`, uid),
    async.apply(db.sortedSetRemove, 'yuuid:linked', yuuid),
    async.apply(db.sortedSetRemove, `uid:${uid}:yuuids`, yuuid),
    async.apply(db.deleteObjectField, `yuuid:${yuuid}`, 'uid'),
    async.apply(db.deleteObjectField, `user:${uid}`, 'yuuid'),
  ], next)
}

// The primary User of a UUID was deleted/banned/etc.
function resetPlayerPrimaryUid (yuuid, next) {
  removePrimaryUid(yuuid, () => {
    getUidsFromUuid(yuuid, (err, uids) => {
      if (!err && uids && uids[0]) {
        db.setObjectField(`yuuid:${yuuid}`, 'uid', uids[0], next)
      } else {
        next()
      }
    })
  })
}

const resetUserPrimaryUuid = (uid, next) => async.waterfall([
  async.apply(removeUserPrimaryUuid, uid),
  async.apply(getUuidsFromUid, uid, (err, uuids) => {
    if (!err && uuids && uids[0]) {
      db.setObjectField(`user:${id}`, 'uid', uids[0], next)
    } else {
      next()
    }
  })
])

export function deletePlayer (data, next) {
  if (!(data && data.id)) return next(new Error('Bad data sent to deletePlayer()'))

  const id = data.id

  async.parallel([
    async.apply(db.delete, `yuuid:${id}`),
    // async.apply(db.deleteObjectField, 'yuuid:' + id,  'uid'),
    async.apply(db.sortedSetRemove, 'yuuids:linked', id),
    next => {
      db.getSortedSetRange(`yuuid:${id}:uids`, 0, -1, (err, uids) => {
        async.each(uids, (uid, next) => {
          async.parallel([
            async.apply(db.sortedSetRemove, `yuuid:${id}:uids`, uid),
            async.apply(db.sortedSetRemove, `uid:${uid}:yuuids`, id)
          ], next)
        }, next)
      })
    }
  ], next)
}

const getPlayerPrefix = (uuid, next) => db.getObjectField(`yuuid:${uuid}`, 'prefix', next)
const getPrefixByUid = (uid, next) => {
  // TODO
  next(null, '')
}

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

export {
  getPlayerByName,
  getPlayersByUid,
  getPrefixByUid
}
