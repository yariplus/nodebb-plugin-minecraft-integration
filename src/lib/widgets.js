import { db, User, translator, nconf } from './nodebb'
import { getServerStatus, getServersConfig, } from './servers'

import Config from './config'
import { parseFormatCodes } from './utils'
import async from 'async'

import { render as processChat } from './widgets/chat'
import { render as processDirectory } from './widgets/directory'
import { render as processGallery } from './widgets/gallery'
import { render as processMap } from './widgets/map'
import { render as processPingGraph } from './widgets/ping-graph'
import { render as processPlayersGraph } from './widgets/players-graph'
import { render as processPlayersGrid } from './widgets/players-grid'
import { render as processStatus } from './widgets/status'
import { render as processTopGraph } from './widgets/top-graph'
import { render as processTopList } from './widgets/top-list'
import { render as processScoreboardList } from './widgets/scoreboard-list'
import { render as processTPSGraph } from './widgets/tps-graph'
import { render as processVoteList } from './widgets/vote-list'

let app

export const init = _app => (app = _app)

function render (processWidget, type, widget, callback) {
  async.waterfall([
    async.apply(formatWidget, widget.data),
    (data, next) => {
      data.uid = widget.uid
      next(null, data)
    },
    async.apply(processWidget),
  ], (err, data) => {
    if (err) return callback()

    app.render(`widgets/${type}`, data, (err, html) => {
      translator.translate(html, html => {
        widget.html = html
        callback(null, widget)
      })
    })
  })
}

// TODO: Only add required fields.
function formatWidget (data, callback) {
  // API checks for invalid SIDs.
  getServerStatus(data.sid, (err, status) => {
    if (err) return callback(err)

    for (const p in status) data[p] = status[p]

    data.onlinePlayers = status.players.length

    if (data.parseFormatCodes == 'on' ? true : false) {
      data.name = parseFormatCodes(status.name)
      data.motd = parseFormatCodes(status.motd)
    } else {
      // TODO: Remove formatting codes.
    }

    data.title = data.title.replace(/\{\{motd\}\}/, data.motd)
    data.title = data.title.replace(/\{\{name\}\}/, data.name)
    data.container = data.container.replace(/\{\{motd\}\}/, data.motd)
    data.container = data.container.replace(/\{\{name\}\}/, data.name)

    data.colorTitle = data.colorTitle || 'unset'
    data.colorLabels = data.colorLabels || 'unset'
    data.colorText = data.colorText || 'unset'

    data.container = data.container ? data.container.replace('class="panel-body"', 'class="panel-body" style="padding:0;"') : null

    data.config = data.config || {}
    data.config.relative_path = nconf.get('relative_path')

    data.pocket = data.pocket ? 'pocket' : ''

    callback(null, data)
  })
}

export function getWidgets (widgets, next) {
  const _widgets = [
    { widget: 'mi-chat', name: 'Minecraft Chat', content: 'admin/widgets/chat.tpl', description: 'Shows a shoutbox-like area connected to the in-game chat.'},
    { widget: 'mi-map', name: 'Minecraft Mini Map', content: 'admin/widgets/map.tpl', description: 'Shows a small Map.'},
    // { widget: 'mi-players-graph', name: 'Minecraft Players Graph', content: 'admin/widgets/players-graph.tpl', description: 'Shows a graph showing players over time.' },
    { widget: 'mi-players-grid', name: 'Minecraft Players Grid', content: 'admin/widgets/players-grid.tpl', description: 'Shows the avatars of all online players or a group of specific players.' },
    { widget: 'mi-status', name: 'Minecraft Server Status', content: 'admin/widgets/status.tpl', description: 'Lists information on a Minecraft server.' },
    // { widget: 'mi-top-graph', name: 'Minecraft Top Players Graph', content: 'admin/widgets/top-graph.tpl', description: "A graphic chart (Pie, Donut, or Bar) representing the top players' based on a specific statistic." },
    { widget: 'mi-top-list', name: 'Minecraft Top Players List', content: 'admin/widgets/top-list.tpl', description: "Lists the top players based on a statistic." },
    { widget: 'mi-scoreboard-list', name: 'Minecraft Scoreboard List', content: 'admin/widgets/scoreboard-list.tpl', description: "Lists the top players for a scoreboard objective." },
    // { widget: 'mi-tps-graph', name: 'Minecraft TPS Graph', content: 'admin/widgets/tps-graph.tpl', description: 'Shows the approximate tick time of the server over time.' },
    // { widget: 'mi-vote-list', name: 'Minecraft Vote List', content: 'admin/widgets/vote-list.tpl', description: 'Links to sites where players can vote for the server.' },
    // { widget: "mi-directory",     name: "Minecraft Player Directory",  content: 'admin/widgets/directory.tpl',     description: "Find and view information on players." },
    // { widget: "mi-gallery",       name: "Minecraft Gallery",           content: 'admin/widgets/gallery.tpl',       description: "A gallery of player uploaded screenshots." },
    // { widget: "mi-ping-graph",    name: "Minecraft Ping Graph",        content: 'admin/widgets/players-graph.tpl', description: "Shows the ping (network latency) of the server over time." },
  ]

  // Server list for editing widgets.
  getServersConfig((err, servers) => {
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

export const renderChat = (widget, callback) => render(processChat, 'chat', widget, callback)
export const renderDirectory = (widget, callback) => render(processDirectory, 'directory', widget, callback)
export const renderGallery = (widget, callback) => render(processGallery, 'gallery', widget, callback)
export const renderMap = (widget, callback) => render(processMap, 'map', widget, callback)
export const renderPingGraph = (widget, callback) => render(processPingGraph, 'ping-graph', widget, callback)
export const renderPlayersGraph = (widget, callback) => render(processPlayersGraph, 'players-graph', widget, callback)
export const renderPlayersGrid = (widget, callback) => render(processPlayersGrid, 'players-grid', widget, callback)
export const renderStatus = (widget, callback) => render(processStatus, 'status', widget, callback)
export const renderTopGraph = (widget, callback) => render(processTopGraph, 'top-graph', widget, callback)
export const renderTopList = (widget, callback) => render(processTopList, 'top-list', widget, callback)
export const renderScoreboardList = (widget, callback) => render(processScoreboardList, 'scoreboard-list', widget, callback)
export const renderTPSGraph = (widget, callback) => render(processTPSGraph, 'tps-graph', widget, callback)
export const renderVoteList = (widget, callback) => render(processVoteList, 'vote-list', widget, callback)
