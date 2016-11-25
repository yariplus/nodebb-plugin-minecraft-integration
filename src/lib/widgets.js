import { db, User, translator } from './nodebb'
import { getServerStatus } from './api'
import Backend from './backend'
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
import { render as processTPSGraph } from './widgets/tps-graph'
import { render as processVoteList } from './widgets/vote-list'

let app

export const init = _app => (app = _app)

function render (processWidget, type, widget, callback) {
  async.waterfall([
    async.apply(formatWidget, widget),
    async.apply(processWidget)
  ], (err, data) => {
    if (err) return callback()

    if (data.container) data.container = data.container.replace('class="panel-body"', 'class="panel-body" style="padding:0;"')

    app.render(`widgets/${type}`, data, (err, html) => {
      translator.translate(html, translatedHTML => {
        callback(null, translatedHTML)
      })
    })
  })
}

function formatWidget (widget, callback) {
  // API checks for invalid SIDs.
  getServerStatus({sid: widget.data.sid}, (err, status) => {
    if (err) return callback(err)

    for (const p in status) widget.data[p] = status[p]

    widget.data.onlinePlayers = status.players.length

    if (widget.data.parseFormatCodes == 'on' ? true : false) {
      widget.data.name = parseFormatCodes(status.name)
      widget.data.motd = parseFormatCodes(status.motd)
    } else {
      // TODO: Remove formatting codes.
    }

    widget.data.title = widget.data.title.replace(/\{\{motd\}\}/, widget.data.motd)
    widget.data.title = widget.data.title.replace(/\{\{name\}\}/, widget.data.name)
    widget.data.container = widget.data.container.replace(/\{\{motd\}\}/, widget.data.motd)
    widget.data.container = widget.data.container.replace(/\{\{name\}\}/, widget.data.name)

    widget.data.colorTitle = widget.data.colorTitle || 'unset'
    widget.data.colorLabels = widget.data.colorLabels || 'unset'
    widget.data.colorText = widget.data.colorText || 'unset'

    callback(null, widget.data)
  })
}

export function getWidgets (widgets, next) {
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
export const renderTPSGraph = (widget, callback) => render(processTPSGraph, 'tps-graph', widget, callback)
export const renderVoteList = (widget, callback) => render(processVoteList, 'vote-list', widget, callback)
