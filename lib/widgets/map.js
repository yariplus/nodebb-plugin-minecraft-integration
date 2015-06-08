"use strict";

var Map = { },

	NodeBB = require('../nodebb'),
	Config = require('../config'),
	Utils = require('../utils');

Map.render = function (data, callback) {
	data.showfull         = data.showfull == "on" ? true : false;

	data.uri = data.uri || 'http://' + data.status.host + ':8123/';
	data.uri += '?nopanel=true&hidechat=true&nogui=true';

	data.modalID = "serverstatusmap" + data.sid;

	callback(null, data);
};

module.exports = Map;
