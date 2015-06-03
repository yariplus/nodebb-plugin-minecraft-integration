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

Widgets.prepare = function (widget, callback) {
	if (widget.data.sid === void 0 || isNaN(parseInt(widget.data.sid, 10)) || parseInt(widget.data.sid, 10) < 0) return callback('Invalid sid: ' + widget.data.sid, '');

	// Temp
	widget.data.isServerOnline = true;

	widget.data.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;
	widget.data.url              = Config.getAvatarUrl();

	async.parallel({
		status: async.apply(NodeBB.db.getObject, "mi:server:" + widget.data.sid),
		config: function (next) {
			next(null, Config.settings.get('servers.' + widget.data.sid));
		}
	}, function (err, payload) {
		if (err || !payload.status || !payload.config) return callback(err, '');

		widget.data.name	= widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(payload.config.name) : payload.config.name;
		widget.data.address	= payload.config.address;
		widget.data.motd    = widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(payload.status.motd) : payload.status.motd;

		widget.data.title = widget.data.title.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.title = widget.data.title.replace(/\{\{name\}\}/, widget.data.name);
		widget.data.container = widget.data.container.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.container = widget.data.container.replace(/\{\{name\}\}/, widget.data.name);

		callback(null, payload);
	});
};

module.exports = Widgets;
