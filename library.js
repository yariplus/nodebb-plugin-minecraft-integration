(function() {
    "use strict";
    
	var async = require('async'),
		fs = require('fs'),
		path = require('path'),
		db = module.parent.require('./database'),
		meta = module.parent.require('./meta'),
		categories = module.parent.require('./categories'),
		user = module.parent.require('./user'),
		plugins = module.parent.require('./plugins'),
		templates = module.parent.require('templates.js'),
		websockets = module.parent.require('./socket.io'),
        mcquery = require('mcquery'),
        rcon = require('simple-rcon'),
        net = require('net'),
        dns = require('dns'),
        bufferpack = require("bufferpack"),
        encoding = require("encoding"),
        varint = require("varint"),
        mcping = require("mc-ping"),
		app,
        updateServers = function() {
            db.get("MCWES1-Temp", function(err, data) {
                if (err) {
                    console.log(err);
                }else{
                    console.log("data is " + data);
                    db.set("MCWES1-Temp", data + 1, function(err) {
                        if (err) console.log(err);
                        setTimeout(updateServers, 1000);
                    });
                }
            });
        },
        logServers = function() {
            for (var serverNumber = 1; serverNumber <= 10; serverNumber++) {
                logServer("MCWES" + serverNumber);
            }
            setTimeout(logServers, 5000);
        },
        logServer = function(serverKey) {
            db.exists(serverKey, function(err, isExtant) {
                if (err) {
                    console.log(err);
                }else{
                    if (!isExtant) {
                        
                    }else{
                        console.log("Found " +  serverKey);
                        db.get(serverKey, function(err, data) {
                            if (err) {
                                console.log(err);
                            }else{
                                //console.log(JSON.parse(data));
                            }
                        });
                    }
                }
            });
        },
        storeServerData = function(serverNumber, serverData) {
            db.set("MCWES" + serverNumber, serverData, function(err){
                if (err) console.log(err);
            });
        },
        MinecraftWidgets = {
            config: {},
			onLoad: function(params, callback) {
				function render(req, res, next) {
					res.render('admin/plugins/minecraft-essentials', {
						themes: MinecraftWidgets.themes
					});
				}

				params.router.get('/admin/plugins/minecraft-essentials', params.middleware.admin.buildHeader, render);
				params.router.get('/api/admin/plugins/minecraft-essentials', render);
				params.router.get('/minecraft-essentials/config', function(req, res) {
					res.status(200).json({
						highlight: MinecraftWidgets.highlight ? 1 : 0,
						theme: MinecraftWidgets.config.highlightTheme || 'railscasts.css'
					});
				});

				MinecraftWidgets.init(params);
				MinecraftWidgets.loadThemes();
				callback();
			},
			init: function(params) {
                // Load saved config
				var	_self = this,
					fields = [
						'testData'
					],
					defaults = {
						'server1serverConfigName': 'Server One',
                        'server1serverName': 'Server One',
                        'server1serverHost': '0.0.0.0',
                        'server1serverIP': '0.0.0.0',
                        'server1serverPort': '25565',
                        'server1queryPort': '25565',
                        'server1rconPort': '25575',
                        'server1rconPass': 'password',
                        'server1widgetPass': 'password'
					};
                
                _self.servers = [];

				meta.settings.get('minecraft-essentials', function(err, options) {
					for(var field in defaults) {
						// If not set in config (nil)
						if (!options.hasOwnProperty(field)) {
							_self.config[field] = defaults[field];
						} else {
							if (field == 'checkbox') {
								_self.config[field] = options[field] === 'on' ? true : false;
							} else {
								_self.config[field] = options[field];
							}
						}
					}
				});
            
                app = params.app;

                var templatesToLoad = [
                    "widgetMCServerStatus.tpl",
                    "widgetMCCommand.tpl",
                    "admin/adminWidgetMCServerStatus.tpl",
                    "admin/adminWidgetMCCommand.tpl"
                ];

                function loadTemplate(template, next) {
                    fs.readFile(path.resolve(__dirname, './public/templates/' + template), function (err, data) {
                        if (err) {
                            console.log(err.message);
                            return next(err);
                        }
                        MinecraftWidgets.templates[template] = data.toString();
                        next(null);
                    });
                }
                
                async.each(templatesToLoad, loadTemplate);
            },
			loadThemes: function() {
				fs.readdir(path.join(__dirname, 'public/css'), function(err, files) {
					var isStylesheet = /\.css$/;
					MinecraftWidgets.themes = files.filter(function(file) {
						return isStylesheet.test(file);
					}).map(function(file) {
						return {
							name: file
						}
					});
				});
			},
			parsePost: function(data, callback) {},
			parseSignature: function(data, callback) {},
			parseRaw: function(raw, callback) {},
			admin: {
				menu: function(custom_header, callback) {
					custom_header.plugins.push({
						"route": '/plugins/minecraft-essentials',
						"icon": 'fa-edit',
						"name": 'MC-WE Servers'
					});

					callback(null, custom_header);
				}
			},
            templates: {}
        },
        renderMCServerStatusNew = function(widget, templateData, callback) {
            var html = MinecraftWidgets.templates['widgetMCServerStatus.tpl'], cid;
            if (widget.data.cid) {
                cid = widget.data.cid;
            } else {
                var match = widget.area.url.match('[0-9]+');
                cid = match ? match[0] : 1;
            }
            
            // Read from config
            templateData = readWidgetMCServerStatus(widget, templateData);
            if (templateData.logDebug) console.log("Starting renderMCServerStatus.");
            
            // Query for data, still parse on any error.
            if (templateData.logDebug) console.log("Verifying host address.");
            verifyHost(templateData, function(err, pingData) {
                templateData = pingData;
                readServerListPing(templateData, modernRequestBack, modernResponseBack, function(err, responseData) {
                    templateData = responseData;
                    queryServer(templateData, function(err, queryData) {
                        templateData = queryData;
                        if (templateData.logDebug) console.log("Looking for users");
                        findUsers(templateData, 0, function(err, userData) {
                            templateData = userData;
                            if (templateData.logDebug) console.log("Parsing html");
                            parseStatusWidget(templateData, function(err, htmlData) {
                                if (err) {
                                    callback( null, templates.parse(html, templateData) );
                                    return;
                                }else{
                                    storeServerData("1", JSON.stringify(htmlData));
                                    callback( null, templates.parse(html, htmlData) );
                                }
                            });
                        });
                    });
                });
            });
        };
        
    MinecraftWidgets.renderMCCommand = function(widget, callback) {
        var html = MinecraftWidgets.templates['console.tpl'], cid;
        
		if (widget.data.cid) {
			cid = widget.data.cid;
		} else {
			var match = widget.area.url.match('[0-9]+');
			cid = match ? match[0] : 1;
		}
        
        //html = templates.parse(html, templateData);
        callback(null, html);
    }
    
    MinecraftWidgets.renderMCServerStatusLegacy = function(widget, callback) {
        var html = MinecraftWidgets.templates['widgetMCServerStatus.tpl'], cid;
        
		if (widget.data.cid) {
			cid = widget.data.cid;
		} else {
			var match = widget.area.url.match('[0-9]+');
			cid = match ? match[0] : 1;
		}
        
        // Read from config
        var templateData = readWidgetMCServerStatus(widget);
        if (templateData.logDebug) console.log("Starting renderMCServerStatus.");
        
        // Query for data, still parse on any error.
        if (templateData.logDebug) console.log("Verifying host address.");
        verifyHost(templateData, function(err, pingData) {
            templateData = pingData;
            mcping(templateData.serverIP, parseInt(templateData.serverPort), function(err, resp) {
                if (!err) {
                    templateData.version = resp.minecraft_version;
                    templateData.onlinePlayers = resp.num_players;
                    templateData.maxPlayers = resp.max_players;
                    templateData.isServerOnline = true;
                    if (templateData.showNameAlways) {
                        templateData.serverName = templateData.serverName + " ~" + resp.server_name + "~";
                    }else{
                        templateData.serverName = resp.server_name;
                    }
                }
                queryServer(templateData, function(err, queryData) {
                    templateData = queryData;
                    if (templateData.logDebug) console.log("Looking for users");
                    findUsers(templateData, 0, function(err, userData) {
                        templateData = userData;
                        if (templateData.logDebug) console.log("Parsing html");
                        parseStatusWidget(templateData, function(err, htmlData) {
                            if (err) {
                                callback( null, templates.parse(html, templateData) );
                                return;
                            }else{
                                callback( null, templates.parse(html, htmlData) );
                            }
                        });
                    });
                
                });
            });
        });
    }

	MinecraftWidgets.renderMCServerStatus = function(widget, callback) {
        // Read from plugin config
        var templateData = {};
        templateData.serverName = widget.data.serverConfigName;
        templateData.serverHost = MinecraftWidgets.config.server1serverHost;
        templateData.serverPort = MinecraftWidgets.config.server1serverPort;
        templateData.queryPort = MinecraftWidgets.config.server1queryPort;
        renderMCServerStatusNew(widget, templateData, callback);
    };
    
    function readWidgetMCServerStatus(widget, templateData) {
        templateData.showIP = widget.data.showIP;
        templateData.showPlayerCount = widget.data.showPlayerCount;
        templateData.showNameAlways = widget.data.showNameAlways;
        templateData.parseFormatCodes = widget.data.parseFormatCodes;
        templateData.logDebug = widget.data.logDebug == "on" ? true : false;
        
        var readCustomRow = function ( label, text, after ) {
            switch ( after ) {
                case "name":
                    if ( !templateData.customaftername ) { templateData.customaftername = []; }
                    templateData.customaftername[templateData.customaftername.length] = { label: label, text: text }
                    break;
                case "status":
                default:
                    if ( !templateData.customafterstatus ) { templateData.customafterstatus = []; }
                    templateData.customafterstatus[templateData.customafterstatus.length] = { label: label, text: text }
                    break;
                case "address":
                    if ( !templateData.customafteraddress ) { templateData.customafteraddress = []; }
                    templateData.customafteraddress[templateData.customafteraddress.length] = { label: label, text: text }
                    break;
                case "version":
                    if ( !templateData.customafterversion ) { templateData.customafterversion = []; }
                    templateData.customafterversion[templateData.customafterversion.length] = { label: label, text: text }
                    break;
                case "players":
                    if ( !templateData.customafterplayers ) { templateData.customafterplayers = []; }
                    templateData.customafterplayers[templateData.customafterplayers.length] = { label: label, text: text }
                    break;
            }
        }
        
        if ( widget.data.usecustom1 ) readCustomRow( widget.data.custom1label, widget.data.custom1text, widget.data.custom1orderafter );
        if ( widget.data.usecustom2 ) readCustomRow( widget.data.custom2label, widget.data.custom2text, widget.data.custom2orderafter );
        if ( widget.data.usecustom3 ) readCustomRow( widget.data.custom3label, widget.data.custom3text, widget.data.custom3orderafter );
        
        templateData.isServerOnline  = false;
        templateData.hasInvalidHost  = false;
        templateData.hasInvalidPort  = false;
        templateData.hasInvalidQuery = false;
        //templateData.showPlayersList = true;
        templateData.showModList     = true;
        templateData.showPluginList  = false;
        
        // See if there is a port in the host input
        var hostarray = templateData.serverHost.split(/:/g);
        if ( hostarray.length > 1 ) {
            if ( hostarray.length == 2 ) {
                if ( !templateData.serverPort ) {
                    if (templateData.logDebug) console.log("Configuration error: Two ports entered. Using (" + hostarray[1] + ") and ignoring (" + templateData.serverPort + ").");
                    templateData.hasInvalidPort = true;
                }
                templateData.serverHost = hostarray[0];
                templateData.serverPort = hostarray[1];
            } else {
                if (templateData.logDebug) console.log("Configuration error: Invalid host (" + templateData.serverHost + "). Too many \":\", using default \"0.0.0.0\". ");
                templateData.serverHost = "0.0.0.0";
                templateData.hasInvalidHost = true;
            }
        }
        
        if ( typeof parseInt(templateData.serverPort) !== "number" || templateData.serverPort.substring(0,1) == "0" ) {
            templateData.serverPort = "25565";
            templateData.hasInvalidPort = true;
        }
 
        // Debug Messages
        templateData.showDebugIcons = widget.data.showDebugIcons;
        
        templateData.msgInvalidHost  = "<a class=\"fa fa-exclamation-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Configured host invalid: {serverHost}<br>Using the default localhost\"></a>";
        templateData.msgInvalidPort  = "<a class=\"fa fa-exclamation-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Configured server port invalid: {serverPort}<br>Using the default 25565\"></a>";
        templateData.msgInvalidQuery = "<a class=\"fa fa-exclamation-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Configured query port invalid: {queryPort}<br>Using the default 25565\"></a>";
        
        templateData.msgFailHost        = "<a class=\"fa fa-exclamation-circle text-danger has-tooltip\" data-html=\"true\" data-title=\"No IP was found for {host}\"></a>";
        templateData.msgFailPing        = "<a class=\"fa fa-exclamation-circle text-danger has-tooltip\" data-html=\"true\" data-title=\"Server did not respond to a ServerListPing.\"></a>";
        templateData.msgFailQuery       = "<a class=\"fa fa-question-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Server Query Failed<br>Tried to query the server at {serverIP}:{queryPort}<br>Is enable-query true in server.properties?\"></a>";
        templateData.msgFailListPlayers = "<a class=\"fa fa-question-circle text-info has-tooltip\" data-html=\"true\" data-title=\"Server may be blocking its player list.\"></a>";
        templateData.msgFailListMods    = "<a class=\"fa fa-question-circle text-info has-tooltip\" data-html=\"true\" data-title=\"Server may be blocking its mod list.\"></a>";
        templateData.msgFailListPlugins = "<a class=\"fa fa-question-circle text-info has-tooltip\" data-html=\"true\" data-title=\"Server may be blocking its plugin list.\"></a>";
        
        return templateData;
    };
    
    function verifyHost(templateData, hostBack) {
        if ( isIP(templateData.serverHost) ) {
            if (templateData.logDebug) console.log("Host is IP, not looking up DNS or SRV.");
            templateData.serverIP = templateData.serverHost;
            templateData.showPortDomain = true;
            templateData.showIP = false;
            hostBack(null, templateData);
        }else{
            getSRV(templateData.serverHost, function(err, theHost, thePort) {
                if ( err ) {
                    getIP(templateData.serverHost, function(err, theIP) {
                        if (err) {
                            templateData.isServerOnline = false;
                            templateData.failHost = true;
                            hostBack(err, templateData);
                        }
                        templateData.serverIP = theIP;
                        if (templateData.serverPort !== "25565") templateData.showPortDomain = true;
                        hostBack(null, templateData);
                    });
                }else{
                    templateData.serverPort = thePort;
                    if ( isIP(theHost) ) {
                        templateData.serverIP = theHost;
                        hostBack(null, templateData);
                    }else{
                        getIP(theHost, function(err, theIP) {
                            if (err) {
                                templateData.isServerOnline = false;
                                templateData.failHost = true;
                                hostBack(err, templateData);
                            }else{
                                templateData.serverIP = theIP;
                                hostBack(null, templateData);
                            }
                        });
                    }
                }
            });
        }
    };
    
    var getIP = function(host, ipBack) {
        dns.resolve4(host, function (err, addresses) {
            if (err) {
                console.error("Couldn't find an IP for " + host + ", is it a valid address?");
                ipBack(err);
            }else{
                if ( isIP(addresses[0]) ) {
                    ipBack( null, addresses[0] );
                }else{
                    getIP(addresses[0], ipBack);
                }
            }
        });
    };
    
    var getSRV = function(host, srvBack) {
        dns.resolve( "_minecraft._tcp." + host, 'SRV', function (err, addresses) {
            if ( err ) {
                console.info("No SRV for " + host)
                srvBack(true);
            }else{
                console.info("Found SRV record for " + host);
                srvBack(null, addresses[0].name, addresses[0].port)
            }
        });
    };
    
    function isIP(host) {
        if ( typeof  host !== "string" ) return false;
        switch ( host.substring(0,1) ) {
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
                return true;
            default:
                return false;
        }
    };
    
    function readServerListPing(templateData, requestBack, responseBack, dataBack) {
        var hostData = { 'host':( templateData.serverIP || templateData.serverHost ), 'port':templateData.serverPort };
        if (templateData.logDebug) console.log("Sending ServerListPing to " + hostData.host + ":" + hostData.port);
        var dataLength = -1, currentLength = 0, chunks = [];
        var socket = net.connect( hostData, function() {
            requestBack(socket, hostData);
        });
        
        socket.setTimeout(4000, function () {
            socket.destroy();
            if (templateData.logDebug) console.log("ServerListPing timed out when connecting to " + hostData.host + ":" + hostData.port);
            templateData.isServerOnline = false;
            templateData.failPing = true;
            templateData.failTime = true;
            //dataBack(true, templateData);
        });
        
        socket.on('data', function(data) {
            if (templateData.logDebug) console.log("ServerListPing packet received from " + hostData.host + ":" + hostData.port);
            templateData.isServerOnline = true;
            
            try {
                if(dataLength < 0) {
                    dataLength = varint.decode(data);
                    data = data.slice(varint.decode.bytes);
                    if(data[0] != 0x00) {
                        console.log("Bad handshake.");
                        socket.destroy();
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
                    
                    templateData.protocolVersion = resp.version.protocol;
                    
                    var versionSplit = resp.version.name.split(/ /g);
                    if (versionSplit.length > 1) {
                        templateData.version = versionSplit.pop();
                        if (versionSplit[0].search("Bukkit") >= 0 || versionSplit[0].search("MCPC") >= 0 || versionSplit[0].search("Cauldron") >= 0) {
                            templateData.pluginInfo = true;
                        }
                    }else{
                        templateData.version = versionSplit[0];
                    }
                  
                    if (resp.description) {
                        if (templateData.showNameAlways) {
                            templateData.serverName = templateData.serverName + " ~" + resp.description + "~";
                        }else{
                            templateData.serverName = resp.description;
                        }
                    }
                  
                    templateData.onlinePlayers = resp.players.online;
                    templateData.maxPlayers = resp.players.max;
                    
                    if(resp.players.sample) templateData.players = resp.players.sample;
                    if(resp.favicon) templateData.icon = resp.favicon;
                  
                    if(resp.modinfo) {
                        templateData.modInfo = true;
                        var fullModList = resp.modinfo.modList.slice(2);
                        var modNames = [];
                        templateData.modList = [];
                        for (var i = 0; i < fullModList.length; i++) {
                            var pipedMod = fullModList[i].modid.split("|")[0];
                            if (modNames.indexOf(pipedMod) == -1) {
                                modNames.push(pipedMod);
                                templateData.modList.push({modid: pipedMod});
                            }
                        }
                    }
                  
                    socket.destroy();
                }
            } catch(err) {
                console.log(err);
                socket.destroy();
            }
        });

        socket.on('error', function(e) {            
            if (templateData.logDebug) console.log(e);
        });
        
        socket.on('close', function(e) {
            if (e) {
                if (templateData.logDebug) console.log("Connection was closed unexpectedly, was the packet malformed?");
            }
            dataBack(null, templateData);
        });
    };
    
    function modernRequestBack(socket, hostData) {
        var buf = [
            packData([
                new Buffer([0x00]),
                new Buffer(varint.encode(4)),
                new Buffer(varint.encode(hostData.host.length)),
                new Buffer(hostData.host, "utf8"),
                bufferpack.pack("H", hostData.port),
                new Buffer(varint.encode(1))
            ]),
            packData(new Buffer([0x00]))
        ];
        
        socket.write(buf[0]);
        socket.write(buf[1]);
    };
    
    function legacyRequestBack(socket, hostData) {
        var buf = Buffer.concat([
            new Buffer([
                0xFE, 0x01, 0xFA, 0x00, 0x0B, 0x00, 0x4D, 0x00, 0x43,
                0x00, 0x7C, 0x00, 0x50, 0x00, 0x69, 0x00, 0x6E, 0x00,
                0x67, 0x00, 0x48, 0x00, 0x6F, 0x00, 0x73, 0x00, 0x74
            ]),
            bufferpack.pack("hbh", 7 + 2 * hostData.host.length, 74, hostData.host.length),
            encoding.convert(hostData.host, "UTF-16BE"),
            bufferpack.pack("i", parseInt(hostData.port))
        ]);
        
        if (templateData.logDebug) console.log(parseInt(hostData.port));
        
        if(!(buf instanceof Array)) buf = [buf];
        socket.write(buf[0]);
    };
    
    function modernResponseBack(templateData, pingData) {
        var dataLength = -1, currentLength = 0, chunks = [];
        try {
            if(dataLength < 0) {
                dataLength = varint.decode(pingData);
                pingData = pingData.slice(varint.decode.bytes);
                
                if(pingData[0] != 0x00) {
                    templateData.isServerOnline = false;
                    templateData.failPing = true;
                    dataBack(true, templateData);
                    return;
                }
                
                pingData = pingData.slice(1);
                currentLength++;
            }
            
            currentLength += pingData.length;
            chunks.push(pingData);

            if(currentLength >= dataLength) {
                pingData = Buffer.concat(chunks);
                var strLen = varint.decode(pingData);
                var strLenOffset = varint.decode.bytes;
                var resp = JSON.parse(pingData.toString("utf8", strLenOffset));
                
                templateData.protocolVersion = resp.version.protocol;
                var version = resp.version.name.split(" ");
                templateData.version = version[version.length-1];
                
                if (resp.description) {
                    if (templateData.showNameAlways) {
                        templateData.serverName = templateData.serverName + " ~" + resp.description + "~";
                    }else{
                        templateData.serverName = resp.description;
                    }
                }
                
                templateData.onlinePlayers = resp.players.online;
                templateData.maxPlayers = resp.players.max;
                
                if(resp.players.sample) {
                    templateData.players = resp.players.sample;
                    templateData.seesPlayers = true;
                }
                if(resp.favicon) templateData.icon = resp.favicon;
                if(resp.modinfo) {
                    templateData.modInfo = true;
                    templateData.modList = resp.modinfo.modList.slice(2);
                    if(templateData.modList.length == 0) {
                        templateData.showModList = false;
                        templateData.failModList = true;
                    }
                }
            }
        } catch(err) {
            if (templateData.logDebug) console.log(err);
            templateData.failPing = true;
        }
        return templateData;
    }
    
    function legacyResponseBack(socket, templateData, pingData, dataBack) {
        try {
            var resp = "",
                isOneSix = false;
            if(data[0] != 0xFF) {
                doCallback(new Error("Invalid handshake."));
                socker.destroy();
                return;
            }
            
            // Ignore the first three bytes, and convert the rest to a string.
            resp = encoding.convert(data.slice(3), "UTF-8", "UTF-16BE").toString();
            
            // 1.6 sends a §1 first.
            isOneSix = resp[0] == "\u00a7" && resp[1] == "1";
            
            // 1.6 is separated by NULL, others by §
            resp = resp.split(isOneSix ? "\u0000" : "\u00a7");
            
            // Read data
            templateData.protocolVersion = isOneSix ? parseInt(resp[1]) : 71;
            templateData.version = isOneSix ? resp[2] : "Legacy (<1.6)";
            var motd = resp[isOneSix ? 3 : 0];
            
            if (templateData.showNameAlways) {
                templateData.serverName = templateData.serverName + " ~" + motd + "~";
            }else{
                templateData.serverName = motd;
            }
            
            templateData.onlinePlayers = parseInt(resp[isOneSix ? 4 : 1]);
            templateData.maxPlayers = parseInt(resp[isOneSix ? 5 : 2]);
            
            socket.end();
            
            queryServer();
        } catch(err) {
            if (templateData.logDebug) console.log(err);
            doCallback(true);
        }
    };
    
    function packData(raw) {
        if ( raw instanceof Array ) raw = Buffer.concat(raw);
        return Buffer.concat( [ new Buffer(varint.encode(raw.length)), raw ] );
    };
    
    function queryServer(templateData, queryBack) {
        if ( !templateData.queryPort ) templateData.queryPort = templateData.serverPort;
        var queryData;
        if ( templateData.uselocalhost ) {
            queryData = { host: "0.0.0.0", port: templateData.queryPort };
        }else{
            queryData = { host: templateData.serverIP || templateData.serverHost, port: templateData.queryPort };
        }
        
        if (templateData.logDebug) console.log("Querying " + queryData.host + ":" + queryData.port);
        
        var query = new mcquery( queryData.host, queryData.port );
        
        query.connect(function (err) {
            if (err) {
                if (templateData.logDebug) console.log("Query failed for " + ( templateData.serverIP || templateData.serverHost ) + ":" + templateData.queryPort + ", is query-enabled set to true in server.properties?" );
                templateData.failQuery = true;
                queryBack(null, templateData);
            } else {
                templateData.queryonline = true;
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
            if (err) {
                if (templateData.logDebug) console.log("full_stat failed for " + templateData.serverHost);
            } else {
                if (templateData.logDebug) console.log("Got full_stat for " + templateData.serverHost);
                templateData.isServerOnline = true;
                
                if ( !templateData.players ) {                    
                    // Convert player objects to the way NodeBB likes.
                    if (templateData.logDebug) console.log("Setting player list.");
                    templateData.seesPlayers = true;
                    templateData.players = [];
                    var index;
                    for (index = 0; index < stat.player_.length; ++index) {
                        templateData.players[templateData.players.length] = { name: stat.player_[index] };
                    }
                }
                
                // Use queried hostname if localhost.
                if ( templateData.serverHost == "0.0.0.0" || templateData.serverHost == "127.0.0.1" || templateData.serverHost == "localhost" ) {
                    templateData.serverHost = stat.hostip;
                    if ( stat.hostport != "25565" ) {
                        templateData.showPortDomain = true;
                        templateData.serverPort = stat.hostport;
                    }
                }
                
                if (stat.plugins) {
                    templateData.pluginInfo = true;
                    var pluginString = stat.plugins.split(": ")[1].split("; ");
                    templateData.pluginList = [];
                    var index;
                    for (index = 0; index < pluginString.length; ++index) {
                        templateData.pluginList[templateData.pluginList.length] = { name: pluginString[index] };
                    }
                    if (templateData.pluginList.length > 1) templateData.showPluginList = true;
                }
                
                templateData.onlinePlayers = stat.numplayers;
                templateData.maxPlayers = stat.maxplayers;
                templateData.version = stat.version;
                if (stat.motd) {
                    if (templateData.showNameAlways) {
                        templateData.serverName = templateData.serverName + " ~" + stat.motd + "~";
                    }else{
                        templateData.serverName = stat.motd;
                    }
                }
                
                shouldWeClose();
            }
            
            queryBack(null, templateData);
        }

        function shouldWeClose() {
            //have we got all answers
            if (query.outstandingRequests() === 0) {
                query.close();
            }
        }
    }
    
    var findUsers = function(templateData, index, usersBack) {
        if ( !templateData.players ) templateData.players = []; 
        if ( templateData.players.length != index ) {
            user.exists(templateData.players[index].name, function(err, exists) {
                if ( err ) {
                    if (templateData.logDebug) console.log("Error finding user: " + err);
                } else if ( exists ) {
                    templateData.players[index].linkprofile = true;
                } else {
                    // NOOP
                }
                index++;
                findUsers(templateData, index, usersBack);
            });
        } else {
            usersBack(null, templateData);
        }
    }
    
    function parseStatusWidget ( templateData, templateBack ) {
        if ( templateData.parseFormatCodes ) {
            if (templateData.logDebug) console.log("Original name: " + templateData.serverName);
            var spancount = templateData.serverName.split("§").length - 1;
            templateData.serverName = templateData.serverName.replace(/§0/g, "<span style=\"color:#000000;\">");
            templateData.serverName = templateData.serverName.replace(/§1/g, "<span style=\"color:#0000AA;\">");
            templateData.serverName = templateData.serverName.replace(/§2/g, "<span style=\"color:#00AA00;\">");
            templateData.serverName = templateData.serverName.replace(/§3/g, "<span style=\"color:#00AAAA;\">");
            templateData.serverName = templateData.serverName.replace(/§4/g, "<span style=\"color:#AA0000;\">");
            templateData.serverName = templateData.serverName.replace(/§5/g, "<span style=\"color:#AA00AA;\">");
            templateData.serverName = templateData.serverName.replace(/§6/g, "<span style=\"color:#FFAA00;\">");
            templateData.serverName = templateData.serverName.replace(/§7/g, "<span style=\"color:#AAAAAA;\">");
            templateData.serverName = templateData.serverName.replace(/§8/g, "<span style=\"color:#555555;\">");
            templateData.serverName = templateData.serverName.replace(/§9/g, "<span style=\"color:#5555FF;\">");
            templateData.serverName = templateData.serverName.replace(/§a/g, "<span style=\"color:#55FF55;\">");
            templateData.serverName = templateData.serverName.replace(/§b/g, "<span style=\"color:#55FFFF;\">");
            templateData.serverName = templateData.serverName.replace(/§c/g, "<span style=\"color:#FF5555;\">");
            templateData.serverName = templateData.serverName.replace(/§d/g, "<span style=\"color:#FF55FF;\">");
            templateData.serverName = templateData.serverName.replace(/§e/g, "<span style=\"color:#FFFF55;\">");
            templateData.serverName = templateData.serverName.replace(/§f/g, "<span style=\"color:#FFFFFF;\">");
            templateData.serverName = templateData.serverName.replace(/§k/g, "<span>");
            templateData.serverName = templateData.serverName.replace(/§l/g, "<span style=\"font-weight: bold;\">");
            templateData.serverName = templateData.serverName.replace(/§m/g, "<span style=\"text-decoration: line-through;\">");
            templateData.serverName = templateData.serverName.replace(/§n/g, "<span style=\"text-decoration: underline;\">");
            templateData.serverName = templateData.serverName.replace(/§o/g, "<span style=\"font-style: italic;\">");
            templateData.serverName = templateData.serverName.replace(/§r/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#000000;\">");
            for ( var i = 0; i < spancount; i++ ) templateData.serverName = templateData.serverName + "</span>";
        }
        
        templateData.msgFailQuery = templateData.msgFailQuery.replace("{serverIP}", ( templateData.serverIP || templateData.serverHost ) );
        templateData.msgFailQuery = templateData.msgFailQuery.replace("{queryPort}",templateData.queryPort);
        
        if (templateData.isServerOnline && templateData.players && templateData.players.length > 0) templateData.hasPlayers = true;
        
        if (templateData.showIP && templateData.serverPort != "25565") templateData.showPortIP = true;
        
        if (templateData.pluginInfo && !(templateData.showPluginList)) templateData.failListPlugins = true;
        
        templateBack(null, templateData);
    }
    
    MinecraftWidgets.defineWidgets = function(widgets, callback) {
		widgets = widgets.concat([
			{
				widget: "widgetMCServerStatus",
				name: "Minecraft Server Status 1.7+",
				description: "Lists information on a Minecraft server.",
				content: MinecraftWidgets.templates['admin/adminWidgetMCServerStatus.tpl']
			},
            {
				widget: "widgetMCServerStatusLegacy",
				name: "Minecraft Server Status Legacy <=1.6",
				description: "Lists information on a legacy Minecraft server.",
				content: MinecraftWidgets.templates['admin/adminWidgetMCServerStatus.tpl']
			},
            {
				widget: "widgetMCCommand",
				name: "Minecraft Server Command Widget",
				description: "Send a console command to a Minecraft server.",
				content: MinecraftWidgets.templates['admin/adminWidgetMCCommand.tpl']
			}
		]);

		callback(null, widgets);
	};

	module.exports = MinecraftWidgets;
})();
