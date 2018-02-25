// Updater Model
// Check status of servers and cached items.

import { async, nconf, db, pubsub } from './nodebb'
import { setServerStatus, getServersConfig, getServerStatus, setServerPlayers } from './servers'
import { clearOldAvatars } from './avatars'
import { sendStatusToUsers } from './sockets'
import { getName } from './utils'

import Config from './config'
import Logger from './logger'

let scheduler

const Updater = module.exports = { }

let uuidsNeedingUpdates = []

// TODO: Not sure what this was supposed to do.
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
  // If this is a re-init, clear any previous timer.
  if (scheduler) clearTimeout(scheduler)

  // Only start on primary node.
  if (!(nconf.get('isPrimary') === 'true' && !nconf.get('jobsDisabled'))) return
  scheduler = setTimeout(Updater.updateServers, 60000)
}

Updater.updateServers = () => {
  // Get the current minute in milliseconds.
  let updateTime = Math.floor(Date.now() / 60000) * 60000

  // Remove old avatars from cache.
  clearOldAvatars()

  getServersConfig((err, configs) => {
    configs.forEach(config => {
      let { sid, name } = config

      getServerStatus(sid, (err, status) => {
        if (err) return Logger.error(`Database error getting status for server: ${name}`)
        if (!status) return Logger.error(`No status recorded for server: ${name}`)

        // If it has been over 1:30 since the last status event, the server is down or non-responsive.
        if (!status.timestamp || (updateTime - parseInt(status.timestamp, 10)  > 90 * 1000)) {
          Logger.error(`The Minecraft server ${config.name} is not connected to forum.`)
          Logger.error(`Use the forum's url in the command "/nodebb url {url}"`)
          Logger.error(`Use the server's API key in the command "/nodebb key {key}"`)
          return resetStatus(sid, updateTime)
        }
      })
    })
  })

  // Update players. ???
  // I think this was for a name cache,
  // not really needed, we can cache on-demand.
  updatePlayers()

  // Schedule next update.
  Updater.init()
}

function resetStatus (sid, timestamp) {
  let status = { sid, timestamp }

  async.waterfall([
    async.apply(setServerStatus, sid, status, timestamp),
    async.apply(setServerPlayers, sid, [], timestamp),
    async.apply(getServerStatus, sid),
  ], (err, status) => sendStatusToUsers(status))
}
