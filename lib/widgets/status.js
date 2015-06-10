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

ServerStatus.render = function (data, callback) {
	data.showPlayerCount  = data.showPlayerCount == "on" ? true : false;
	data.showAvatars      = data.showAvatars == "on" ? true : false;
	data.showMOTD         = data.showMOTD == "on" ? true : false;
	data.hidePluginList   = data.hidePluginList == "on" ? true : false;
	data.showIP           = data.showIP == "on" ? true : false;
	data.showModalMap     = data.showModalMap == "on" ? true : false;

	data.host          = data.status.host;
	data.port          = data.status.port;
	data.version       = data.status.version;
	data.maxPlayers    = data.status.maxPlayers;
	data.onlinePlayers = data.status.onlinePlayers;

	data.showVersion = data.isServerOnline && data.version ? true : false;

	if (data.hidePluginList) data.pluginList = [ ];

	if (!data.mapURI) data.mapURI = 'http://' + data.host + ':8123/';
	data.minimapURI = data.mapURI + '?nopanel=true&hidechat=true&nogui=true';
	data.modalID = "serverstatusmap" + data.sid;

	callback(null, data);
};

module.exports = ServerStatus;
