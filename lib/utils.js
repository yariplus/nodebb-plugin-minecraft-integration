"use strict";

var Utils = { },

	NodeBB = require('./nodebb'),
	Config = require('./config'),

	async = require('async'),
	path  = require('path'),
	fs    = require('fs');

Utils.parseMCFormatCodes = function (name) {
	var spancount = name.split("[§&]").length - 1;
	name = name.replace(/[§&]0/g, "<span style=\"color:#000000;\">");
	name = name.replace(/[§&]1/g, "<span style=\"color:#0000AA;\">");
	name = name.replace(/[§&]2/g, "<span style=\"color:#00AA00;\">");
	name = name.replace(/[§&]3/g, "<span style=\"color:#00AAAA;\">");
	name = name.replace(/[§&]4/g, "<span style=\"color:#AA0000;\">");
	name = name.replace(/[§&]5/g, "<span style=\"color:#AA00AA;\">");
	name = name.replace(/[§&]6/g, "<span style=\"color:#FFAA00;\">");
	name = name.replace(/[§&]7/g, "<span style=\"color:#AAAAAA;\">");
	name = name.replace(/[§&]8/g, "<span style=\"color:#555555;\">");
	name = name.replace(/[§&]9/g, "<span style=\"color:#5555FF;\">");
	name = name.replace(/[§&]a/g, "<span style=\"color:#55FF55;\">");
	name = name.replace(/[§&]b/g, "<span style=\"color:#55FFFF;\">");
	name = name.replace(/[§&]c/g, "<span style=\"color:#FF5555;\">");
	name = name.replace(/[§&]d/g, "<span style=\"color:#FF55FF;\">");
	name = name.replace(/[§&]e/g, "<span style=\"color:#FFFF55;\">");
	name = name.replace(/[§&]f/g, "<span style=\"color:#FFFFFF;\">");
	name = name.replace(/[§&]k/g, "<span>");
	name = name.replace(/[§&]l/g, "<span style=\"font-weight: bold;\">");
	name = name.replace(/[§&]m/g, "<span style=\"text-decoration: line-through;\">");
	name = name.replace(/[§&]n/g, "<span style=\"text-decoration: underline;\">");
	name = name.replace(/[§&]o/g, "<span style=\"font-style: italic;\">");
	name = name.replace(/[§&]r/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#000000;\">");
	name = name.replace(/[§&]/g, "<span>");
	for ( var i = 0; i < spancount; i++ ) name = name + "</span>";
	return name;
};

Utils.formatAddress = function (server) {
	var hostarray = server.address.split(/:/g);
	if (hostarray.length > 1){
		if (hostarray.length === 2){
			server.host = hostarray[0];
			server.port = hostarray[1];
		}else{
			console.log("Configuration error: Invalid host (" + server.address + "). Too many \":\", using default \"0.0.0.0\". ");
			server.host = "0.0.0.0";
		}
	}
	return server;
};

// TODO: Make sure it's really an IP.
Utils.isIP = function (string) {
	return !isNaN(parseInt(string.substring(0,1)));
};

Utils.verifyAddress = function (server, next) {
	server.host = "0.0.0.0";
	server.port = "25565";
	next(null, server);
};

Utils.getPingStampsByRecency = function (minutes, trim, next) {
	var stamps = [], now = Math.round(Date.now()/60000) * 60000, minute;
	for (minute = 0; minute < minutes; minute++) {
		stamps.push(now - (minute*60000));
	}
	next(null, stamps);
};

Utils.getPingStampsByRange = function (start, stop, trim, next) {
	next();
};

Utils.formatWidget = function (widget, callback) {
	if (widget.data.sid === void 0 || isNaN(parseInt(widget.data.sid, 10)) || parseInt(widget.data.sid, 10) < 0) return callback('Invalid sid: ' + widget.data.sid, '');

	// Temp
	widget.data.isServerOnline = true;

	widget.data.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;
	widget.data.url              = Config.getAvatarUrl();

	async.parallel({
		status: async.apply(NodeBB.db.getObject, "mi:server:" + widget.data.sid),
		config: function (next) {
			next(null, Config.settings.get('servers.' + widget.data.sid));
		}
	}, function (err, payload) {
		if (err || !payload.status || !payload.config) return callback(err, '');

		widget.data.status  = payload.status;
		widget.data.config  = payload.config;

		widget.data.name	= widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(payload.config.name) : payload.config.name;
		widget.data.address	= payload.config.address;
		widget.data.motd    = widget.data.parseFormatCodes ? Utils.parseMCFormatCodes(payload.status.motd) : payload.status.motd;

		widget.data.title = widget.data.title.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.title = widget.data.title.replace(/\{\{name\}\}/, widget.data.name);
		widget.data.container = widget.data.container.replace(/\{\{motd\}\}/, widget.data.motd);
		widget.data.container = widget.data.container.replace(/\{\{name\}\}/, widget.data.name);

		callback(null, widget.data);
	});
};

module.exports = Utils;
