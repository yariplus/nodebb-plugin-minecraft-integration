import { translator } from './nodebb'
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

export const init = _app => {
  app = _app
}

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
