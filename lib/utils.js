"use strict";

var	NodeBB = require('./nodebb'),

	async   = require('async'),
	path    = require('path'),
	fs      = require('fs'),
	request = require('request'),
	crypto  = require('crypto'),

	Utils = module.exports = { };

Utils.parseMCFormatCodes = Utils.parseFormatCodes = function (text) {
	var spancount = text.split(/(\\u00A7|[§&])/g).length - 1;
	text = text.replace(/(\\u00A7|[§&])0/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#333333;\">");
	text = text.replace(/(\\u00A7|[§&])1/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#0000AA;\">");
	text = text.replace(/(\\u00A7|[§&])2/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#00AA00;\">");
	text = text.replace(/(\\u00A7|[§&])3/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#00AAAA;\">");
	text = text.replace(/(\\u00A7|[§&])4/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#AA0000;\">");
	text = text.replace(/(\\u00A7|[§&])5/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#AA00AA;\">");
	text = text.replace(/(\\u00A7|[§&])6/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#FFAA00;\">");
	text = text.replace(/(\\u00A7|[§&])7/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#AAAAAA;\">");
	text = text.replace(/(\\u00A7|[§&])8/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#555555;\">");
	text = text.replace(/(\\u00A7|[§&])9/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#5555FF;\">");
	text = text.replace(/(\\u00A7|[§&])a/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#55FF55;\">");
	text = text.replace(/(\\u00A7|[§&])b/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#55FFFF;\">");
	text = text.replace(/(\\u00A7|[§&])c/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#FF5555;\">");
	text = text.replace(/(\\u00A7|[§&])d/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#FF55FF;\">");
	text = text.replace(/(\\u00A7|[§&])e/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#FFFF55;\">");
	text = text.replace(/(\\u00A7|[§&])f/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#FFFFFF;\">");
	text = text.replace(/(\\u00A7|[§&])k/g, "<span>"); // TODO: Magic character.
	text = text.replace(/(\\u00A7|[§&])l/g, "<span style=\"font-weight: bold;\">");
	text = text.replace(/(\\u00A7|[§&])m/g, "<span style=\"text-decoration: line-through;\">");
	text = text.replace(/(\\u00A7|[§&])n/g, "<span style=\"text-decoration: underline;\">");
	text = text.replace(/(\\u00A7|[§&])o/g, "<span style=\"font-style: italic;\">");
	text = text.replace(/(\\u00A7|[§&])r/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#333333;\">");
	text = text.replace(/(\\u00A7|[§&])/g, "<span>");
	for ( var i = 0; i < spancount; i++ ) text = text + "</span>";
	return text;
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

Utils.getPlayerUUID = function (name, next) {
	console.log("Fetching UUID for " + name);
	request({url: 'https://api.mojang.com/users/profiles/minecraft/' + name, json: true}, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			next(null, body.id);
		}else{
			next(err || new Error("Bad Request: " + 'https://api.mojang.com/users/profiles/minecraft/' + name));
		}
	});
};

Utils.getPlayerNameUsingUUID = function (id, next) {
	console.log("Fetching Name for " + id);
	request({url: 'https://api.mojang.com/user/profiles/' + id + '/names', json: true}, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			next(null, body[body.length-1].name);
		}else{
			next(err || new Error("Bad Request: " + 'https://api.mojang.com/user/profiles/' + id + '/names'));
		}
	});
};

Utils.trimUUID = function (uuid) {
	return uuid.replace(/-/g, '');
};

Utils.untrimUUID = function (uuid) {
	if (uuid.match('-')) return uuid;
	return uuid.slice(0,8) + '-' + uuid.slice(8, 12) + '-' + uuid.slice(12, 16) + '-' + uuid.slice(16, 20) + '-' + uuid.slice(20, 32);
};

Utils.getKey = function (data, next) {
	if (next) {
		crypto.randomBytes(48, function(err, buf) {
			next(null, {key: buf.toString('base64').replace(/\//g, '=')});
		});
	} else {
		return crypto.randomBytes(48).toString('base64').replace(/\//g, '=');
	}
};
