"use strict";

var Widgets = { };

Widgets.Chat         = require('./widgets/chat');
Widgets.Directory    = require('./widgets/directory');
Widgets.Gallery      = require('./widgets/gallery');
Widgets.Map          = require('./widgets/map');
Widgets.PingGraph    = require('./widgets/ping-graph');
Widgets.PlayersGraph = require('./widgets/players-graph');
Widgets.PlayersGrid  = require('./widgets/players-grid');
Widgets.Status       = require('./widgets/status');
Widgets.TopGraph     = require('./widgets/top-graph');
Widgets.TopList      = require('./widgets/top-list');
Widgets.TPSGraph     = require('./widgets/tps-graph');

Widgets.render = function () {
}

module.exports = Widgets;
