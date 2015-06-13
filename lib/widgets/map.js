"use strict";

var Map = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

Map.render = function (data, callback) {
	data.showfull         = data.showfull == "on" ? true : false;

	data.uri = data.uri || 'http://' + data.status.host + ':8123/';

	if (data.type === "overviewer") {
		data.uri += (data.x ? data.x : 0) + '/';
		data.uri += '64/';
		data.uri += (data.z ? data.z : 0) + '/';
		data.uri += (data.zoom ? data.zoom : -2) + '/';
		data.uri += '0/0/';
	}else{
		data.uri += '?nopanel=true&hidechat=true&nogui=true';
		data.uri += (data.x ? '&x=' + data.x : '');
		data.uri += (data.z ? '&z=' + data.z : '');
		data.uri += (data.zoom ? '&zoom=' + data.zoom : '');
	}

	data.modalID = "serverstatusmap" + data.sid;

	callback(null, data);
};

module.exports = Map;
