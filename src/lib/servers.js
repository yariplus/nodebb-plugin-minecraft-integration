// Servers Model


import {
  async,
  db,
  winston,
} from './nodebb'

import {
  trimUUID,
  parseVersion,
  parseMillisecondsDuration,
} from './utils'

import {
  getUuidFromName,
  getPlayerByUuid,
} from './players'

import Config from './config'

export function getAllServersStatus (data, next) {
  getServersSids(data, (err, sids) => {
    async.map(sids, (sid, next) => {
      getServerStatus(sid, (err, server) => {
        if (err) winston.error(err)
        next(null, server)
      })
    }, (err, servers) => {
      next(err, servers.filter(server => server))
    })
  })
}

export function getServersSids (next) {
  db.getSortedSetRange('mi:servers', 0, -1, next)
}

export function getServerStatus (sid, next) {
  async.parallel({
    status: async.apply(db.getObject, `mi:server:${sid}`),
    config: async.apply(db.getObject, `mi:server:${sid}:config`),
  }, (err, results) => {
    if (err) return next(err)

    let { status, config } = results

    if (!config) return next(new Error(`getServerStatus() No config exists for SID ${sid}`))
    if (!status) return next(new Error(`getServerStatus() No status exists for SID ${sid} named ${config.name}`))

    // Parsed as arrays.
    try {
      if (status.modList && typeof status.modList === 'string' && status.modList !== 'undefined') status.modList = JSON.parse(status.modList)
      if (status.pluginList && typeof status.pluginList === 'string' && status.pluginList !== 'undefined') status.pluginList = JSON.parse(status.pluginList)
    } catch (e) {
      console.log('Bad Status', status)
      return next(e)
    }

    // Parsed as integers.
    status.maxPlayers = parseInt(status.maxPlayers, 10)
    status.onlinePlayers = parseInt(status.onlinePlayers, 10)

    // Parsed as booleans.
    status.hasMods = !!parseInt(status.hasMods, 10)
    status.hasPlugins = !!parseInt(status.hasPlugins, 10)

    // Pings are received every second, so if 5 seconds have passed, it's down.
    status.isServerOnline = Date.now() - status.lastPing < 5 * 1000

    // Strings
    status.sid = sid
    status.address = config.address
    status.version = parseVersion(status.version || 'unknown')

    // Hide plugins.
    if (parseInt(config.hidePlugins, 10)) status.pluginList = []

    // Get players
    db.getSortedSetRange(`mi:server:${sid}:players`, 0, -1, (err, players) => {
      if (err || !players) return next(null, status)

      status.players = players.map(player => {
        const data = player.split(':')
        return {name: data[0], id: data[1]}
      })

      next(null, status)
    })
  })
}

export function setServerStatus (sid, status, timestamp, next) {
  async.waterfall([
    async.apply(db.delete, `mi:server:${sid}`),
    async.apply(db.setObject, `mi:server:${sid}`, status),
    async.apply(db.expire, `mi:server:${sid}`, Config.getPingExpiry()),
    async.apply(db.sortedSetAdd, `mi:server:${sid}:pings`, timestamp, timestamp),
    async.apply(db.setObjectField, `mi:server:${sid}:ping:${timestamp}`, 'players', status.players || '[]'),
    async.apply(db.setObjectField, `mi:server:${sid}:ping:${timestamp}`, 'tps', status.tps || 0),
    async.apply(db.expire, `mi:server:${sid}:ping:${timestamp}`, Config.getPingExpiry()),
    async.apply(prunePings, sid),
  ], next)
}

// Called when a status event is received.
export function setServerPlayers (sid, players, timestamp, next) {
  let key = `mi:server:${sid}:players`
  let values = players.map(player => `${player.name}:${player.id}`)
  let scores = players.map(player => 0)

  // Set the online players.
  async.waterfall([
    async.apply(db.delete, key),
    async.apply(db.sortedSetAdd, key, scores, values),
  ], next)

  // Set playtime. (milliseconds)
  players.forEach(player => {
    let { id, playtime } = player
    let key = `mi:server:${sid}:players:playtime`

    if (player.playtime) {
      // Uses Playtime from OnTime or another plugin.
      db.sortedSetAdd(key, playtime, id)
    } else {
      // Uses in-built timekeeper.
      db.getObjectField(`mi:server:${sid}`, 'timestamp', (err, lastpingtimestamp) => {

        // If the last pinged minute was already counted, return.
        lastpingtimestamp = Math.floor(lastpingtimestamp/60000) * 60000
        if (lastpingtimestamp === timestamp) return

        // Otherwise add a minute to the time.
        db.sortedSetScore(key, id, (err, playtime) => {
          playtime = playtime ? playtime + 60000 : 60000
          db.sortedSetAdd(key, playtime, id)
        })
      })
    }
  })
}

