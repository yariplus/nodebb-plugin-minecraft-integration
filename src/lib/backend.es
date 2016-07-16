import { db } from './nodebb'
import Config from './config'
import Utils from './utils'
import async from 'async'
import request from 'request'
import winston from 'winston'

const Backend = module.exports = { }

// ///////////////////
// Player Objects  //
// yuuid:{uuid}    // Hash for player object.
// yuuid:sorted    // SortedSet value:yuuid score:lastpinged
// yuuid:playtime  // SortedSet value:yuuid score:playtime
// ///////////////////

// TODO: Need to remove console.log for winston.

// Get all stored player uuids.
Backend.getUuids = (options, next) => {
  options = options || {}

  const set = options.set || 'yuuid:playtime', min = options.min || 0, max = options.max || -1, profiles = []

  db.getSortedSetRevRange(set, min, max, next)
}

// Get the player hash of uuids.
Backend.getPlayersFromUuids = (yuuids, callback) => {
  const keys = yuuids.map(yuuid => `yuuid:${yuuid}`)

  db.getObjects(keys, (err, players) => {

    // Add the yuuid to the player object for display.
    for (const i in players) {
      players[i] = players[i] || {}
      players[i].id = yuuids[i]
    }

    callback(err, players)
  })
}
Backend.getPlayerFromUuid = (uuid, callback) => {
  Backend.getPlayersFromUuids([uuid], (err, players) => {
    if (err || !(players && players[0])) return callback(err)
    callback(null, players[0])
  })
}

Backend.getUuidFromName = (name, next) => {
  // Look in the cache first.
  db.get(`mi:name:${name}`, (err, uuid) => {

    // Return if db error.
    if (err) return next(err)

    // Return if found in cache.
    if (uuid) return next(null, uuid)

    // If not in cache, query Mojang.
    Utils.getUUID(name, (err, uuid) => {

      // Return if db error.
      if (err) return next(err)

      // Store results in the cache.
      db.set(`mi:name:${name}`, uuid)
      db.expire(`mi:name:${name}`, Config.getPlayerExpiry())

      // Return the UUID.
      return next(null, uuid)
    })
  })
}

// Get the primary player linked to a user.
Backend.getPrimaryUuid = (uid, next) => {
  db.getObjectField(`user:${uid}`, 'yuuid', next)
}

// Get the primary user linked to a player.
Backend.getPrimaryUid = (yuuid, next) => {
  db.getObjectField(`yuuid:${yuuid}`, 'uid', next)
}

// Get the all players linked to a user.
Backend.getUuidsFromUid = (uid, next) => {
  db.getSortedSetRevRange(`uid:${uid}:yuuids`, 0, -1, next)
}

// Get the all users linked to a player.
Backend.getUidsFromUuid = (yuuid, next) => {
  db.getSortedSetRevRange(`yuuid:${yuuid}:uids`, 0, -1, next)
}

// Remove primary user linked to a player.
Backend.removePrimaryUid = (yuuid, next) => {
  db.deleteObjectField(`yuuid:${yuuid}`, 'uid', next)
}

// Remove primary player linked to a user.
Backend.removePrimaryUuid = (uid, next) => {
  db.deleteObjectField(`user:${uid}`, 'yuuid', next)
}

// Add link to sortedsets and primaries.
Backend.linkUuidtoUid = (yuuid, uid, next) => {
  async.parallel([
    async.apply(db.sortedSetAdd, 'mi:uid:linked', Date.now(), uid),
    async.apply(db.sortedSetAdd, `yuuid:${yuuid}:uids`, Date.now(), uid),
    async.apply(db.sortedSetAdd, 'yuuid:linked', Date.now(), yuuid),
    async.apply(db.sortedSetAdd, `uid:${uid}:yuuids`, Date.now(), yuuid),
    async.apply(db.setObjectField, `yuuid:${yuuid}`, 'uid', uid),
    async.apply(db.setObjectField, `user:${uid}`, 'yuuid', yuuid)
  ], next)
}

Backend.resetPrimaryUid = (yuuid, next) => {
  Backend.removePrimaryUid(yuuid, () => {
    Backend.getUidsFromUuid(yuuid, (err, uids) => {
      if (!err && uids && uids[0]) {
        db.setObjectField(`yuuid:${id}`, 'uid', uids[0], next)
      } else {
        next()
      }
    })
  })
}

