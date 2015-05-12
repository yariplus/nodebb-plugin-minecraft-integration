"use strict";

(function(parent){

	var NodeBB = {
		SocketAdmin	: parent.require('./socket.io/admin'),
		Meta		: parent.require('./meta'),
		Settings	: parent.require('./settings'),
		User		: parent.require('./user'),
		Plugins		: parent.require('./plugins'),
		db			: parent.require('./database'),
		pubsub		: parent.require('./pubsub'),
		tjs			: parent.require('templates.js')
	};

	try {
		// <=0.6.x
		NodeBB.translator = parent.require('../public/src/translator');
	}catch(e){
		// 0.7.x
		NodeBB.translator = parent.require('../public/src/modules/translator');
	}

	module.exports = NodeBB;

}(module.parent.parent));
