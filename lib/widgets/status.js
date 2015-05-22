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

function parsePlayerList(list) {
	var players = [ ];

	for (var i in list) {
		players.push({name: list[i]});
	}

	return players;
}

ServerStatus.render = function (widget, callback) {
	if (isNaN(parseInt(widget.data.sid)) || parseInt(widget.data.sid) < 0) return callback('Invalid sid: ' + widget.data.sid, '');

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

	NodeBB.db.getObject('mi:server:' + widget.data.sid, function (err, status) {
		if (err) return callback(err, '');

		try {
			widget.data.players    = parsePlayerList(JSON.parse(status.players));
			widget.data.pluginList = JSON.parse(status.pluginList);
			widget.data.hasPlugins = widget.data.pluginList !== void 0;
		}catch (err) {
			widget.data.players    = [ ];
			widget.data.pluginList = [ ];
			widget.data.hasPlugins = false;
		}

		widget.data.host          = status.host;
		widget.data.port          = status.port;
		widget.data.version       = status.version;
		widget.data.motd          = widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(status.motd) : status.motd;
		widget.data.maxPlayers    = status.maxPlayers;
		widget.data.onlinePlayers = status.onlinePlayers;

		widget.data.showPlayers = widget.data.isServerOnline && widget.data.players.length > 0 ? true : false;
		widget.data.showVersion = widget.data.isServerOnline && widget.data.version ? true : false;

		if (widget.data.hidePluginList) widget.data.pluginList = [ ];

		// Temp
		// if (!widget.data.version && widget.data.isServerOnline) {
			// widget.data.isServerOnline = false;
			// widget.data.isServerRestarting = true;
		// }
		if (!widget.data.isServerOnline && !widget.data.isServerRestarting) widget.data.isServerOffline = true;

		if (widget.data.showPlayers) {
			var avatarCDN = config.avatarCDN ? config.avatarCDN : "cravatar";
			widget.data.avatarSize = config.avatarSize ? config.avatarSize : "40";
			widget.data.avatarSize = config.avatarCDN === 'signaturecraft' ? config.avatarSize / 8 : config.avatarSize;
			widget.data.avatarStyle = config.avatarStyle ? config.avatarStyle : "flat";
			switch (avatarCDN) {
				default:
				case "minotar":
					widget.data.avatarCDNminotar = true;
					break;
				case "signaturecraft":
					widget.data.avatarCDNsignaturecraft = true;
					break;
				case "cravatar":
					widget.data.avatarCDNcravatar = true;
					break;
			}

			if (widget.data.showGlory) {
				if (!widget.data.gloryStart) widget.data.gloryStart = "000000";
				if (!widget.data.gloryEnd) widget.data.gloryEnd = "000000";
				var gloryStart = [ parseInt(widget.data.gloryStart.substring(0,2),16), parseInt(widget.data.gloryStart.substring(2,4),16), parseInt(widget.data.gloryStart.substring(4,6),16) ];
				var gloryEnd = [ parseInt(widget.data.gloryEnd.substring(0,2),16), parseInt(widget.data.gloryEnd.substring(2,4),16), parseInt(widget.data.gloryEnd.substring(4,6),16) ];
				var gloryStep =  [ Math.round( (gloryEnd[0]-gloryStart[0]) / widget.data.onlinePlayers ), Math.round( (gloryEnd[1]-gloryStart[1]) / widget.data.onlinePlayers ), Math.round( (gloryEnd[2]-gloryStart[2]) / widget.data.onlinePlayers ) ];

				for (var i = 0; i < widget.data.players.length; i++) {
					widget.data.players[i].glory = "#" + ("00" + (gloryStart[0] + gloryStep[0] * i).toString(16)).substr(-2) + ("00" + (gloryStart[1] + gloryStep[1] * i).toString(16)).substr(-2) + ("00" + (gloryStart[2] + gloryStep[2] * i).toString(16)).substr(-2);
				}
			}

			widget.data.avatarMargin = 5;
		}

		if (!widget.data.mapURI) widget.data.mapURI = 'http://' + status.host + ':8123/';
		widget.data.minimapURI = widget.data.mapURI + '?nopanel=true&hidechat=true&nogui=true';
		widget.data.modalID = "serverstatusmap" + widget.data.serverNumber;

		widget.data.title = widget.data.title.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.title = widget.data.title.replace(/\{\{name\}\}/, widget.data.name);
		widget.data.container = widget.data.container.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.container = widget.data.container.replace(/\{\{name\}\}/, widget.data.name);

		console.log(JSON.stringify(widget.data));

		// ?????
		if (!NodeBB.app) return callback('?????', '');

		NodeBB.app.render('widgets/status', widget.data, function(err, html) {
			NodeBB.translator.translate(html, function(translatedHTML) {
				callback(err, translatedHTML);
			});
		});
	});
};

module.exports = ServerStatus;
