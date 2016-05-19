"use strict";

var Widgets = module.exports = { };

var NodeBB  = require('./nodebb');

var API     = require('./api');
var Backend = require('./backend');
var Config  = require('./config');
var Utils   = require('./utils');

var async = require('async');

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

	// API checks for invalid SIDs.
	API.getServerStatus({sid: widget.data.sid}, function (err, status) {
		if (err) return callback(err);

		for (var p in status) widget.data[p] = status[p];

		if (widget.data.parseFormatCodes == "on" ? true : false) {
			widget.data.name = Utils.parseMCFormatCodes(status.name);
			widget.data.motd = Utils.parseMCFormatCodes(status.motd);
		} else {
			// TODO: Remove formatting codes.
		}

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

		if (data.container) data.container = data.container.replace('class="panel-body"', 'class="panel-body" style="padding:0;"');

		NodeBB.app.render('widgets/' + type, data, function(err, html) {
			NodeBB.translator.translate(html, function(translatedHTML) {
				callback(null, translatedHTML);
			});
		});

	});

}
