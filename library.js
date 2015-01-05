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
        net = require('net'),
        dns = require('dns'),
        varint = require("varint"),
        bufferpack = require("bufferpack"),
        encoding = require("encoding"),
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
        
        var serverhost = "0.0.0.0";
        var serverport = widget.data.serverport || "25565";
        if ( widget.data.serverhost ) {
            var hostarray = widget.data.serverhost.split(":");
            if ( hostarray.length == 1 ) {
                serverhost = hostarray[0];
            } else if ( hostarray.length == 2 ) {
                serverhost = hostarray[0];
                serverport = hostarray[1];
            } else {
                console.log("Configuration error: Invalid host. Too many \":\", using default \"0.0.0.0\". ");
            }
        }
        
        var queryport = widget.data.queryport || "25565";
        
        pingServer();
        
        function resolveHost() {
            switch ( serverhost.substring(0,1) ) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    break;
                    // Using an IP, do ping.
                    pingServer();
                default:
                    // Using a domain, check for SRV record.
                    dns.resolve( "_minecraft._tcp." + serverhost, 'SRV', function (err, addresses) {
                        if ( err ) {
                            console.info("SRV lookup failed for " + serverhost);
                        }else{
                            console.info("SRV lookup for " + serverhost);
                            console.info(addresses);
                        }
                    });
                    pingServer();
            }
        }
        
        function pingServer() {
            var pingdata;
            if ( widget.data.uselocalhost ) {
                    pingdata = { port: serverport, host: "0.0.0.0" };
                    console.log("Pinging " + "0.0.0.0" + ":" + serverport);
                }else{
                    pingdata = { port: serverport, host: serverhost };
                    console.log("Pinging " + serverhost + ":" + serverport);
            }
            var socket = net.connect(pingdata, function() {
                    var buf = new Buffer(2);
                    buf[0] = 254;
                    buf[1] = 1;
                    socket.write(buf);
            });
                
            socket.setTimeout(1000, function () {
                console.log("mc-ping failed when connecting to " + serverhost + ":" + serverport);
                socket.end();
                
                var data = {};
                    
                data.serveronline = false;
                data.hostname = widget.data.hostname || "Unknown Server";
                
                data.serverhost = serverhost;
                data.hostip = serverport;
                data.showip = false;
                data.showportdomain = true;
                data.showportip = false;
                
                html = templates.parse(html, data);
                callback(null, html);
            });
            
            socket.on("data", function(data) {
                var newdata = [];
                if (data[0] == 255) { // Server's magic response
                    var iszero = false,
                        y = 0;
                    for (var i =  1; i < data.length; i++) {
                        if (data[i] === 0 && iszero) { // Separator
                            if (newdata[y].length > 0)
                                y++;
                            newdata[y] = "";
                            continue;
                        }
                        if (newdata[y] === undefined) {
                            newdata[y] = "";
                        }
                        if (data[i] !== 0) {
                            iszero = false;
                            var newchar = String.fromCharCode(data[i]);
                            if (newchar !== undefined) {
                                newdata[y] = newdata[y] + newchar;
                            }
                        } else {
                            iszero = true;
                        }
                    }
                    if (callback !== undefined) {
                        data = {};
                        data.protocol_version = newdata[1];
                        data.minecraft_version = newdata[2];
                        data.server_name = newdata[3];
                        data.num_players = newdata[4];
                        data.max_players = newdata[5];
                        //callback(null, data);
                        console.log("GOT DATA");
                        console.log(data);
                        queryServer();
                    }
                } else {
                    console.log("Unexpected data from server");
                }
                socket.end();
            });

            socket.once('error', function(e) {
                if (callback !== undefined) {
                    // ???
                }
            });
        }
        
        function queryServer() {
            var query;
            if ( widget.data.uselocalhost ) {
                query = new mcquery("0.0.0.0", queryport);
            }else{
                query = new mcquery(serverhost, queryport);
            }
        
            var queryonline = false;
            query.connect(function (err) {
                console.log("Doing query.connect for " + serverhost + ":" + queryport);
                if (err) {
                    console.log("query.connect failed for " + serverhost + ":" + queryport);
                    parseCallback(true);
                } else {
                    queryonline = true;
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
                    data = {};
                    data.serveronline = false;
                    data.hostname = widget.data.hostname || "Unknown Server";
                    
                    data.serverhost = serverhost;
                    data.hostip = serverport;
                    data.showip = false;
                    data.showportdomain = true;
                    data.showportip = false;
                }else{                    
                    // Convert player objects to the way NodeBB likes.
                    data.players = [];
                    var index;
                    for (index = 0; index < data.player_.length; ++index) {
                        data.players[data.players.length] = { name: data.player_[index] };
                    }
                    
                    data.serveronline = true;
                    data.hostname = data.hostname || widget.data.hostname || "Unknown";
                    
                    data.serverhost = widget.data.serverhost;
                    data.showip = widget.data.showip;
                    data.showportdomain = widget.data.showportdomain;
                    data.showportip = widget.data.showportip;
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
                
                if ( data.serverhost == "0.0.0.0" || data.serverhost == "127.0.0.1" || data.serverhost == "localhost" ) {
                    data.showip = false;
                    data.serverhost = data.hostip;
                    if ( !data.showportdomain && data.showportip ) {
                        data.showportdomain = true;
                    }
                }
                
                data.queryonline = true;
                html = templates.parse(html, data);
                callback(null, html);
            }
        }
	};

	Widget.defineWidgets = function(widgets, callback) {
		widgets = widgets.concat([
			{
				widget: "serverstatus",
				name: "Minecraft Server Status",
				description: "Lists information on a Minecraft server.",
				content: Widget.templates['admin/adminserverstatus.tpl']
			}
		]);

		callback(null, widgets);
	};

	module.exports = Widget;
}(module));