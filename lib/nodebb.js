"use strict";

(function(nbb){

	var NodeBB = {
		SocketIO      : nbb.require('./socket.io'),
		SocketAdmin   : nbb.require('./socket.io/admin'),
		SocketPlugins : nbb.require('./socket.io/plugins'),
		Meta          : nbb.require('./meta'),
		Settings      : nbb.require('./settings'),
		User          : nbb.require('./user'),
		Plugins       : nbb.require('./plugins'),
		db            : nbb.require('./database'),
		pubsub        : nbb.require('./pubsub'),
		tjs           : nbb.require('templates.js')
	};

	try {
		// <=0.6.x
		NodeBB.translator = nbb.require('../public/src/translator');
	}catch(e){
		// 0.7.x
		NodeBB.translator = nbb.require('../public/src/modules/translator');
	}

	module.exports = NodeBB;

}(module.parent.parent.parent));
