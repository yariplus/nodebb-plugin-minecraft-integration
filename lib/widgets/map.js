"use strict";

var Map = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

Map.render = function (widget, callback) {
	if (!widget.data.sid || isNaN(parseInt(widget.data.sid)) || parseInt(widget.data.sid) < 0) return callback('Invalid sid: ' + widget.data.sid, '');

	widget.data.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;
	widget.data.showfull         = widget.data.showfull == "on" ? true : false;

	var config = Config.settings.get('servers')[widget.data.sid];

	widget.data.name	= widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(config.name) : config.name;

	NodeBB.db.getObject('mi:server:' + widget.data.sid, function (err, status) {
		if (err) console.log('~~~' + err);
		if (err || !status) return callback(err, '');

		widget.data.host          = status.host;
		widget.data.motd          = widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(status.motd) : status.motd;

		widget.data.uri = widget.data.uri || 'http://' + status.host + ':8123/';
		widget.data.uri += '?nopanel=true&hidechat=true&nogui=true';

		widget.data.modalID = "serverstatusmap" + widget.data.sid;

		widget.data.title = widget.data.title.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.title = widget.data.title.replace(/\{\{name\}\}/, widget.data.name);
		widget.data.container = widget.data.container.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.container = widget.data.container.replace(/\{\{name\}\}/, widget.data.name);

		NodeBB.app.render('widgets/map', widget.data, function(err, html) {
			NodeBB.translator.translate(html, function(translatedHTML) {
				callback(err, translatedHTML);
			});
		});
	});
};

module.exports = Map;
