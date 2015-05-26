"use strict";

var NodeBB = require('./nodebb'),
	Config = require('./config');

module.exports = {
	init: function () {
		NodeBB.router.get('/api/minecraft-integration/server/:sid', function (req, res, next) {
			Config.getServerStatus(req.params.sid, function (data) {
				res.json(data);
			});
		});

		NodeBB.router.get('/api/minecraft-integration/server/:sid/pings/:last', function (req, res, next) {
			Config.getRecentPings(req.params.sid, req.params.last, function (data) {
				res.json(data);
			});
		});
	}
};
