// import './lib/analytics'

import {
  async,
  emitter,
  db,
  nconf,
} from './lib/nodebb'

import Admin from './lib/admin'
import Config from './lib/config'
import { getKey } from './lib/utils'
import Updater from './lib/updater'
import Routes from './lib/routes'

import fs from 'fs'
import path from 'path'

import * as Widgets from './lib/widgets'
import Hooks from './lib/hooks'

export { Widgets, Hooks }

export function load (params, next) {
  const { app, middleware, router } = params

  app.set('json spaces', 4)

  Routes(app, middleware, router)
  Admin()
  Config.init()
  Widgets.init(app)

  // Add a default server.
  db.getObject('mi:server:0:config', (err, config) => {
    if (err) return next(err)

    config = config || {}
    config.name = config.name || 'A Minecraft Server'
    config.address = config.address || `${nconf.get('url')}:25565`
    config.APIKey = config.APIKey || getKey()
    config.hidePlugins = config.hidePlugins || '0'

    db.setObject('mi:server:0:config', config)
    db.sortedSetAdd('mi:servers', Date.now(), '0')

    setTimeout(Config.logSettings, 5000)
    setTimeout(Updater.updateServers, 10000)

    next()
  })
}

// Modify Templates
export function onNodeBBReady () {
  
}
