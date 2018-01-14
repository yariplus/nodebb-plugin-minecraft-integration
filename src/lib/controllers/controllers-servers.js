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
  updateServerStatus,
} from '../servers'

import {
  getUuidFromName,
} from '../players'

// TEMP
import { getUser } from '../users'

function list (req, res) {
  getAllServersStatus((err, servers) => {
    res.render('mi/data', {data: servers})
  })
}

function status (req, res) {
  let sid = parseInt(req.params.sid, 10)
  if (sid === NaN) return res.redirect('/')

  getServerStatus(sid, (err, server) => {
    res.render('mi/data', {data: server})
  })
}

function pings (req, res) {
  let { sid, amount } = req.params

  sid = parseInt(req.params.sid, 10)
  if (sid === NaN) return res.redirect('/')

  amount = parseInt(req.params.pings, 10)
  if (amount === NaN) amount = 30

  getServerPings(sid, amount, (err, pings) => {
    res.render('mi/data', {data: pings})
  })
}

function plugins (req, res) {
  let sid = parseInt(req.params.sid, 10)
  if (sid === NaN) return res.redirect('/')

  getServerPlugins(sid, (err, plugins) => {
    res.render('mi/data', {data: plugins})
  })
}

function icon (req, res) {
  let sid = parseInt(req.params.sid, 10)
  if (sid === NaN) return res.redirect('/')

  getServerIcon(sid, (err, base) => {
    res.render('mi/data', {data: base})
  })
}

function writeServerStatus (status, next) {
  console.log('Got server status:')
  console.dir(status)

  // TODO: Should be calculated server-side.
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
    if (status.pocket) player.id = 'pocket:' + player.id
  })

  async.filter(status.players, (player, next) => {
    if (status.pocket) return next(true)

    // Verify the player has a valid uuid<=>name match.
    getUuidFromName(player.name, (err, id) => {
      next(err ? false : (player.id === id ? true : false))
    })
  }, players => {
    let scores = []
    let values = []

    async.waterfall([
      async.apply(db.delete, `mi:server:${sid}:players`),
      async.apply(async.each, players, (player, next) => {
        let {name, id, displayName, prefix, suffix, primaryGroup, playtime, skin} = player

        if (!id) return next()

        if (status.pocket && skin) {
          //console.log(`found skin for ${name}`)
          storePocketAvatar(name, skin)
        }

        scores.push(0)
        values.push(`${name}:${id}`)
        db.setObject(`yuuid:${id}`, {lastonline: updateTime, name, id, displayName, prefix, suffix, primaryGroup, playtime}, next)
      }),
      async.apply(db.sortedSetAdd, `mi:server:${sid}:players`, scores, values)
    ], (err) => {
      if (err) return next(err)

      console.log('Parsed status is:')
      console.dir(status)

      updateServerStatus(status, err => {
        if (err) return next(err)
        getServerStatus(status.sid, (err, status) => {
          if (err) return next(err)
          sendStatusToUsers(status)
          next()
        })
      })
    })
  })
}

function join (data, next) {
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

function quit (data, next) {
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

export {
  list,
  status,
  pings,
  plugins,
  icon,
  writeServerStatus,
  join,
  quit,
}
