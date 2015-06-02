"use strict";

var ServerStatus = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

function readCustomRow(label, text, after) {
	switch ( after ) {
		case "name":
			if ( !widget.data.customaftername ) { widget.data.customaftername = []; }
			widget.data.customaftername[widget.data.customaftername.length] = { label: label, text: text }
			break;
		case "status":
		default:
			if ( !widget.data.customafterstatus ) { widget.data.customafterstatus = []; }
			widget.data.customafterstatus[widget.data.customafterstatus.length] = { label: label, text: text }
			break;
		case "address":
			if ( !widget.data.customafteraddress ) { widget.data.customafteraddress = []; }
			widget.data.customafteraddress[widget.data.customafteraddress.length] = { label: label, text: text }
			break;
		case "version":
			if ( !widget.data.customafterversion ) { widget.data.customafterversion = []; }
			widget.data.customafterversion[widget.data.customafterversion.length] = { label: label, text: text }
			break;
		case "players":
			if ( !widget.data.customafterplayers ) { widget.data.customafterplayers = []; }
			widget.data.customafterplayers[widget.data.customafterplayers.length] = { label: label, text: text }
			break;
	}
}

ServerStatus.render = function (widget, callback) {
	if (widget.data.sid === void 0 || isNaN(parseInt(widget.data.sid, 10)) || parseInt(widget.data.sid, 10) < 0) return callback('Invalid sid: ' + widget.data.sid, '');

	// Temp
	widget.data.isServerOnline = true;

	widget.data.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;
	widget.data.showPlayerCount  = widget.data.showPlayerCount == "on" ? true : false;
	widget.data.showAvatars      = widget.data.showAvatars == "on" ? true : false;
	widget.data.showMOTD         = widget.data.showMOTD == "on" ? true : false;
	widget.data.hidePluginList   = widget.data.hidePluginList == "on" ? true : false;
	widget.data.showIP           = widget.data.showIP == "on" ? true : false;
	widget.data.showModalMap     = widget.data.showModalMap == "on" ? true : false;

	var config = Config.settings.get('servers.' + widget.data.sid);

	widget.data.name	= widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(config.name) : config.name;
	widget.data.address	= config.address;

	widget.data.url = Config.getAvatarUrl();

	NodeBB.db.getObject('mi:server:' + widget.data.sid, function (err, status) {
		if (err || !status) return callback(err, '');

		widget.data.host          = status.host;
		widget.data.port          = status.port;
		widget.data.version       = status.version;
		widget.data.motd          = widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(status.motd) : status.motd;
		widget.data.maxPlayers    = status.maxPlayers;
		widget.data.onlinePlayers = status.onlinePlayers;
		widget.data.hasPlugins    = status.hasPlugins;

		widget.data.showVersion = widget.data.isServerOnline && widget.data.version ? true : false;

		if (widget.data.hidePluginList) widget.data.pluginList = [ ];

		// Temp
		// if (!widget.data.version && widget.data.isServerOnline) {
			// widget.data.isServerOnline = false;
			// widget.data.isServerRestarting = true;
		// }
		if (!widget.data.isServerOnline && !widget.data.isServerRestarting) widget.data.isServerOffline = true;

		if (!widget.data.mapURI) widget.data.mapURI = 'http://' + status.host + ':8123/';
		widget.data.minimapURI = widget.data.mapURI + '?nopanel=true&hidechat=true&nogui=true';
		widget.data.modalID = "serverstatusmap" + widget.data.serverNumber;

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

module.exports = ServerStatus;
