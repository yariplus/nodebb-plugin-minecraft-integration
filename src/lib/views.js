import { db, User, translator } from './nodebb'
import { getPlayerKey, getUserLinkedPlayers } from './api'
import Config from './config'
import Backend from './backend'
import Utils from './utils'
import async from 'async'
import fs from 'fs'
import path from 'path'

const nconf = require.main.require('nconf')

const Views = module.exports = { }

let app

Views.init = (_app, middleware, router) => {
  app = _app

  function renderMinecraftProfile (req, res) {
    let payload = {}

    async.waterfall([
      async.apply(User.getUidByUserslug, req.params.user),
      async.apply(User.getUserData),
      (userData, next) => {
        // TODO: Attach profile info.
        // if (!(userData && userData.yuuid)) return next()
        // NodeBB.db.getObject('yuuid:' + userData.yuuid, next)

        payload = userData

        if (req.uid !== parseInt(userData.uid, 10)) {
          payload.isSelf = false
          return next(null, userData.uid)
        } else {
          payload.isSelf = true
        }

        getPlayerKey({uid: req.uid}, (err, result) => {
          if (err) return next(err)
          payload.playerKey = result.key
          return next(err, userData.uid)
        })
      },
      (uid, next) => {
        getUserLinkedPlayers(uid, (err, players) => {
          if (err || !players || !players.length) {
            payload.hasPlayers = false
          } else {
            players = players.map(player => {
              player.prefix = Utils.parseMCFormatCodes(player.prefix)
              return player
            })

            payload.hasPlayers = true
            payload.players = players
          }
          next()
        })
      }
    ], err => {
      if (err) console.log(err)

      payload.title = req.params.user

      res.render('account/minecraft', payload)
    })
  }

  router.get('/api/user/:user/minecraft', renderMinecraftProfile)
  router.get('/user/:user/minecraft', middleware.buildHeader, renderMinecraftProfile)

  router.get('/minecraft/register', redirectRegister)
  router.get('/mc/register', redirectRegister)
}

function redirectRegister (req, res) {
  if (!req.uid) {
    res.redirect('/register')
  } else {
    User.getUserField(req.uid, 'userslug', (err, slug) => {
      res.redirect(`/user/${slug}/minecraft`)
    })
  }
}

Views.buildAdminHeader = (custom_header, next) => {
  custom_header.plugins.push({
    'route': '/plugins/minecraft-integration',
    'icon': 'fa-cube',
    'name': 'Minecraft Integration'
  })

  return next(null, custom_header)
}

Views.getWidgets = (widgets, next) => {
  const _widgets = [
    { widget: 'mi-chat', name: 'Minecraft Chat', content: 'admin/widgets/chat.tpl', description: 'Shows a shoutbox-like area connected to the in-game chat.'},
    { widget: 'mi-map', name: 'Minecraft Mini Map', content: 'admin/widgets/map.tpl', description: 'Shows a small Map.'},
    { widget: 'mi-players-graph', name: 'Minecraft Players Graph', content: 'admin/widgets/players-graph.tpl', description: 'Shows a graph showing players over time.' },
    { widget: 'mi-players-grid', name: 'Minecraft Players Grid', content: 'admin/widgets/players-grid.tpl', description: 'Shows the avatars of all online players or a group of specific players.' },
    { widget: 'mi-status', name: 'Minecraft Server Status', content: 'admin/widgets/status.tpl', description: 'Lists information on a Minecraft server.' },
    { widget: 'mi-top-graph', name: 'Minecraft Top Players Graph', content: 'admin/widgets/top-graph.tpl', description: "A graphic chart (Pie, Donut, or Bar) representing the top players' based on a specific statistic." },
    { widget: 'mi-top-list', name: 'Minecraft Top Players List', content: 'admin/widgets/top-list.tpl', description: "Lists avatars representing the top players' based on a specific statistic." },
    { widget: 'mi-tps-graph', name: 'Minecraft TPS Graph', content: 'admin/widgets/tps-graph.tpl', description: 'Shows the approximate tick time of the server over time.' },
    { widget: 'mi-vote-list', name: 'Minecraft Vote List', content: 'admin/widgets/vote-list.tpl', description: 'Links to sites where players can vote for the server.' }
  // { widget: "mi-directory",     name: "Minecraft Player Directory",  content: 'admin/widgets/directory.tpl',     description: "Find and view information on players." }
  // { widget: "mi-gallery",       name: "Minecraft Gallery",           content: 'admin/widgets/gallery.tpl',       description: "A gallery of player uploaded screenshots." }
  // { widget: "mi-ping-graph",    name: "Minecraft Ping Graph",        content: 'admin/widgets/players-graph.tpl', description: "Shows the ping (network latency) of the server over time." }
  ]

  Backend.getServersConfig({}, (err, servers) => {
    if (err) console.log('TODO: add an error for widget load failure.')

    async.each(_widgets, (widget, next) => {
      app.render(widget.content, {servers}, (err, content) => {
        translator.translate(content, content => {
          widget.content = content
          next()
        })
      })
    }, err => {
      widgets = widgets.concat(_widgets)
      next(null, widgets)
    })
  })
}

Views.modifyTemplates = callback => {
  callback = callback || (() => {
  })

  const tplPath = path.join(nconf.get('base_dir'), 'public/templates/account/profile.tpl')

  async.parallel({
    original (next) {
      fs.readFile(tplPath, next)
    }
  }, (err, tpls) => {
    if (err) {
      return callback(err)
    }

    let tpl = tpls.original.toString()

    if (!tpl.match('{prefix}')) {
      // Persona
      tpl = tpl.replace('<h1 class="fullname"><!-- IF fullname -->{fullname}<!-- ELSE -->{username}<!-- ENDIF fullname --></h1>', '<span class="h1 prefix" <!-- IF !prefix -->style="display:none;"<!-- ENDIF !prefix -->>{prefix} {username}</span><h1 class="fullname"><!-- IF fullname -->{fullname}<!-- ELSE -->{username}<!-- ENDIF fullname --></h1>')

      // Vanilla/Lavender
      tpl = tpl.replace('			<i component="user/status" class="fa fa-circle status {status}" title="[[global:{status}]]"></i>', '<span class="h4" <!-- IF !prefix -->style="display:none;"<!-- ENDIF !prefix -->>{prefix}</span><br><i component="user/status" class="fa fa-circle status {status}" title="[[global:{status}]]"></i>')
    }

    fs.writeFile(tplPath, tpl, callback)
  })
}
