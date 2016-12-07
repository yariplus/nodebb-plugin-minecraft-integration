// import './lib/analytics'

import { emitter, db } from './lib/nodebb'

import Admin from './lib/admin'
import Backend from './lib/backend'
import Config from './lib/config'
import { getKey } from './lib/utils'
import Updater from './lib/updater'
import Routes from './lib/routes'

import async from 'async'
import fs from 'fs'
import path from 'path'

const nconf = require.main.require('nconf')

import * as Widgets from './lib/widgets'
import Hooks from './lib/hooks'

export { Widgets, Hooks }
export { buildAdminHeader } from './lib/admin'

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
    config.address = config.address || (`${require('nconf').get('url')}:25565`)
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
  const tplPath = path.join(nconf.get('base_dir'), 'public/templates/account/profile.tpl')

  async.parallel({
    original (next) {
      fs.readFile(tplPath, next)
    }
  }, (err, tpls) => {
    if (err) return console.log(err)

    let tpl = tpls.original.toString()

    if (!tpl.match('{prefix}')) {
      // Persona
      tpl = tpl.replace('<h1 class="fullname"><!-- IF fullname -->{fullname}<!-- ELSE -->{username}<!-- ENDIF fullname --></h1>', '<span class="h1 prefix" <!-- IF !prefix -->style="display:none;"<!-- ENDIF !prefix -->>{prefix} {username}</span><h1 class="fullname"><!-- IF fullname -->{fullname}<!-- ELSE -->{username}<!-- ENDIF fullname --></h1>')

      // Vanilla/Lavender
      tpl = tpl.replace('			<i component="user/status" class="fa fa-circle status {status}" title="[[global:{status}]]"></i>', '<span class="h4" <!-- IF !prefix -->style="display:none;"<!-- ENDIF !prefix -->>{prefix}</span><br><i component="user/status" class="fa fa-circle status {status}" title="[[global:{status}]]"></i>')
    }

    fs.writeFile(tplPath, tpl)
  })
}
