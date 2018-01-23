import Config from '../config'

import { sendStatusToUsers, sendPlayerJoinToUsers, sendPlayerQuitToUsers } from '../sockets'
import { trimUUID, parseVersion, getName } from '../utils'
import { async, db } from '../nodebb'

import { storePocketAvatar } from '../avatars'

import {
  getAllServersStatus,
  getServerStatus,
  getServerPings,
  getServerPlugins,
  setServerStatus,
  setScoreboard,
  setServerPlayers,
} from '../servers'

import {
  getUuidFromName,
} from '../players'

// TEMP
import { getUser } from '../users'

function sortLex (a, b) {
  return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
}

export function list (req, res) {
  getAllServersStatus((err, servers) => {
    res.render('mi/data', {data: servers})
  })
}

export function status (req, res) {
  let sid = parseInt(req.params.sid, 10)
  if (sid === NaN) return res.redirect('/')

  getServerStatus(sid, (err, server) => {
    res.render('mi/data', {data: server})
  })
}

export function pings (req, res) {
  let { sid, amount } = req.params

  sid = parseInt(req.params.sid, 10)
  if (sid === NaN) return res.redirect('/')

  amount = parseInt(req.params.pings, 10)
  if (amount === NaN) amount = 30

  getServerPings(sid, amount, (err, pings) => {
    res.render('mi/data', {data: pings})
  })
}

export function plugins (req, res) {
  let sid = parseInt(req.params.sid, 10)
  if (sid === NaN) return res.redirect('/')

  getServerPlugins(sid, (err, plugins) => {
    res.render('mi/data', {data: plugins})
  })
}

export function icon (req, res) {
  let sid = parseInt(req.params.sid, 10)
  if (sid === NaN) return res.redirect('/')

  getServerIcon(sid, (err, base) => {
    res.render('mi/data', {data: base})
  })
}

// Forum will receive one ping a minute.
export function ping (data, next) {
  // Data from Minecraft server.
  let {
    sid,
    timestamp,
    tps,
    version,
    name,
    gametype,
    map,
    motd,
    players,
    onlinePlayers,
    maxPlayers,
    plugins,
    mods,
    icon,
    objectives,
    pocket,
  } = data

  let playersJSON, pluginsJSON, modsJSON

  // Set timestamp to floored minute.
  timestamp = Math.floor(Date.now() / 60000) * 60000

  // Trim UUIDs to Mojang format. Set pocket skins.
  players.filter(player => player.id).forEach(player => {
    player.id = trimUUID(player.id)
    if (pocket) {
      player.id = 'pocket:' + player.id
      if (player.skin) storePocketAvatar(player.name, player.skin)
    }
  })

  // Set arrays.
  if (!Array.isArray(players)) players = []
  if (!Array.isArray(plugins)) plugins = []
  if (!Array.isArray(mods)) mods = []
  if (!Array.isArray(objectives)) objectives = []

  // TODO: Fix uuid verification.
  // async.apply(async.filter, players, (player, next) => {
    // if (pocket) return next(true)
    // getUuidFromName(player.name, (err, id) => next(err ? false : (player.id === id ? true : false)))
  // }),
  // (data, next) => {
  // }

  // Sort arrays.
  players = players.sort(sortLex)
  plugins = plugins.sort(sortLex)
  mods = mods.sort(sortLex)

  // Stringify arrays.
  playersJSON = JSON.stringify(players)
  pluginsJSON = JSON.stringify(plugins)
  modsJSON = JSON.stringify(mods)

  // Set scoreboards
  setScoreboard(sid, objectives, timestamp, () => {})

  // Stored status is strings only.
  let status = {
    sid,
    timestamp,
    tps,
    version,
    name,
    gametype,
    map,
    motd,
    players: playersJSON,
    plugins: pluginsJSON,
    mods: modsJSON,
    hasPlugins: plugins.length ? '1' : '0',
    hasMods: mods.length ? '1' : '0',
    onlinePlayers,
    maxPlayers,
    icon,
    pocket,
  }

  async.waterfall([
    async.apply(setServerPlayers, sid, players),
    async.apply(setServerStatus, sid, status, timestamp),
    async.apply(getServerStatus, sid),
  ], (err, status) => {
    if (err) return next(err)
    sendStatusToUsers(status)
    next()
  })
}

export function join (data, next) {
  // TODO: Refactor ideas
  // const {
    // sid,
    // isPocket,
    // player: {
      // id,
      // name,
      // displayName,
      // prefix,
      // suffix,
      // primaryGroup,
      // playtime,
      // skin,
    // },
  // } = data

  const {
    sid,
    id,
    name,
    displayName,
    prefix,
    suffix,
    primaryGroup,
    playtime,
    skin,
    pocket,
  } = data

  // Required fields.
  if (!(sid && id && name && displayName)) {
    next(new Error('Invalid data sent to eventPlayerJoin()'))
    console.dir(data) // TODO
    return
  }

  // Check for proper uuid.
  getUuidFromName(name, (err, _id) => {
    // Exit if using an offline name and the server is not pocket.
    if ((err || _id !== id) && !pocket) return next(err || new Error('Offline servers not supported.'))

    if (pocket) {
      // Store uuid in the cache.
      db.set(`mi:name:pocket:${name}`, uuid)
      db.expire(`mi:name:pocket:${name}`, Config.getPlayerExpiry())
    }

    // Set lists.
    async.parallel([
      async.apply(db.sortedSetAdd, `mi:server:${sid}:players`, 0, `${name}:${id}`),
      async.apply(db.setObject, `yuuid:${id}`, {id, name, displayName, prefix, suffix, primaryGroup, playtime}),
      async.apply(sendPlayerJoinToUsers, {sid, player: {id, name}})
    ], next)
  })
}

export function quit (data, next) {
  const {
    sid,
    id,
    name,
  } = data

  getUuidFromName(name, (err, _id) => {
    if (err || _id !== id) return next(err || new Error('Offline servers not currently supported.'))

    async.parallel([
      async.apply(db.sortedSetRemove, `mi:server:${sid}:players`, `${name}:${id}`),
      async.apply(sendPlayerQuitToUsers, {sid, player: {id, name}})
    ], next)
  })
}

export function scoreboards (data, next) {
  
}
