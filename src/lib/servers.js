// Servers Model

import {
  async,
  db,
  winston,
} from './nodebb'

import {
  parseVersion,
} from './utils'

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
    status.isServerOnline = !!parseInt(status.isServerOnline, 10)
    status.hasMods = !!parseInt(status.hasMods, 10)
    status.hasPlugins = !!parseInt(status.hasPlugins, 10)

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

// TODO: Signature (sid, status, next)
export function updateServerStatus (status, next) {
  let {
    sid,
    players,
    updateTime,
    tps,
  } = status

  status.players = status.players || '[]'
  status.pluginList = status.pluginList || '[]'
  status.modList = status.modList || '[]'

  if (typeof status.players === 'object') status.players = JSON.stringify(status.players)
  if (typeof status.pluginList === 'object') status.pluginList = JSON.stringify(status.pluginList)
  if (typeof status.modList === 'object') status.modList = JSON.stringify(status.modList)

  async.waterfall([
    async.apply(db.delete, `mi:server:${sid}`),
    async.apply(db.setObject, `mi:server:${sid}`, status),
    async.apply(db.expire, `mi:server:${sid}`, Config.getPingExpiry()),
    async.apply(db.setObjectField, `mi:server:${sid}:ping:${updateTime}`, 'players', status.players),
    async.apply(db.setObjectField, `mi:server:${sid}:ping:${updateTime}`, 'tps', tps),
    async.apply(db.expire, `mi:server:${sid}:ping:${updateTime}`, Config.getPingExpiry()),
    async.apply(setServerPlayers, sid, players),
    async.apply(updatePingList, `mi:server:${sid}:pings`, updateTime),
  ], next)
}

function setServerPlayers (sid, players, next) {
  console.log('Set Players')
  console.log(Array.isArray(players))
  console.log(players)
  let key = `mi:server:${sid}:players`
  let values = players.map(player => `${player.name}:${player.id}`)
  let scores = players.map(player => 0)

  async.waterfall([
    async.apply(db.delete, key),
    async.apply(db.sortedSetAdd, key, scores, values),
  ])
}

// TODO: Make this retrieve a time range instead of a fixed amount.
export function getServerPings (sid, amount, next) {
  async.waterfall([
    async.apply(db.getSortedSetRevRange, `mi:server:pings`, 0, amount),
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

export function getTopPlayersByPlaytimes (data, callback) {
  data.show = data.show || 5

  db.getSortedSetRevRangeByScoreWithScores('yuuid:playtime', 0, data.show, '+inf', 0, (err, data) => {
    async.map(data, (value, next) => {
      getPlayerFromUuid(value.value, (err, profile) => {
        if (err) return next(err)
        next(null, {id: value.value, name: profile.name, playtime: value.score, playtimeHuman: parseMinutesDuration(value.score)})
      })
    }, callback)
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

export function setScoreboard (objective, entries, scores, minute, next) {
  const key = `mi:server:${sid}:scoreboards:${objective}`

  if (!entries.length || !scores.length || entries.length !== scores.length) return next(new Error('setScoreboard called with invalid entries.')) // TODO

  async.waterfall([
    async.apply(db.delete, `${key}:${minute}`),
    async.apply(db.sortedSetAdd, `${key}:timestamps`, minute, minute),
    async.apply(db.sortedSetAdd, `${key}:${minute}`, scores, entries),
    async.apply(db.expire, `${key}:${minute}`, 60 * 60 * 24 * 365), // TODO: Configurable expiry.
  ], next)
}

export function getScoreboard (objective, minute, next) {
  db.getSortedSetRange(`mi:server:${sid}:scoreboards:${objective}:${minute}`, 0, -1, next)
}

export function getScoreboardRange (objective, min, max, next) {
  db.getSortedSetRevRangeByScore(`mi:server:${sid}:scoreboards:${objective}:timestamps`, 0, 10000000, max, min, (err, minutes) => {
    if (err) return next(err)

    async.map(minutes, (minute, next) => getScoreboard(objective, minute, next), next)
  })
}

export function getScoreboards (objective, amount, next) {
  db.getSortedSetRevRange(`mi:server:${sid}:scoreboards:${objective}:timestamps`, 0, amount - 1, (err, minutes) => {
    if (err) return next(err)

    async.map(minutes, (minute, next) => getScoreboard(objective, minute, next), next)
  })
}
