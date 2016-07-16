// import './lib/analytics'

import { emitter, db } from './lib/nodebb'

import Admin from './lib/admin'
import Backend from './lib/backend'
import Config from './lib/config'
import Utils from './lib/utils'
import Updater from './lib/updater'
import Views from './lib/views'
import routes from './lib/routes'

// preload?
emitter.once('nodebb:ready', Views.modifyTemplates)

import Widgets from './lib/widgets'
import Hooks from './lib/hooks'

export { Widgets, Hooks }

export function load (params, next) {

  params.app.set('json spaces', 4)

  routes(params.app, params.middleware, params.router)
  Views.init(params.app, params.middleware, params.router)
  Admin.init()
  Widgets.init(params.app)

  // Add a default server.
  db.getObject('mi:server:0:config', (err, config) => {

    if (err) return next(new Error(err))

    config = config || {}
    config.name        = config.name        || "A Minecraft Server"
    config.address     = config.address     || (`${require('nconf').get('url')}:25565`)
    config.APIKey      = config.APIKey      || Utils.getKey()
    config.hidePlugins = config.hidePlugins || "0"

    db.setObject('mi:server:0:config', config)
    db.sortedSetAdd('mi:servers', Date.now(), '0')

    setTimeout(Config.logSettings, 5000)
    setTimeout(Updater.updateServers, 10000)

    next()
  })
}
