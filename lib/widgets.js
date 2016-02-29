"use strict";

var Widgets = module.exports = { },

	NodeBB  = require('./nodebb'),
	Utils   = require('./utils'),
	Config  = require('./config'),
	Backend = require('./backend'),

	async = require('async');

Widgets['chat']          = require('./widgets/chat');
Widgets['directory']     = require('./widgets/directory');
Widgets['gallery']       = require('./widgets/gallery');
Widgets['map']           = require('./widgets/map');
Widgets['ping-graph']    = require('./widgets/ping-graph');
Widgets['players-graph'] = require('./widgets/players-graph');
Widgets['players-grid']  = require('./widgets/players-grid');
Widgets['status']        = require('./widgets/status');
Widgets['top-graph']     = require('./widgets/top-graph');
Widgets['top-list']      = require('./widgets/top-list');
Widgets['tps-graph']     = require('./widgets/tps-graph');
Widgets['vote-list']     = require('./widgets/vote-list');

Widgets.renderChat         = function (widget, callback) { render("chat", widget, callback); };
Widgets.renderDirectort    = function (widget, callback) { render("directory", widget, callback); };
Widgets.renderGallery      = function (widget, callback) { render("gallery", widget, callback); };
Widgets.renderMap          = function (widget, callback) { render("map", widget, callback); };
Widgets.renderPingGraph    = function (widget, callback) { render("ping-graph", widget, callback); };
Widgets.renderPlayersGraph = function (widget, callback) { render("players-graph", widget, callback); };
Widgets.renderPlayersGrid  = function (widget, callback) { render("players-grid", widget, callback); };
Widgets.renderStatus       = function (widget, callback) { render("status", widget, callback); };
Widgets.renderTopGraph     = function (widget, callback) { render("top-graph", widget, callback); };
Widgets.renderTopList      = function (widget, callback) { render("top-list", widget, callback); };
Widgets.renderTPSGraph     = function (widget, callback) { render("tps-graph", widget, callback); };
Widgets.renderVoteList     = function (widget, callback) { render("vote-list", widget, callback); };

function formatWidget(widget, callback) {

	if (widget.data.sid === void 0 || isNaN(parseInt(widget.data.sid, 10)) || parseInt(widget.data.sid, 10) < 0) {
		console.log('Invalid sid: ' + widget.data.sid);
		return callback("error", '');
	}

	widget.data.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;

	async.parallel({
		status: async.apply(Backend.getServerStatus, {sid: widget.data.sid}),
		config: async.apply(Backend.getServerConfig, {sid: widget.data.sid})
	}, function (err, payload) {

		if (err) return callback(err);
		if (!payload.config) return callback(new Error("No Config for widget render sid: " + widget.data.sid));
		if (!payload.status) return callback(new Error("No Status for widget render sid: " + widget.data.sid));

		widget.data.status  = payload.status;
		widget.data.config  = payload.config;
		widget.data.address = payload.config.address;

		widget.data.status.version    = Utils.parseVersion(widget.data.status.version || 'unknown');
		widget.data.status.hasPlugins = !!parseInt(widget.data.status.hasPlugins, 10);
		widget.data.status.hasMods    = !!parseInt(widget.data.status.hasMods, 10);

		widget.data.name = Utils.parseMCFormatCodes(payload.config.name);
		widget.data.motd = Utils.parseMCFormatCodes(payload.status.motd);

		widget.data.title = widget.data.title.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.title = widget.data.title.replace(/\{\{name\}\}/, widget.data.name);
		widget.data.container = widget.data.container.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.container = widget.data.container.replace(/\{\{name\}\}/, widget.data.name);

		widget.data.colorTitle  = widget.data.colorTitle  || "unset";
		widget.data.colorLabels = widget.data.colorLabels || "unset";
		widget.data.colorText   = widget.data.colorText   || "unset";

		callback(null, widget.data);

	});
}

function render(type, widget, callback) {

	async.waterfall([
		async.apply(formatWidget, widget),
		async.apply(Widgets[type].render)
	], function (err, data) {

		if (err) return callback();

		NodeBB.app.render('widgets/' + type, data, function(err, html) {
			NodeBB.translator.translate(html, function(translatedHTML) {
				callback(null, translatedHTML);
			});
		});

	});

}
