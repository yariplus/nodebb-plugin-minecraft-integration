"use strict";

var Map = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

Map.render = function (data, callback) {
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

module.exports = Map;
