import async from 'async'

import Config from '../config'
import Backend from '../backend'
import { sendStatusToUsers, sendPlayerJoinToUsers, sendPlayerQuitToUsers } from '../sockets'
import { trimUUID, parseVersion, getName } from '../utils'
import { db } from '../nodebb'

// TEMP
import { getUser } from './users'

export function updateServerStatus (status, next) {
  const updateTime = Math.round(Date.now() / 60000) * 60000, sid = status.sid, tps = status.tps

  status.isServerOnline = '1'
  status.hasPlugins = status.pluginList ? true : false
  status.hasMods = status.modList ? true : false
  status.updateTime = updateTime

  // Sort plugins lexically.
  if (Array.isArray(status.pluginList)) status.pluginList = status.pluginList.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)

  // Trim UUIDs to Mojang format.
  status.players.forEach(player => {
    if (!player.id) return
    player.id = trimUUID(player.id)
  })

  async.filter(status.players, (player, next) => {
    // Verify the player has a valid uuid<=>name match.
    Backend.getUuidFromName(player.name, (err, id) => {
      next(err ? false : (player.id === id ? true : false))
    })
  }, players => {
    status.players = players
    // Store the player statistics in the database.
    async.each(status.players, (player, next) => {
      db.setObject(`yuuid:${player.id}`, {lastonline: updateTime, name: player.name}, next)
    }, err => {
      if (err) return next(err)
      // Update the status in the database and send to the forum users.
      Backend.updateServerStatus(status, err => {
        if (err) return next(err)
        getServerStatus({sid: status.sid}, (err, status) => {
          if (err) return next(err)
          sendStatusToUsers(status)
        })
      })
    })
  })
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

export function eventPlayerJoin (data, next) {
  // TODO: remove sid from player data. {sid: sid, player: {data}}
  const {sid, id, name, displayName, prefix, suffix, groups, playtime } = data

  Backend.getUuidFromName(name, (err, _id) => {
    if (err || _id !== id) return next(err || new Error('Offline servers not supported.'))

    async.parallel([
      async.apply(db.sortedSetAdd, `mi:server:${sid}:players`, 0, `${name}:${id}`),
      async.apply(db.setObject, `yuuid:${id}`, data),
      async.apply(sendPlayerJoinToUsers, {sid, player: {id, name}})
    ], next)
  })
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
