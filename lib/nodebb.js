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

	NodeBB.init = function () {
		function render(req, res, next) {
			res.render('admin/plugins/minecraft-integration', { });
		}

		NodeBB.router.get('/admin/plugins/minecraft-integration', NodeBB.middleware.admin.buildHeader, render);
		NodeBB.router.get('/api/admin/plugins/minecraft-integration', render);
		NodeBB.router.get('/minecraft-integration/config', function (req, res) {
			res.status(200);
		});
	};

	module.exports = NodeBB;

}(module.parent.parent.parent));
