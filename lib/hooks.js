"use strict";

var NodeBB = require('./nodebb'),
	Views = require('./views'),
	Hooks = {
		filter: {
			widgets: {
				getWidgets: Views.getWidgets
			}
		},
		action: {
		}
	};

module.exports = Hooks;
