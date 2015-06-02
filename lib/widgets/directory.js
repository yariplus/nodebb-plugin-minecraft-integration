"use strict";

var Directory = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

Directory.render = function (widget, callback) {
	if (isNaN(parseInt(widget.data.sid)) || parseInt(widget.data.sid) < 0) return callback('Invalid sid: ' + widget.data.sid, '');

	widget.data.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;

	var config = Config.settings.get('servers.' + widget.data.sid);
	widget.data.name	= widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(config.name) : config.name;
	widget.data.address	= config.address;

	widget.data.url = Config.getAvatarUrl();

	NodeBB.db.getObject('mi:server:' + widget.data.sid, function (err, status) {
		if (err || !status) return callback(err, '');

		widget.data.onlinePlayers = status.onlinePlayers;

		widget.data.title = widget.data.title.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.title = widget.data.title.replace(/\{\{name\}\}/, widget.data.name);
		widget.data.container = widget.data.container.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.container = widget.data.container.replace(/\{\{name\}\}/, widget.data.name);

		NodeBB.app.render('widgets/status', widget.data, function(err, html) {
			NodeBB.translator.translate(html, function(translatedHTML) {
				callback(err, translatedHTML);
			});
		});
	});
};

module.exports = Directory;
