"use strict";

var TopList = module.exports = { },

	NodeBB  = require('../nodebb'),
	Backend = require('../backend'),
	Utils   = require('../utils'),

	async = require('async');

TopList.render = function (data, callback)
{
	data.services = [];

	Utils.voteServices.forEach(function (serviceData) {
		if (data['votelink-' + serviceData.service])
		{
			data.services.push({service: serviceData.service, name: serviceData.name, url: data['votelink-' + serviceData.service]});
		}
	});

	callback(null, data);
};