// TODO: Make this retrieve a time range instead of a fixed amount.
export function getServerPings (sid, amount, next) {
  async.waterfall([
    async.apply(db.getSortedSetRevRange, `mi:server:${sid}:pings`, 0, amount),
    (stamps, next) => {
      next(null, stamps.map(stamp => `mi:server:${sid}:ping:${stamp}`))
    },
    async.apply(db.getObjects),
  ], (err, pings) => {
    if (err) return next(err)

    // Read and parse the stored pings for each stamp.
    async.map(pings.filter(pings => pings), (ping, next) => {
      // TODO: Read players as a separate hash.
      if (typeof ping.players === 'string') {
        try {
          ping.players = JSON.parse(ping.players)
        } catch (e) {
          ping.players = []
        }
      }

      // Remove invalid TPS values.
      if (parseInt(ping.tps, 10) > 100) ping.tps = '0'

      // Store stamp for charting, and human time for display.
      ping.timestamp = stamp
      ping.humanTime = getHumanTime(stamp)

      next(null, ping)
    }, next)
  })
}

export function getServerPlugins (sid, next) {
  async.parallel({
    pluginList: async.apply(db.getObjectField, `mi:server:${sid}`, 'pluginList'),
    config: async.apply(db.getObject, `mi:server:${sid}:config`),
  }, (err, results) => {
    if (err) return next(err)

    let { pluginList, config } = results

    if (!config) return next(new Error(`getServerStatus() No config exists for SID ${sid}`))
    if (!pluginList) return next(new Error(`getServerStatus() No plugins exist for SID ${sid} named ${config.name}`))

    if (typeof pluginList === 'string') {
      try {
        pluginList = JSON.parse(pluginList)
      } catch (err) {
        console.log(`JSON ERROR: ${err}`)
        console.log(pluginList)
        pluginList = []
      }
    }

    next(null, pluginList)
  })
}

export function getServerIcon (sid, next) {
  db.getObjectField(`mi:server:${sid}`, 'icon', (err, icon) => {
    if (err || !icon) return next(err)

    icon = icon.replace('data:image/png;base64,', '')

    next(null, icon)
  })
}

export function setServerPing (sid, timestamp, next) {
  db.setObjectField(`mi:server:${sid}`, 'lastPing', timestamp, next)
}

export function prunePings (sid, next) {
  const key = `mi:server:${sid}:pings`

  db.getSortedSetRange(key, 0, -1, (err, timestamps) => {
    if (err) return next(err)

    timestamps.forEach(timestamp => {
      if (Date.now() - Config.getPingExpiry() > timestamp) db.sortedSetRemove(key, timestamp)
    })

    next()
  })
}

