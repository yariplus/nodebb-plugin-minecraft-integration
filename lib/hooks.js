"use strict";

var NodeBB = require('./nodebb'),
	Views = require('./views'),
	Hooks = {
		filter: {
			admin: {
				header: {
					build: Views.buildAdminHeader
				}
			},
			widgets: {
				getWidgets: Views.getWidgets
			}
		},
		action: {
		}
	};

module.exports = Hooks;