Backend.resetPrimaryUuid = (uid, next) => {
  Backend.removePrimaryUuid(uid, () => {
    Backend.getUuidsFromUid(uid, (err, uuids) => {
      if (!err && uuids && uids[0]) {
        db.setObjectField(`user:${id}`, 'uid', uids[0], next)
      } else {
        next()
      }
    })
  })
}

Backend.getLinkedUids = next => {
  db.getSortedSetRevRange('mi:uid:linked', 0, -1, next)
}
Backend.getLinkedUuids = next => {
  db.getSortedSetRevRange('yuuid:linked', 0, -1, next)
}

Backend.deletePlayer = (data, next) => {
  if (!(data && data.id)) return next(new Error('Bad data sent to Backend.deletePlayer()'))

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

Backend.deleteUser = (uid, next) => {
}

Backend.getPlayerPrefix = (uuid, next) => {
  db.getObjectField(`yuuid:${uuid}`, 'prefix', next)
}

// /////////////////////////////////
// Server Status                 //
// /////////////////////////////////
// mi:server:{sid}               // Object
// mi:server:{sid}:pings         // List of JSON strings
// mi:server:{sid}:players       // SortedSet of UUIDs by playtime.
// mi:server:{sid}:player:{uuid} // Object of player statistics.
// mi:server:{sid}:config        // Object of server configuration.
// /////////////////////////////////

Backend.getServer = Backend.getServerStatus = (sid, callback) => {
  db.getObject(`mi:server:${sid}`, callback)
}

function sort (a, b) {
  return a - b
}

// Exposed to admin api only.
Backend.getServerConfig = (data, next) => {
  if (!(data && data.sid)) return next(new Error('Backend.getServerConfig() No SID.', data))

  const sid = data.sid

  db.getObject(`mi:server:${sid}:config`, (err, config) => {
    if (err) return next(err)
    if (!config) return next(new Error(`Backend.getServerConfig() invalid SID: ${data.sid}`))

    config.sid = sid

    next(null, config)
  })
}

Backend.setServerConfig = (data, next) => {
  if (!(data && data.sid)) return next(new Error('Backend.setServerConfig() No SID.'))

  data.name = data.name || 'Unnamed Server'
  data.address = data.address || 'example.com'

  // Score is used for sorting.
  db.sortedSetAdd('mi:servers', Date.now(), data.sid)
  db.setObject(`mi:server:${data.sid}:config`, data.config, next)
}

Backend.getSidUsingAPIKey = (key, next) => {
  let payload = null

  Backend.getServersConfig({}, (err, configs) => {
    if (err) return next(err)

    configs.forEach(config => {
      if (config.APIKey === key) payload = config.sid
    })

    return next(payload ? null : new Error('Invalid API Key'), payload)
  })
}

Backend.getServerIcon = (data, next) => {

  if (!data || !data.sid) return next('Backend.getServerIcon() No SID.')

  const sid = data.sid

  db.getObjectField(`mi:server:${sid}`, 'icon', (err, icon) => {
    if (err || !icon) return next(err)

    const base = icon.replace('data:image/png;base64,', '')

    next(err, {
      base,
      modified: new Date().toUTCString()
    })
  })
}

Backend.getServerPlugins = (data, next) => {

  const sid = data.sid

  async.parallel({
    pluginList: async.apply(db.getObjectField, `mi:server:${sid}`, 'pluginList'),
    config: async.apply(Backend.getServerConfig, {sid})
  }, (err, results) => {

    if (err) return next(err)

    if (!results.pluginList || parseInt(results.config.hidePlugins, 10)) {
      next(null, [])
    }else {
      try {
        results.pluginList = JSON.parse(results.pluginList)
      } catch(err) {
        console.log(`JSON ERROR: ${err}`)
        return next(err, [])
      }

      next(null, results.pluginList)
    }
  })
}

// TODO: Make this retrieve a time range instead of a fixed amount.
Backend.getRecentPings = (data, next) => {

  const pings = []
  const sid = data.sid
  const amount = data.last || 30
  let stamps = []
  let now = Date.now()

  if (sid < 0) return next(new Error(`Invalid sid sent to getRecentPings: ${sid}`), pings)

  // Get stamps of the last 'amount' minutes.
  now = now - now % 60000

  db.getObject(`mi:server:${sid}:ping:${now}`, (err, ping) => {
    if (!ping) now -= 60000

    for (let i = 0; i < amount + 1; i++) stamps.push(now - i * 60000)

    stamps = stamps.reverse()

    // Read and parse the stored pings for each stamp.
    async.map(stamps, (stamp, next) => {

      db.getObject(`mi:server:${sid}:ping:${stamp}`, (err, ping) => {
        if (err) return next(err)

        if (!ping && stamps[stamps.length - 1] === stamp) stamp = {players: -1}

        // Make missing pings blank instead of erroring.
        ping = ping || defaultPing
        for (const p in defaultPing) ping[p] = ping[p] || defaultPing[p]

        // TODO: Read players as a separate hash.
        if (typeof ping.players === 'string') {
          try {
            ping.players = JSON.parse(ping.players)
          } catch(e) {
            ping.players = []
          }
        }

        // Remove invalid TPS values.
        if (parseInt(ping.tps, 10) > 100) ping.tps = '0'

        // Store stamp for charting, and human time for display.
        ping.timestamp = stamp
        ping.humanTime = Utils.getHumanTime(stamp)

        next(null, ping)
      })
    }, next)
  })
}

var defaultPing = {
  players: [],
  tps: 0
}

Backend.updateServerStatus = (status, next) => {

  if (typeof status.players !== 'string') status.players = JSON.stringify(status.players)

  if (status.pluginList && typeof status.pluginList !== 'string') status.pluginList = JSON.stringify(status.pluginList)
  if (status.modList && typeof status.modList !== 'string') status.modList = JSON.stringify(status.modList)

  async.waterfall([
    async.apply(db.delete, `mi:server:${status.sid}`),
    async.apply(db.setObject, `mi:server:${status.sid}`, status),
    async.apply(db.expire, `mi:server:${status.sid}`, Config.getPingExpiry()),
    async.apply(db.setObjectField, `mi:server:${status.sid}:ping:${status.updateTime}`, 'players', status.players),
    async.apply(db.setObjectField, `mi:server:${status.sid}:ping:${status.updateTime}`, 'tps', status.tps),
    async.apply(db.expire, `mi:server:${status.sid}:ping:${status.updateTime}`, Config.getPingExpiry()),
    async.apply(updatePingList, `mi:server:${status.sid}:pings`, status.updateTime)
  ], next)
}

function updatePingList (key, value, cb) {
  db.getListRange(key, 0, 0, (err, values) => {
    if (err) return cb(err)

    // Is the most recent ping stamp empty or outdated?
    if (!values || !values[0] || !values[0] === value) {
      db.listPrepend(key, value)
    }

    cb()
  })
}

Backend.deleteServer = (data, next) => {
  if (!data || !(parseInt(data.sid, 10) > -1)) return next(new Error('Invalid data sent to Backend.deleteServer()'))

  const sid = parseInt(data.sid, 10)

  winston.warn(`DELETING MINECRAFT SERVER SID:${sid}`)

  async.waterfall([
    async.apply(db.getListRange, `mi:server:${sid}:pings`, 0, -1),
    (stamps, next) => {
      async.each(stamps, (stamp, next) => {
        db.delete(`mi:server:${sid}:ping:${stamp}`, next)
      }, next)
    },
    async.apply(db.delete, `mi:server:${sid}:pings`),
    async.apply(db.delete, `mi:server:${sid}`),
    async.apply(db.delete, `mi:server:${sid}:config`),
    async.apply(db.sortedSetRemove, 'mi:servers', sid)
  // mi:server:{sid}:players       // SortedSet of UUIDs by playtime.
  // mi:server:{sid}:player:{uuid} // Object of player statistics.
  ], next)
}

// //////////////////////////////
// Servers                    //
// //////////////////////////////
// mi:servers                 //
// mi:servers:apikeys         //
// //////////////////////////////

Backend.getServers = Backend.getServersStatus = (data, next) => {
  Backend.getServersSids(data, (err, sids) => {
    async.map(sids, (sid, next) => {
      Backend.getServer({sid}, (err, server) => {
        if (err) winston.error(err)
        next(null, server)
      })
    }, (err, servers) => {
      next(null, servers.filter(server => server))
    })
  })
}

// Exposed to admin api only.
Backend.getServersConfig = (data, callback) => {
  const payload = []

  Backend.getServersSids(data, (err, sids) => {
    async.each(sids, (sid, next) => {
      Backend.getServerConfig({sid}, (err, config) => {
        if (err) return next()
        if (!config) return next()
        payload.push(config)
        next()
      })
    }, () => {
      callback(null, payload)
    })
  })
}

Backend.getServersSids = Backend.getServerSids = (data, next) => {
  if (!data || typeof data !== 'object') return next(new Error('No data sent to Backend.getServersSids()'))

  if (data.start) data.start = parseInt(data.start, 10)
  if (data.end) data.start = parseInt(data.end, 10)

  const start = data.start >= 0 ? data.start : 0
  const end = data.end >= -1 ? data.end : -1

  db.getSortedSetRange('mi:servers', 0, -1, (err, sids) => {

    if (err || !sids) return next(err, [])

    if (data.sort) {
      if (data.sort === 'sid') sids = sids.sort(sort)
    }else {
      sids = sids.sort(sort)
    }

    next(err, sids)
  })
}

// ///////////////////////////////////
// Avatars                         //
// ///////////////////////////////////
// mi:avatars                      // SortedSet, value: player name of stored avatar, score: last update time.
// mi:avatar:{playername}          // String, base64 encoded png.
// mi:avatar:{playername}:modified // String, ISO Date of last time the image was modified.
// ///////////////////////////////////

// ACP list
Backend.getAvatars = (data, next) => {
  Backend.getAvatarList({}, (err, avatarList) => {
    const avatars = []

    // TODO: This needs to be a multi-key operation.
    async.each(avatarList, (name, next) => {
      getAvatar(name, (err, base64) => {
        if (err || !base64) return next()

        Backend.getUuidFromName(name, (err, uuid) => {
          if (err || !uuid) return next()

          avatars.push({name, base64, id: uuid})
          next()
        })
      })
    }, err => {
      next(err, avatars)
    })
  })
}

// Get the avatar base64 from the database.
function getAvatar (name, callback) {

  // Database keys used.
  const keyBase = `mi:avatar:${name}`, keyModified = `mi:avatar:${name}:modified`, keySorted = 'mi:avatars'

  // Store a fetched avatar binary as base64 and update fetch time.
  function storeAvatar (avatar, next) {

    // Convert buffer to a base64.
    avatar = avatar.toString('base64')

    // Set base64.
    db.set(keyBase, avatar, err => {
      if (err) return next(err)

      return next(null, avatar)
    })

    // Update the avatar fetch time.
    db.sortedSetAdd(keySorted, Date.now(), name)
  }

  // Get fetch time.
  // If old or null, Fetch avatar and update fetch time.
  // If different, Set modified.
  async.parallel({
    fetchTime: async.apply(db.sortedSetScore, 'mi:avatars', name),
    base: async.apply(db.get, `mi:avatar:${name}`),
    modifiedTime: async.apply(db.get, `mi:avatar:${name}:modified`)
  }, (err, results) => {
    if (err) return callback(err)

    const fetchTime = results.fetchTime
    let base = results.base
    let modifiedTime = results.modifiedTime
    let buffer

    async.waterfall([
      next => {
        if (!fetchTime || !base || !modifiedTime || Date.now() - fetchTime > 1000 * 60 * 10) {
          fetchAvatar(name, next)
        }else {
          next(null, false)
        }
      },
      (_buffer, next) => {
        if (_buffer) {
          buffer = _buffer
          storeAvatar(buffer, next)
        }else {
          next(null, base)
        }
      },
      (_base, next) => {
        if (_base !== base || !modifiedTime) {
          modifiedTime = new Date().toUTCString()
          db.set(keyModified, modifiedTime, next)
          base = _base
        }else {
          next()
        }
      }
    ], err => {
      if (err) return callback(err)

      callback(err, {
        buffer,
        base,
        modified: modifiedTime
      })
    })
  })
}

Backend.getAvatar = (data, callback) => {

  // Asserts
  if (!(data && data.name && typeof data.name === 'string')) return callback(new Error(`Invalid Data passed to getAvatar: ${data}`))

  getAvatar(data.name, callback)
}

// Get list of avatar names in the database
Backend.getAvatarList = (data, callback) => {
  db.getSortedSetRange('mi:avatars', 0, -1, (err, list) => {
    callback(err, list ? list.sort() : [])
  })
}

Backend.clearOldAvatars = (options, next) => {
  db.sortedSetsRemoveRangeByScore(['mi:avatars'], 0, Date.now() - Config.getAvatarExpiry() * 1000, err => {
    if (err) console.log('Backend.clearOldAvatars error:', err)
    if (typeof next === 'function') next()
  })
}

Backend.refreshAvatar = (data, next) => {

  const name = data.name

  Backend.deleteAvatar(data, err => {
    getAvatar(name, (err, data) => {
      next(err, {base64: data.base})
    })
  })
}

Backend.deleteAvatar = (data, next) => {
  if (!data || !data.name) return next(new Error('Backend.deleteAvatar() no name passed.'))

  const name = data.name

  db.sortedSetRemove('mi:avatars', name)

  next()
}

Backend.resetAvatars = (data, callback) => {
  Backend.getAvatarList({}, (err, avatarList) => {
    async.each(avatarList, (player, next) => {
      const key = `mi:avatar:${player}`

      db.delete(key)
      db.sortedSetRemove('mi:avatars', player)

      next()
    }, err => {
      callback(err)
    })
  })
}

Backend.setAvatar = data => {
}

// Gets the avatar from the configured cdn.
function fetchAvatar (name, next) {
  async.parallel({
    url: async.apply(Config.getAvatarUrl, {name, size: 64}), // The full url for the avatar.
    id: async.apply(Backend.getUuidFromName, name) // We need this for cdns that use uuids.
  }, (err, payload) => {

    if (err) return next(err)

    const url = payload.url.replace('{uuid}', payload.id)

    console.log(`Fetching avatar from CDN: ${url}`)

    async.waterfall([
      async.apply(request, {url, encoding: null}),
      async.apply(transform)
    ], (err, avatar) => {
      if (err) {
        console.log(`Could not retrieve skin using the cdn: ${Config.settings.get('avatarCDN')}`)
        if (Config.settings.get('avatarCDN') === 'mojang') return next(null, Config.steveBuffer)

        // Try Mojang
        async.waterfall([
          async.apply(request, {url: `http://skins.minecraft.net/MinecraftSkins/${name}.png`, encoding: null}),
          (response, body, next) => {
            console.log('Defaulting to Mojang skin.')
            Config.cdns['mojang'].styles.flat.transform(body, next)
          }
        ], (err, avatar) => {
          if (err) {
            console.log("Couldn't connect to Mojang skin server.")

            return next(null, Config.steveBuffer)
          }else {
            next(null, new Buffer(avatar))
          }
        })
      }else {
        next(null, new Buffer(avatar))
      }
    })
  })
}

function transform (response, body, next) {
  const cdn = Config.settings.get('avatarCDN')
  if (Config.cdns[cdn].styles && Config.cdns[cdn].styles.flat && Config.cdns[cdn].styles.flat.transform) {
    Config.cdns[cdn].styles.flat.transform(body, next)
  }else {
    next(null, body)
  }
}

// /////////////////////
// Global Stats      //
// /////////////////////

Backend.getPlaytimes = (options, next) => {
  db.getSortedSetRangeWithScores('yuuid:playtime', 0, -1, (err, data) => {
    next(err, data)
  })
}

Backend.getTopPlayersByPlaytimes = (data, callback) => {
  data.show = data.show || 5

  db.getSortedSetRevRangeByScoreWithScores('yuuid:playtime', 0, data.show, '+inf', 0, (err, data) => {
    async.map(data, (value, next) => {
      Backend.getPlayerFromUuid(value.value, (err, profile) => {
        if (err) return next(err)
        next(null, {id: value.value, name: profile.name, playtime: value.score, playtimeHuman: Utils.parseMinutesDuration(value.score)})
      })
    }, callback)
  })
}