export function deleteServer (data, next) {
  if (!data || !(parseInt(data.sid, 10) > -1)) return next(new Error('Invalid data sent to deleteServer()'))

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

export function getServersConfig (_sids, next) {
  if (typeof _sids === 'function') {
    next = _sids
    _sids = []
  }

  async.waterfall([
    (next) => {
      if (_sids.length) {
        next(null, _sids)
      } else {
        getServersSids(next)
      }
    },
    (sids, next) => {
      _sids = sids
      db.getObjects(sids.map(sid => `mi:server:${sid}:config`), next)
    },
    (configs, next) => {
      _sids.forEach((sid, i) => {
        configs[i].sid = sid
      })
      next(null, configs)
    },
  ], next)
}

export function getServerConfig (sid, next) {
  getServersConfig([sid], (err, configs) => next(err, err ? null : configs[0]))
}

export function getSidUsingAPIKey (key, next) {
  let payload = null

  getServersConfig((err, configs) => {

    if (err) return next(err)

    configs.forEach(config => {
      if (config.APIKey === key) payload = config.sid
    })

    return next(payload ? null : new Error('Invalid API Key'), payload)
  })
}

export function setSidAPIKey (sid) {
  db.setObjectField(`mi:server:${sid}`, '')
}

export function getPlaytimes (options, next) {
  db.getSortedSetRangeWithScores('yuuid:playtime', 0, -1, (err, data) => {
    next(err, data)
  })
}

export function getTopPlayersByPlaytimes (sid, amount, next) {
  let key = `mi:server:${sid}:players:playtime`

  // Value is UUID, Score is milliseconds playtime.
  db.getSortedSetRevRangeByScoreWithScores(key, 0, amount, '+inf', 0, (err, players) => {
    if (err) return next(err)

    async.map(players, (player, next) => {
      getPlayerByUuid(player.value, (err, profile) => {
        if (err) return next(err)

        next(null, {
          id: player.value,
          score: player.score,
          name: profile.name,
          scoreHuman: parseMillisecondsDuration(player.score)
        })
      })
    }, next)
  })
}

export function isValidSlug (sid, slug, next) {
  if (slug.length) {
    if (slug.length < 4) return next(new Error('Slug length must be at least 4 characters.'))

    getSidFromSlug(slug, (err, _sid) => {
      if (err || ( _sid && _sid >= 0 && _sid != sid )) return next('Slug already used.')

      next()
    })
  } else {
    next()
  }
}

export function setSlug (sid, slug, next) {
  db.sortedSetAdd(`mi:servers:slugs`, sid, slug, next)
}

export function getSlug (sid, next) {
  db.getSortedSetRangeByScore(`mi:servers:slugs`, 0, -1, sid, sid, (err, slugs) => {
    next(err, slugs && slugs.length ? slugs[0] : '')
  })
}

export function getSidFromSlug (slug, next) {
  db.sortedSetScore(`mi:servers:slugs`, slug, next)
}

export function getServerConfigFromSlug (slug, next) {
  getSidFromSlug(slug, (err, sid) => {
    if (err) return next(err)
    getServerConfig(sid, next)
  })
}

export function getServerStatusFromSlug (slug, next) {
  getSidFromSlug(slug, (err, sid) => {
    if (err) return next(err)
    getServerStatus(sid, next)
  })
}

export function setScoreboard (sid, objectives, timestamp, next) {
  async.each(objectives, (objective, next) => {
    let { name, displayname, entries } = objective
    let entriesJSON, scores, ids

    if (!Array.isArray(entries)) entries = []

    entries.forEach(entry => entry.id = trimUUID(entry.id))

    entriesJSON = JSON.stringify(entries)

    scores = entries.map(entry => entry.score)
    ids = entries.map(entry => entry.id)

    async.waterfall([
      async.apply(db.sortedSetAdd, `mi:server:${sid}:objectives`, 0, name),
      async.apply(db.setObject,    `mi:server:${sid}:objective:${name}`, {name, displayname, entriesJSON}),
      async.apply(db.sortedSetAdd, `mi:server:${sid}:objective:${name}:timestamps`, timestamp, timestamp),
      async.apply(db.sortedSetAdd, `mi:server:${sid}:objective:${name}:timestamp:${timestamp}`, scores, ids),
      async.apply(db.expire, `mi:server:${sid}:objectives`, Config.getPingExpiry()),
      async.apply(db.expire, `mi:server:${sid}:objective:${name}`, Config.getPingExpiry()),
      async.apply(db.expire, `mi:server:${sid}:objective:${name}:timestamps`, Config.getPingExpiry()),
      async.apply(db.expire, `mi:server:${sid}:objective:${name}:timestamp:${timestamp}`, Config.getPingExpiry()),
    ], next)
  }, next)
}

export function getScoreboard (sid, objective, minute, next) {
  db.getSortedSetRange(`mi:server:${sid}:scoreboards:${objective}:${minute}`, 0, -1, next)
}

export function getScoreboardRange (sid, objective, min, max, next) {
  db.getSortedSetRevRangeByScore(`mi:server:${sid}:scoreboards:${objective}:timestamps`, 0, 10000000, max, min, (err, minutes) => {
    if (err) return next(err)

    async.map(minutes, (minute, next) => getScoreboard(objective, minute, next), next)
  })
}

export function getScoreboards (sid, objective, amount, next) {
  db.getObjectField(`mi:server:${sid}:objective:${objective}`, 'entriesJSON', (err, entriesJSON) => {
    if (err) return next(err)
    if (!entriesJSON) return next(new Error(`Objective ${objective} not found.`))

    let entries = JSON.parse(entriesJSON)

    entries = entries.sort((a,b) => a.score > b.score ? -1 : 1).slice(0, amount)

    next(null, entries)
  })
}
