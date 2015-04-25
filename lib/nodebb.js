"use strict";

(function(parent){
	
var NodeBB = {
	SocketAdmin	: parent.require('./socket.io/admin'),
	Meta		: parent.require('./meta'),
	Settings	: parent.require('./settings'),
	User		: parent.require('./user'),
	Plugins		: parent.require('./plugins'),
	db			: parent.require('./database'),
	templates	: parent.require('templates.js'),
	translator	: parent.require('../public/src/modules/translator')
};

	module.exports = NodeBB;

}(module.parent.parent));
