// Servers Model

import {
  async,
  db,
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

    try {
      pluginList = JSON.parse(pluginList)
    } catch (err) {
      console.log(`JSON ERROR: ${err}`)
      pluginList = []
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

export function updateServerStatus (status, next) {
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

export function getServersConfig (data, next) {
  getServersSids((err, sids) => {
    if (err) return next(err)

    async.map(sids, getServerConfig, next)
  })
}

export function getServerConfig (sid, next) {
  db.getObject(`mi:server:${sid}:config`, (err, config) => {
    if (err) return next(err)
    if (!config) return next(new Error(`getServerConfig() invalid SID: ${sid}`))

    config.sid = sid

    next(null, config)
  })
}

export function setServerConfig (config, next) {
  // Score is used for sorting.
  db.sortedSetAdd(`mi:servers`, Date.now(), config.sid)
  db.setObject(`mi:server:${config.sid}:config`, config, next)
}

export function getSidUsingAPIKey (key, next) {
  let payload = null

  getServersConfig({}, (err, configs) => {
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
