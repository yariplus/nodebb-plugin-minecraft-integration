import async from 'async'
import Config from '../config'
import Backend from '../backend'
import { sendStatusToUsers, sendPlayerJoinToUsers, sendPlayerQuitToUsers } from '../sockets'
import { trimUUID, parseVersion, getName } from '../utils'

// TODO
import { db } from '../nodebb'

// TEMP
import { getUser } from './users'

export function updateServerStatus (status, next) {
  const updateTime = Math.round(Date.now() / 60000) * 60000, sid = status.sid, tps = status.tps

  status.isServerOnline = '1'
  status.players = status.players || []
  status.pluginList = status.pluginList || []
  status.hasPlugins = status.pluginList.length
  status.modList = status.modList || []
  status.hasMods = status.modList.length
  status.updateTime = updateTime

  // Sort Plugins
  status.pluginList = status.pluginList.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)

  // Trim UUIDs to Mojang format.
  status.players.forEach(player => {
    if (!player.id) return
    player.id = trimUUID(player.id)
  })

  // Store the player statistics in the database.
  async.each(status.players, (player, next) => {
    // Skip if no uuid.
    if (!player.id) next()

    // TODO: BungeeCord Support
    // BungeeCord proxies will need their player UUIDs verified, since they run in offline mode.
    // A proper proxy would be running a Spigot derivative with BungeeCord pass-through set, but
    // we can't count on that.

    // Skip if invalid uuid.
    // function verifyUUID(id, next) {
    // getName(id, function (err, name) {
    // if (err) return next(err)
    // })
    // }

    // getName(player.id, function (err, valid) {
    // if (err)
    // })

    // DEPRECIATED: Future versions will track playtime using the Minecraft Plugin or OnTime.
    async.parallel({
      playtime (next) {
        db.getObjectField(`yuuid:${player.id}`, 'lastonline', (err, data) => {
          if (parseInt(data) !== updateTime) {
            db.setObjectField(`yuuid:${player.id}`, 'lastonline', updateTime)
            db.incrObjectField(`yuuid:${player.id}`, 'playtime', next)
          } else {
            db.getObjectField(`yuuid:${player.id}`, 'playtime', next)
          }
        })
      },
      name: async.apply(db.setObjectField, `yuuid:${player.id}`, 'name', player.name)
    }, (err, results) => {
      if (err) {
        console.log(`[Minecraft Integration] Error setting player object ${player.id}: ${err}`)
      } else {
        db.sortedSetAdd('yuuid:playtime', results.playtime || '0', player.id, err => {
        })
      }
    })
  })

  // wth is this?
  async.waterfall([
    async.apply(Backend.updateServerStatus, status),
    next => {
      getServerStatus({sid: status.sid}, (err, status) => {
        sendStatusToUsers(status)
      })
      next()
    }
  ], next)
}

export function getServerStatus (data, callback) {
  if (!(data && typeof data.sid !== 'undefined')) return callback(new Error('Invalid data.'))

  const sid = data.sid

  async.parallel({
    status: async.apply(Backend.getServerStatus, sid),
    config: async.apply(Backend.getServerConfig, {sid})
  }, (err, results) => {
    if (err) return callback(err)

    const status = results.status
    const config = results.config

    if (!config) return callback(new Error(`getServerStatus() No config exists for SID ${sid}`))
    if (!status) return callback(new Error(`getServerStatus() No status exists for SID ${sid} named ${config.name}`))

    // Parsed as arrays.
    try {
      if (status.players && typeof status.players === 'string' && status.players !== 'undefined') status.players = JSON.parse(status.players)
      if (status.modList && typeof status.modList === 'string' && status.modList !== 'undefined') status.modList = JSON.parse(status.modList)
      if (status.pluginList && typeof status.pluginList === 'string' && status.pluginList !== 'undefined') status.pluginList = JSON.parse(status.pluginList)
    } catch (e) {
      console.log('Bad Status', status)
      return callback(e)
    }

    // Parsed as integers.
    status.maxPlayers = parseInt(status.maxPlayers, 10)
    status.onlinePlayers = parseInt(status.onlinePlayers, 10)

    // Parsed as booleans.
    status.isServerOnline = !!parseInt(status.isServerOnline, 10)
    status.hasMods = !!parseInt(status.hasMods, 10)
    status.hasPlugins = !!parseInt(status.hasPlugins, 10)

    // Strings
    status.sid = sid
    status.address = config.address
    status.version = parseVersion(status.version || 'unknown')

    // Hide plugins.
    if (parseInt(config.hidePlugins, 10)) status.pluginList = []

    callback(null, status)
  })
}

export function eventPlayerJoin (data, callback) {
  // Assert parameters.
  if (!(data && data.id && data.name)) return callback()

  const name = data.name
  const nick = data.nick
  const id = data.id
  const prefix = data.prefix
  const suffix = data.suffix
  const groups = data.groups
  const playtime = data.playtime
console.dir(data);
  const usePrimaryPrefixOnly = Config.settings.get('usePrimaryPrefixOnly')
  let newPrefix = ''
  let primaryPrefix = ''

  // Store raw prefix data.
  // TODO: Configure spacing.
  if (prefix) {
    newPrefix = prefix
    primaryPrefix = newPrefix
  }
  if (Array.isArray(groups)) {
    for (const group of groups) {
      // TODO: Get prefix from group hash.
    }
  }

  db.setObjectField(`yuuid:${id}`, 'prefix', usePrimaryPrefixOnly ? primaryPrefix : newPrefix)

  async.parallel({
    player (next) {
      // TODO:
      // I can get rid off all this nonsense by storing players in a set 'mi:server:sid:players'
      // Could use a sortedSet with lexicon stored names, or just a plain set with uuids.
      db.getObjectField(`mi:server:${data.sid}`, 'players', (err, players) => {
        if (err) return console.log(err)

        let found = false

        try {
          players = JSON.parse(players)
        } catch (e) {
          return console.log('Bad Players Object', e)
        }

        for (const i in players) {
          if (players[i] === null) continue
          if (players[i].id === id) found = true
        }
        if (!found) {
          players.push({id, name})

          try {
            players = JSON.stringify(players)
          } catch (e) {
            return console.log(e)
          }

          // Updates widgets with new player.
          sendPlayerJoinToUsers({sid: data.sid, player: {id, name}})

          db.setObjectField(`mi:server:${data.sid}`, 'players', players, err => {
            if (err) console.log(err)
            next()
          })
        } else {
          next()
        }
      })
    },
    user (next) {
      // TEMP
      getUser({id}, (err, user) => {
        next(null, user || null)
      })
    }
  }, callback)
}

export function eventPlayerQuit (data, next) {
  // Assert parameters.
  if (!(data && data.id && data.name)) return next()

  const name = data.name, id = data.id

  db.getObjectField(`mi:server:${data.sid}`, 'players', (err, players) => {
    if (err) {
      console.log(err)
      return next()
    }

    try {
      players = JSON.parse(players)
    } catch (e) {
      console.log(e)
      return next()
    }

    // TODO: Make this part not suck.
    for (const i in players) {
      if (players[i].id === id) {
        players.splice(i, 1)
      }
    }
    try {
      players = JSON.stringify(players)
      db.setObjectField(`mi:server:${data.sid}`, 'players', players, err => {
        if (err) return console.log(err)
      })
      sendPlayerQuitToUsers({sid: data.sid, player: {id, name}})
    } catch (e) {
      console.log(e)
    }

    return next()
  })
}
