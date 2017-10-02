import { db, pubsub } from './nodebb'

import {
  updateServerStatus,
  getServersConfig,
  getServerStatus,
} from './servers'

import {
  clearOldAvatars,
} from './avatars'

import Config from './config'

import {
  sendStatusToUsers,
} from './sockets'

import { getName } from './utils'
import async from 'async'
import winston from 'winston'
import nconf from 'nconf'

let updateTime = 0
let scheduler

const Updater = module.exports = { }

let uuidsNeedingUpdates = []

Updater.updateUuids = uuids => {
  if (!Array.isArray(uuids)) return

  for (const i in uuids) {
    if (uuidsNeedingUpdates.indexOf(uuids[i]) === -1) {
      uuidsNeedingUpdates.push(uuids[i])
    }
  }
}

function updatePlayers () {
  async.each(uuidsNeedingUpdates, (id, next) => {
    const key = `yuuid:${id}`

    // Get the name from Mojang.
    getName(id, (err, name) => {
      // Return if db error.
      if (err) return next(err)

      // Update the player object.
      db.setObjectField(key, 'name', name)
      db.setObjectField(key, 'lastupdate', Date.now())

      // Update player name cache.
      db.set(`mi:name:${name}`, id)
      db.expire(`mi:name:${name}`, Config.getPlayerExpiry())

      // Sort by last update.
      db.isSortedSetMember('yuuid:sorted', id, (err, isMember) => {
        if (!err && !isMember) db.sortedSetAdd('yuuid:sorted', Date.now(), id)
      })

      // Add to playtime cache.
      db.isSortedSetMember('yuuid:playtime', id, (err, isMember) => {
        if (!err && !isMember) db.sortedSetAdd('yuuid:playtime', 0, id)
      })

      next()
    })
  }, () => {
    uuidsNeedingUpdates = []
  })
}

pubsub.on('meta:reload', () => {
  if (scheduler) clearTimeout(scheduler)
})

Updater.init = () => {
  if (scheduler) clearTimeout(scheduler)
  // Only start on primary node.
  if (!(nconf.get('isPrimary') === 'true' && !nconf.get('jobsDisabled'))) return
  scheduler = setTimeout(Updater.updateServers, 60000)
}

Updater.updateServers = () => {
  // Get the current minute.
  updateTime = Math.round(Date.now() / 60000) * 60000

  // Remove old avatars from cache.
  clearOldAvatars()

  getServersConfig({}, (err, configs) => {
    configs.forEach(config => {
      getServerStatus(config, (err, status) => {
        if (err) {
          winston.info(`Error getting status for server ${config.name}`)
          return resetStatus(status)
        }

        if (!status) return winston.info(`No status recorded for server ${config.name}`)

        if (!status.updateTime || parseInt(status.updateTime, 10) + 1000 * 60 < updateTime) {
          winston.info(`The Minecraft server ${config.name} is not connected to forum.`)
          winston.info('Use the server\'s API key in the command "/nodebb key {key}"')
          return resetStatus(status)
        }
      })
    })
  })

  // Update players.
  updatePlayers()

  // Schedule next update.
  Updater.init()
}

function resetStatus (status = {}) {
  status.isServerOnline = '0'
  status.updateTime = updateTime
  status.players = '[]'
  status.onlinePlayers = '0'
  status.tps = '0'

  updateServerStatus(status)
  sendStatusToUsers(status)
}
