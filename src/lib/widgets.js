const Widgets = module.exports = { }

import { translator } from './nodebb'
import { getServerStatus } from './api'
import Backend from './backend'
import Config from './config'
import Utils from './utils'
import async from 'async'

import { render as renderChat } from './widgets/chat'
import { render as renderDirectort } from './widgets/directory'
import { render as renderGallery } from './widgets/gallery'
import { render as renderMap } from './widgets/map'
import { render as renderPingGraph } from './widgets/ping-graph'
import { render as renderPlayersGraph } from './widgets/players-graph'
import { render as renderPlayersGrid } from './widgets/players-grid'
import { render as renderStatus } from './widgets/status'
import { render as renderTopGraph } from './widgets/top-graph'
import { render as renderTopList } from './widgets/top-list'
import { render as renderTPSGraph } from './widgets/tps-graph'
import { render as renderVoteList } from './widgets/vote-list'

let app

Widgets.init = function (_app) {
  app = _app
}

Widgets.renderChat = (widget, callback) => {
  render(renderChat, 'chat', widget, callback) }
Widgets.renderDirectort = (widget, callback) => {
  render(renderDirectort, 'directory', widget, callback) }
Widgets.renderGallery = (widget, callback) => {
  render(renderGallery, 'gallery', widget, callback) }
Widgets.renderMap = (widget, callback) => {
  render(renderMap, 'map', widget, callback) }
Widgets.renderPingGraph = (widget, callback) => {
  render(renderPingGraph, 'ping-graph', widget, callback) }
Widgets.renderPlayersGraph = (widget, callback) => {
  render(renderPlayersGraph, 'players-graph', widget, callback) }
Widgets.renderPlayersGrid = (widget, callback) => {
  render(renderPlayersGrid, 'players-grid', widget, callback) }
Widgets.renderStatus = (widget, callback) => {
  render(renderStatus, 'status', widget, callback) }
Widgets.renderTopGraph = (widget, callback) => {
  render(renderTopGraph, 'top-graph', widget, callback) }
Widgets.renderTopList = (widget, callback) => {
  render(renderTopList, 'top-list', widget, callback) }
Widgets.renderTPSGraph = (widget, callback) => {
  render(renderTPSGraph, 'tps-graph', widget, callback) }
Widgets.renderVoteList = (widget, callback) => {
  render(renderVoteList, 'vote-list', widget, callback) }

function formatWidget (widget, callback) {
  // API checks for invalid SIDs.
  getServerStatus({sid: widget.data.sid}, (err, status) => {
    if (err) return callback(err)

    for (const p in status) widget.data[p] = status[p]

    if (widget.data.parseFormatCodes == 'on' ? true : false) {
      widget.data.name = Utils.parseMCFormatCodes(status.name)
      widget.data.motd = Utils.parseMCFormatCodes(status.motd)
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

function render (renderWidget, type, widget, callback) {
  async.waterfall([
    async.apply(formatWidget, widget),
    async.apply(renderWidget)
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
