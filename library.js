(function() {
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
        rcon = require('simple-rcon'),
        net = require('net'),
        dns = require('dns'),
        bufferpack = require("bufferpack"),
        encoding = require("encoding"),
        varint = require("varint"),
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
        
        // Read from config and defaults
        var htmldata = {};
        htmldata.servername = widget.data.servername || "Minecraft Server";
        htmldata.serverhost = widget.data.serverhost || "0.0.0.0";
        htmldata.serverport = widget.data.serverport || "25565";
        htmldata.queryport = widget.data.queryport;
        htmldata.showip = widget.data.showip;
        htmldata.showportdomain = widget.data.showportdomain;
        htmldata.showportip = widget.data.showportip;
        htmldata.showplayercount = widget.data.showplayercount;
        
        var addCustom = function ( label, text, after ) {
            switch ( after ) {
                case "name":
                    if ( !htmldata.customaftername ) { htmldata.customaftername = []; }
                    htmldata.customaftername[htmldata.customaftername.length] = { label: label, text: text }
                    break;
                case "status":
                default:
                    if ( !htmldata.customafterstatus ) { htmldata.customafterstatus = []; }
                    htmldata.customafterstatus[htmldata.customafterstatus.length] = { label: label, text: text }
                    break;
                case "address":
                    if ( !htmldata.customafteraddress ) { htmldata.customafteraddress = []; }
                    htmldata.customafteraddress[htmldata.customafteraddress.length] = { label: label, text: text }
                    break;
                case "version":
                    if ( !htmldata.customafterversion ) { htmldata.customafterversion = []; }
                    htmldata.customafterversion[htmldata.customafterversion.length] = { label: label, text: text }
                    break;
                case "players":
                    if ( !htmldata.customafterplayers ) { htmldata.customafterplayers = []; }
                    htmldata.customafterplayers[htmldata.customafterplayers.length] = { label: label, text: text }
                    break;
            }
        }
        
        if ( widget.data.usecustom1 ) addCustom( widget.data.custom1label, widget.data.custom1text, widget.data.custom1orderafter );
        if ( widget.data.usecustom2 ) addCustom( widget.data.custom2label, widget.data.custom2text, widget.data.custom2orderafter );
        if ( widget.data.usecustom3 ) addCustom( widget.data.custom3label, widget.data.custom3text, widget.data.custom3orderafter );
        
        htmldata.serveronline = false;
        
        // See if there is a port in the host input
        var hostarray = htmldata.serverhost.split(":");
        if ( hostarray.length == 1 ) {
            // There's no port entered in the host input
        } else if ( hostarray.length == 2 ) {
            htmldata.serverhost = hostarray[0];
            htmldata.serverport = hostarray[1];
        } else {
            console.log("Configuration error: Invalid host. Too many \":\", using default \"0.0.0.0\". ");
            htmldata.serverhost = "0.0.0.0";
        }
        
        // Start by processing DNS/SRV addresses
        resolveHost();
        
        function resolveHost() {
            switch ( htmldata.serverhost.substring(0,1) ) {
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
                    // Using an IP as host.
                    htmldata.showip = false;
                    if ( htmldata.serverport !== "25565" ) htmldata.showportdomain = true;
                    doPing();
                    break;
                default:
                    // Using a domain, check for DNS and SRV record.
                    dns.resolve( "_minecraft._tcp." + htmldata.serverhost, 'SRV', function (err, addresses) {
                        if ( err ) {
                            console.info("SRV lookup failed for " + htmldata.serverhost);
                            dns.resolve4(htmldata.serverhost, function (err, addresses) {
                                if ( err ) {
                                    doCallback(true);
                                }else{
                                    htmldata.serverip = addresses[0];
                                    doPing();
                                }
                            });
                        }else{
                            console.info("Found SRV for " + htmldata.serverhost);
                            htmldata.serverport = addresses[0].port;
                            htmldata.serverip = addresses[0].name;
                            dns.resolve4(htmldata.serverhost, function (err, addresses) {
                                if ( err ) {
                                    doCallback(true);
                                }else{
                                    htmldata.serverip = addresses[0];
                                    doPing();
                                }
                            });
                        }
                    });
            }
        }
        
        function doPing() {
            var pingdata;
            if ( widget.data.uselocalhost ) {
                pingdata = { port: htmldata.serverport, host: "0.0.0.0" };
                console.log("Pinging " + "0.0.0.0" + ":" + pingdata.port);
            }else{
                pingdata = { port: htmldata.serverport, host: htmldata.serverip || htmldata.serverhost };
                console.log("Pinging " + pingdata.host + ":" + pingdata.port);
            }
            
            var socket = net.connect(pingdata, function() {
                var buf = [
                    packData([
                        new Buffer([0x00]),
                        new Buffer(varint.encode(4)),
                        new Buffer(varint.encode(pingdata.host.length)),
                        new Buffer(pingdata.host, "utf8"),
                        bufferpack.pack("H", pingdata.port),
                        new Buffer(varint.encode(1))
                    ]),
                    packData(new Buffer([0x00]))
                ]
                
                //console.info("Writing request.");
                
                socket.write(buf[0]);
                socket.write(buf[1]);
            });
            
            socket.setTimeout(1000, function () {
                console.log("Server List Ping failed when connecting to " + htmldata.serverhost + ":" + htmldata.serverport);
                socket.end();
                
                doCallback(true);
            });
            
            var dataLength = -1, currentLength = 0, chunks = [];
            socket.on("data", function(data) {
                console.log("Server List Ping received for " + htmldata.serverhost + ":" + htmldata.serverport);
                try {
                    if(dataLength < 0) {
                        dataLength = varint.decode(data);
                        data = data.slice(varint.decode.bytes);
                        
                        if(data[0] != 0x00) {
                            callback(new Error("Invalid handshake."));
                            client.destroy();
                            return;
                        }
                        
                        data = data.slice(1);
                        currentLength++;
                    }
                    
                    currentLength += data.length;
                    chunks.push(data);

                    if(currentLength >= dataLength) {
                        data = Buffer.concat(chunks);
                        var strLen = varint.decode(data);
                        var strLenOffset = varint.decode.bytes;
                        var resp = JSON.parse(data.toString("utf8", strLenOffset));
                        
                        htmldata.protocolVersion = resp.version.protocol;
                        var version = resp.version.name.split(" ");
                        htmldata.version = version[version.length-1];
                        
                        if ( widget.data.shownamemotd ) {
                            htmldata.servername = htmldata.servername + " ~" + resp.description + "~";
                        } else if ( widget.data.showname ) {
                            htmldata.servername = resp.description;
                        }
                        
                        htmldata.onlineplayers = resp.players.online;
                        htmldata.maxplayers = resp.players.max;
                        
                        if(resp.players.sample) htmldata.players = resp.players.sample;
                        if(resp.favicon) htmldata.icon = resp.favicon;
                        
                        socket.end();
                        
                        if ( htmldata.players ) {
                            findUsers(0);
                        }else{
                            queryServer();
                        }
                    }
                } catch(err) {
                    doCallback(true);
                    socket.destroy();
                }
            });

            socket.on('error', function(e) {
                console.log(e);
                doCallback(true);
            });
        };
        
        function packData(raw) {
            if ( raw instanceof Array ) raw = Buffer.concat(raw);
            return Buffer.concat( [ new Buffer(varint.encode(raw.length)), raw ] );
        }
        
        function queryServer() {
            var query;
            if ( !htmldata.queryport ) htmldata.queryport = htmldata.serverport
            if ( widget.data.uselocalhost ) {
                query = new mcquery("0.0.0.0", htmldata.queryport);
            }else{
                query = new mcquery(htmldata.serverip || htmldata.serverhost, htmldata.queryport);
            }
            
            query.connect(function (err) {
                console.log("Doing query.connect for " + ( htmldata.serverip || htmldata.serverhost ) + ":" + htmldata.queryport);
                if (err) {
                    console.log("query.connect failed for " + ( htmldata.serverip || htmldata.serverhost ) + ":" + htmldata.queryport);
                    doCallback(true);
                } else {
                    htmldata.queryonline = true;
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
                    console.log("query.fullStatBack failed for " + htmldata.serverhost);
                    doCallback(true);
                } else {
                    // Convert player objects to the way NodeBB likes.
                    htmldata.players = [];
                    var index;
                    for (index = 0; index < stat.player_.length; ++index) {
                        htmldata.players[htmldata.players.length] = { name: stat.player_[index] };
                    }
                    
                    // Use queried hostname if localhost.
                    if ( htmldata.serverhost == "0.0.0.0" || htmldata.serverhost == "127.0.0.1" || htmldata.serverhost == "localhost" ) {
                        htmldata.serverhost = stat.hostip;
                        if ( stat.hostport != "25565" ) {
                            htmldata.showportdomain = true;
                            htmldata.serverport = stat.hostport;
                        }
                    }
                    
                    shouldWeClose();
                    findUsers(0);
                }
            }

            function shouldWeClose() {
                //have we got all answers
                if (query.outstandingRequests() === 0) {
                    query.close();
                }
            }
        }
        
        var findUsers = function(index) {
            if ( htmldata.players.length != index ) {
                user.exists(htmldata.players[index].name, function(err, exists) {
                    if ( err ) {
                        console.log("Error finding user: " + err);
                    } else if ( exists ) {
                        htmldata.players[index].linkprofile = true;
                    } else {
                        // NOOP
                    }
                    index++;
                    findUsers(index);
                });
            } else {
                doCallback();
            }
        }
        
        function doCallback ( offline ) {
            if ( !offline ) htmldata.serveronline = true;
            
            if ( widget.data.parseformatcodes ) {
                var spancount = htmldata.servername.split("§").length - 1;
                htmldata.servername = htmldata.servername.replace("§0", "<span style=\"color:#000000;\">");
                htmldata.servername = htmldata.servername.replace("§1", "<span style=\"color:#0000AA;\">");
                htmldata.servername = htmldata.servername.replace("§2", "<span style=\"color:#00AA00;\">");
                htmldata.servername = htmldata.servername.replace("§3", "<span style=\"color:#00AAAA;\">");
                htmldata.servername = htmldata.servername.replace("§4", "<span style=\"color:#AA0000;\">");
                htmldata.servername = htmldata.servername.replace("§5", "<span style=\"color:#AA00AA;\">");
                htmldata.servername = htmldata.servername.replace("§6", "<span style=\"color:#FFAA00;\">");
                htmldata.servername = htmldata.servername.replace("§7", "<span style=\"color:#AAAAAA;\">");
                htmldata.servername = htmldata.servername.replace("§8", "<span style=\"color:#555555;\">");
                htmldata.servername = htmldata.servername.replace("§9", "<span style=\"color:#5555FF;\">");
                htmldata.servername = htmldata.servername.replace("§a", "<span style=\"color:#55FF55;\">");
                htmldata.servername = htmldata.servername.replace("§b", "<span style=\"color:#55FFFF;\">");
                htmldata.servername = htmldata.servername.replace("§c", "<span style=\"color:#FF5555;\">");
                htmldata.servername = htmldata.servername.replace("§d", "<span style=\"color:#FF55FF;\">");
                htmldata.servername = htmldata.servername.replace("§e", "<span style=\"color:#FFFF55;\">");
                htmldata.servername = htmldata.servername.replace("§f", "<span style=\"color:#FFFFFF;\">");
                htmldata.servername = htmldata.servername.replace("§o", "<span style=\"font-style:italic;\">");
                for ( var i = 0; i < spancount; i++ ) htmldata.servername = htmldata.servername + "</span>";
            }
            
            htmldata.queryonline = true;
            html = templates.parse(html, htmldata);
            callback(null, html);
        }
    };

	Widget.defineWidgets = function(widgets, callback) {
		widgets = widgets.concat([
			{
				widget: "serverstatus",
				name: "Minecraft Server Status 1.7+",
				description: "Lists information on a Minecraft server.",
				content: Widget.templates['admin/adminserverstatus.tpl']
			}
		]);

		callback(null, widgets);
	};

	module.exports = Widget;
})();
