(function(module) {
	"use strict";

	var async = require('async'),
		fs = require('fs'),
		path = require('path'),
		db = module.parent.require('./database'),
		categories = module.parent.require('./categories'),
		user = module.parent.require('./user'),
		plugins = module.parent.require('./plugins'),
		topics = module.parent.require('./topics'),
		posts = module.parent.require('./posts'),
		translator = module.parent.require('../public/src/translator'),
		templates = module.parent.require('templates.js'),
		websockets = module.parent.require('./socket.io'),
        mcquery = require('mcquery'),
        srv = require('dns-srv'),
        rcon = require('simple-rcon'),
		app;

	var Widget = {
		templates: {}
	};

	Widget.init = function(params, callback) {
		app = params.app;

		var templatesToLoad = [
			"serverstatus.tpl",
            "console.tpl",
			"admin/adminserverstatus.tpl",
            "admin/adminconsole.tpl"
		];

		function loadTemplate(template, next) {
			fs.readFile(path.resolve(__dirname, './public/templates/' + template), function (err, data) {
				if (err) {
					console.log(err.message);
					return next(err);
				}
				Widget.templates[template] = data.toString();
				next(null);
			});
		}

		async.each(templatesToLoad, loadTemplate);

		callback();
	};

	Widget.renderServerStatus = function(widget, callback) {
		var html = Widget.templates['serverstatus.tpl'], cid;
        
		if (widget.data.cid) {
			cid = widget.data.cid;
		} else {
			var match = widget.area.url.match('[0-9]+');
			cid = match ? match[0] : 1;
		}
        
        var serverhost = widget.data.serverhost || "0.0.0.0";
        var queryport = widget.data.queryport || "25565";
        
        var query;
        if ( widget.data.uselocal == true ) {
            query = new mcquery("0.0.0.0", queryport);
        }else{
            query = new mcquery(serverhost, queryport);
        }

        query.connect(function (err) {
            console.log("Doing query.connect " + serverhost);
            if (err) {
                console.log("query.connect failed for " + serverhost);
                parseCallback(true);
            } else {
                query.full_stat(fullStatBack);
                //query.basic_stat(basicStatBack);
            }
        });
        
        function basicStatBack(err, stat) {
            if (err) {
                console.error(err);
            }
            callback(null, stat );
            shouldWeClose();
        }

        function fullStatBack(err, stat) {
            console.log("Doing query.fullStatBack");
            if (err) {
                console.log("query.fullStatBack failed for " + serverhost);
                parseCallback(true);
            } else {
                parseCallback(null, stat);
                shouldWeClose();
            }
        }

        function shouldWeClose() {
            //have we got all answers
            if (query.outstandingRequests() === 0) {
                query.close();
            }
        }
        
        function parseCallback (err, data) {
            if (err) {
                data = { serveronline: false, hostname: widget.data.hostname || "Unknown" };
            }else{                    
                // Convert objects to the way NodeBB likes.
                data.players = [];
                var index;
                for (index = 0; index < data.player_.length; ++index) {
                    data.players[data.players.length] = { name: data.player_[index] };
                }
                
                data.serveronline = true;
                data.hostname = data.hostname || widget.data.hostname || "Unknown";
            }
            
            if ( widget.data.parseformatcodes ) {
                data.hostname = data.hostname.replace("�0", "<span style=\"color:#000000;\">");
                data.hostname = data.hostname.replace("�1", "<span style=\"color:#0000AA;\">");
                data.hostname = data.hostname.replace("�2", "<span style=\"color:#00AA00;\">");
                data.hostname = data.hostname.replace("�3", "<span style=\"color:#00AAAA;\">");
                data.hostname = data.hostname.replace("�4", "<span style=\"color:#AA0000;\">");
                data.hostname = data.hostname.replace("�5", "<span style=\"color:#AA00AA;\">");
                data.hostname = data.hostname.replace("�6", "<span style=\"color:#FFAA00;\">");
                data.hostname = data.hostname.replace("�7", "<span style=\"color:#AAAAAA;\">");
                data.hostname = data.hostname.replace("�8", "<span style=\"color:#555555;\">");
                data.hostname = data.hostname.replace("�9", "<span style=\"color:#5555FF;\">");
                data.hostname = data.hostname.replace("�a", "<span style=\"color:#55FF55;\">");
                data.hostname = data.hostname.replace("�b", "<span style=\"color:#55FFFF;\">");
                data.hostname = data.hostname.replace("�c", "<span style=\"color:#FF5555;\">");
                data.hostname = data.hostname.replace("�d", "<span style=\"color:#FF55FF;\">");
                data.hostname = data.hostname.replace("�e", "<span style=\"color:#FFFF55;\">");
                data.hostname = data.hostname.replace("�f", "<span style=\"color:#FFFFFF;\">");
                data.hostname = data.hostname.replace("�o", "<span style=\"font-style:italic;\">");
                data.hostname = data.hostname + "</span></span></span></span></span></span></span></span></span>";
            }

            data.serverhost = widget.data.serverhost;
            data.showip = widget.data.showip;
            data.showportdomain = widget.data.showportdomain;
            data.showportip = widget.data.showportip;
            
            //console.log(serverdata);
            html = templates.parse(html, data);
            callback(null, html);
        }
	};

	Widget.defineWidgets = function(widgets, callback) {
		widgets = widgets.concat([
			{
				widget: "serverstatus",
				name: "Minecraft Server Status",
				description: "Lists information on a Minecraft server.",
				content: Widget.templates['admin/serverstatus.tpl']
			}
		]);

		callback(null, widgets);
	};

	module.exports = Widget;
}(module));