"use strict";

var ServerStatus = module.exports = { },

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

	data.isServerOnline = !!parseInt(data.status.isServerOnline, 10);
	data.pluginList     = data.status.pluginList;

	data.showVersion = data.version ? true : false;

	if (data.hidePluginList) data.pluginList = [ ];

	data.mapshow      = data.mapshow == "on" ? true : false;
	data.mapshowlarge = data.mapshowlarge == "on" ? true : false;

	data.uri = data.mapuri || 'http://' + data.config.address + ':8123/';

	if (data.mapplugin === "overviewer") {
		data.uri += (data.mapx ? data.mapx : 0) + '/';
		data.uri += '64/';
		data.uri += (data.mapz ? data.mapz : 0) + '/';
		data.uri += (data.mapzoom ? data.mapzoom : -2) + '/';
		data.uri += '0/0/';
	}else{
		data.uri += '?nopanel=true&hidechat=true&nogui=true';
		data.uri += (data.mapx ? '&x=' + data.mapx : '');
		data.uri += (data.mapz ? '&z=' + data.mapz : '');
		data.uri += (data.mapzoom ? '&zoom=' + data.mapzoom : '');
	}

	data.modalID = "serverstatusmap" + data.sid;

	callback(null, data);

};
