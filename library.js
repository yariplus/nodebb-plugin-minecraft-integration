(function() {
	"use strict";

	// All your sanity and wits they will all vanish, I promise.

	var Rainbow = require('./lib/rainbowvis.js'),
		async = require('async'),
		fs = require('fs'),
		path = require('path'),
		meta = module.parent.require('./meta'),
		Settings = module.parent.require('./settings'),
		user = module.parent.require('./user'),
		plugins = module.parent.require('./plugins'),
		templates = module.parent.require('templates.js'),
		SocketAdmin = module.parent.require('./socket.io/admin'),
		translator = module.parent.require('../public/src/translator'),
		mcquery = require('mcquery'),
		rcon = require('rcon'),
		net = require('net'),
		dns = require('dns'),
		bufferpack = require("bufferpack"),
		encoding = require("encoding"),
		varint = require("varint"),
		mcping = require("mc-ping"),
		app,
		MinecraftWidgets = {
			onLoad: function (params, callback, controllers, legacyback) {
				var router = params.router || params;
				var middleware = params.middleware || callback;
				app = params.app || params;
				callback = legacyback || callback;

				function render(req, res, next) {
					res.render('admin/plugins/minecraft-essentials', { });
				}

				router.get('/admin/plugins/minecraft-essentials', middleware.admin.buildHeader, render);
				router.get('/api/admin/plugins/minecraft-essentials', render);
				router.get('/minecraft-essentials/config', function (req, res) {
					res.status(200);
				});

				var	defaultSettings = {
					'resetSettings': false,

					'serverUpdateDelay': '1',
					'showDebugIcons': true,
					'logErrors': true,
					'logDebug': false,

					'servers': [],

					'avatarCDN': "cravatar",
					'avatarSize': "40",
					'avatarStyle': "flat",

					'server0isDisabled': false,
					'server0isEnabled': true,
					'server0serverConfigName': 'Server One',
					'server0serverName': 'A Minecraft Server',
					'server0isLegacy': false,
					'server0serverHost': '',
					'server0serverPort': '',
					'server0queryPort': '',
					'server0rconPort': '',
					'server0rconPass': '',
					'server0requestIP': '',

					'server1isDisabled': true,
					'server2isDisabled': true,
					'server3isDisabled': true,
					'server4isDisabled': true,
					'server5isDisabled': true,
					'server6isDisabled': true,
					'server7isDisabled': true,
					'server8isDisabled': true,
					'server9isDisabled': true,

					'server1isEnabled': false,
					'server2isEnabled': false,
					'server3isEnabled': false,
					'server4isEnabled': false,
					'server5isEnabled': false,
					'server6isEnabled': false,
					'server7isEnabled': false,
					'server8isEnabled': false,
					'server9isEnabled': false
				};

				MinecraftWidgets.settings = new Settings('minecraft-essentials', '0.3.0', defaultSettings, function() {
					// MinecraftWidgets.settings.reset(function(){
						// console.log("SETTINGS RESET");
					// });

					var config = MinecraftWidgets.settings.get();

					if (typeof config.servers === 'undefined' || config.servers === null) {
						config.servers = [{},{},{},{},{},{},{},{},{},{}];
						MinecraftWidgets.settings.set(config);
						MinecraftWidgets.settings.persist();
					}else{
						for (var serverNumber = 0; serverNumber < 10; serverNumber++) {
							if (typeof config.servers[serverNumber] === 'undefined' || config.servers[serverNumber] === null) config.servers[serverNumber] = {};
						}
						MinecraftWidgets.settings.set(config);
						MinecraftWidgets.settings.persist();
					}

					setTimeout(MinecraftWidgets.logSettings, 4000);
					setTimeout(MinecraftWidgets.updateServers, MinecraftWidgets.settings.get().logDebug ? 60000 : 5000);
				});

				SocketAdmin.settings.syncMinecraftEssentials = function () {
					MinecraftWidgets.settings.sync();
				};

				var templatesToLoad = [
					"widgetMCDynmapMiniMap.tpl",
					"widgetMCOnlinePlayersGraph.tpl",
					"widgetMCOnlinePlayersGrid.tpl",
					"widgetMCServerStatus.tpl",
					"widgetMCTopPlayersGraph.tpl",
					"widgetMCTopPlayersList.tpl",
					"admin/adminWidgetMCDynmapMiniMap.tpl",
					"admin/adminWidgetMCOnlinePlayersGraph.tpl",
					"admin/adminWidgetMCOnlinePlayersGrid.tpl",
					"admin/adminWidgetMCServerStatus.tpl",
					"admin/adminWidgetMCTopPlayersGraph.tpl",
					"admin/adminWidgetMCTopPlayersList.tpl"
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

				callback();
			},
			logSettings: function () {
				var config = MinecraftWidgets.settings.get();
				if (config.logDebug) {
					for (var p in config) console.log(p + ": " + config[p]);
					for (var serverNumber = 0; serverNumber < 10; serverNumber++) {
						if (config['server' + serverNumber + 'isDisabled'] || typeof config['server' + serverNumber + 'isDisabled'] === 'undefined' ) continue;
						if (config.servers[serverNumber]) {
							if (config.servers[serverNumber].status) console.log(config.servers[serverNumber].status);
							if (config.servers[serverNumber].pings) console.log(config.servers[serverNumber].pings);
							if (config.servers[serverNumber].players) console.log(config.servers[serverNumber].players);
						}
					}
				}
			},
			admin: {
				menu: function(custom_header, callback) {
					custom_header.plugins.push({
						"route": '/plugins/minecraft-essentials',
						"icon": 'fa-edit',
						"name": 'Minecraft Essentials'
					});

					callback(null, custom_header);
				}
			},
			settingsChange: function ( hash, data ) {
			},
			templates: {},
			pushData: function(data, fields, callback) {
				if (!callback) {
					callback = fields;
					fields = ['status'];
				}

				// Get information from the database and push it into the data object.
				var config = MinecraftWidgets.settings.get();
				for (var i = 0; i < fields.length; i++) {
					var o = config.servers[data.serverNumber];
					if (typeof o === 'undefined' || o === null) {
						callback("Server not found.", data);
						return;
					}else{
						o = o[fields[i]];
						if (typeof o === 'undefined' || o === null) {
							callback("Server not found.", data);
							return;
						}else{
							data[fields[i]] = {};
							for (var prop in o) data[fields[i]][prop] = o[prop];
						}
					}
				}
				callback(null, data);
			},
			updateServers: function() {
				// Read from plugin config
				var data,
					config = MinecraftWidgets.settings.get();
				for (var serverNumber = 0; serverNumber < 10; serverNumber++) {
					if ( config['server' + serverNumber + 'isDisabled'] || typeof config['server' + serverNumber + 'isDisabled'] === 'undefined' ) continue;
					data = {};
					data.serverNumber = serverNumber;
					data.serverName   = config['server' + serverNumber + 'serverName'] || "Server " + serverNumber;
					data.serverHost   = config['server' + serverNumber + 'serverHost'] || "0.0.0.0";
					data.serverPort   = config['server' + serverNumber + 'serverPort'] || "25565";
					data.queryPort    = config['server' + serverNumber + 'queryPort']  || data.serverPort;
					data.rconPort     = config['server' + serverNumber + 'rconPort']   || "25575";
					data.rconPass     = config['server' + serverNumber + 'rconPass']   || "password";

					// Set all status fields to false/empty.
					data.status = {};
					data.status.serverIP = "0.0.0.0";
					data.status.isServerOnline = false;
					data.status.version = '';
					data.status.serverMOTD = '';
					data.status.failPing = false;
					data.status.failQuery = false;
					data.status.failTime = false;
					data.status.onlinePlayers = '0';
					data.status.icon = '';
					data.status.players = [];
					data.status.modList = [];
					data.status.pluginList = [];

					// See if there is a port in the host input
					var hostarray = data.serverHost.split(/:/g);
					if ( hostarray.length > 1 ) {
						if ( hostarray.length == 2 ) {
							if ( !data.serverPort ) {
								if (config.logErrors) console.log("Configuration error: Two ports entered. Using (" + hostarray[1] + ") and ignoring (" + data.serverPort + ").");
								data.hasInvalidPort = true;
							}
							data.serverHost = hostarray[0];
							data.serverPort = hostarray[1];
						} else {
							if (config.logErrors) console.log("Configuration error: Invalid host (" + data.serverHost + "). Too many \":\", using default \"0.0.0.0\". ");
							data.serverHost = "0.0.0.0";
							data.hasInvalidHost = true;
						}
					}

					if (config.logDebug) console.log("Updating server status for " + ( data.serverName ) + " (Server " + serverNumber + ")\nConfigured Host: " + ( data.serverHost ) + "   Port: " + ( data.serverPort ) + "   Query: " + ( data.queryPort ));

					MinecraftWidgets.pushServerStatusPing(data);
				}

				var timeout = MinecraftWidgets.settings.get('serverUpdateDelay');
				if (!timeout) {
					timeout = 1;
				}else{
					if (isNaN(timeout) || timeout < 1) timeout = 1;
				}
				setTimeout(MinecraftWidgets.updateServers, 60000 * timeout);
			},
			pushServerStatusPing: function(data) {
				verifyHost(data, function(err) {
					if (MinecraftWidgets.settings.get().logDebug) console.log("Resolved host " + ( data.serverHost ) + " to " + data.status.serverIP + ":" + data.serverPort + " query at port " + data.queryPort);
					if (MinecraftWidgets.settings.get()['server'+data.serverNumber+'isLegacy']) {
						if (MinecraftWidgets.settings.get().logDebug) console.log("Using legacy ServerListPing for " + data.serverHost);
						mcping(data.status.serverIP, parseInt(data.serverPort), function(err, resp) {
							if (!err) {
								data.status.isServerOnline = true;
								data.status.onlinePlayers = resp.num_players;
								data.status.maxPlayers = resp.max_players;
								data.status.serverName = resp.server_name;
								if (resp.version) data.status.version = resp.version;

								if(resp.modinfo) {
									var fullModList = resp.modinfo.modList.slice(2);
									var modNames = [];
									data.status.modList = [];
									for (var i = 0; i < fullModList.length; i++) {
										var pipedMod = fullModList[i].modid.split("|")[0];
										if (modNames.indexOf(pipedMod) == -1) {
											modNames.push(pipedMod);
											data.status.modList.push({modid: pipedMod});
										}
									}
								}

								queryServer(data, function(err) {
									if (err) {
										if (MinecraftWidgets.settings.get().logDebug) console.log("Query failed for " + ( MinecraftWidgets.settings.get()['server'+data.serverNumber+'isLegacy'] || data.status.serverIP || data.serverHost ) + ":" + data.queryPort + "\nerr");
									}else{
										if (MinecraftWidgets.settings.get().logDebug) console.log("Received FullStats Query response for " + ( MinecraftWidgets.settings.get()['server'+data.serverNumber+'isLegacy'] || data.status.serverIP || data.serverHost ) + ":" + data.queryPort);
									}
									//MinecraftWidgets.doFetchRCON( data );
									MinecraftWidgets.updateDatabase( data );
								});
							}else{
								if (MinecraftWidgets.settings.get().logErrors) console.log("ServerListPing failed: " + err);
								//MinecraftWidgets.doFetchRCON( data );
								MinecraftWidgets.updateDatabase( data );
							}
						});
					}else{
						readServerListPing(data, function(err) {
							if (err) {
								//MinecraftWidgets.doFetchRCON( data );
								MinecraftWidgets.updateDatabase( data );
							}else{
								queryServer(data, function(err) {
									if (err) {
										if (MinecraftWidgets.settings.get().logDebug) console.log("Query failed for " + ( MinecraftWidgets.settings.get()['server'+data.serverNumber+'requestIP'] || data.status.serverIP || data.serverHost ) + ":" + data.queryPort + "\nerr");
									}else{
										if (MinecraftWidgets.settings.get().logDebug) console.log("Received FullStats Query response for " + ( MinecraftWidgets.settings.get()['server'+data.serverNumber+'requestIP'] || data.status.serverIP || data.serverHost ) + ":" + data.queryPort);
									}
									//MinecraftWidgets.doFetchRCON( data );
									MinecraftWidgets.updateDatabase( data );
								});
							}
						});
					}
				});
			},
			doFetchRCON: function( data ) {
				if (!data.rconPort || !data.rconPass) {
					MinecraftWidgets.updateDatabase( data );
				}else{
					if (MinecraftWidgets.settings.get().logDebug) console.log("Connecting to RCON at " + data.status.serverIP + ":" + data.rconPort);
					var conn = new rcon(data.status.serverIP, data.rconPort, data.rconPass);

					conn.on('auth', function() {
						if (MinecraftWidgets.settings.get().logDebug) console.log("Successfully connected to RCON at " + data.status.serverIP + ":" + data.rconPort);
						conn.send('time');
					}).on('response', function(str) {
						console.log("Got response: " + str);
						conn.disconnect();
					}).on('end', function() {
						if (MinecraftWidgets.settings.get().logDebug) console.log("RCON connection closed at " + data.status.serverIP + ":" + data.rconPort);
						MinecraftWidgets.updateDatabase( data );
					}).on('error', function() {
						if (MinecraftWidgets.settings.get().logErrors) console.log("RCON connection failed at " + data.status.serverIP + ":" + data.rconPort);
						MinecraftWidgets.updateDatabase( data );
					});
					conn.connect();
				}
			},
			updateDatabase: function( data ) {
				if ( data && typeof data.serverNumber !== 'undefined') {
					var servers = MinecraftWidgets.settings.get('servers'),
						config = MinecraftWidgets.settings.get();

					if (typeof servers[data.serverNumber] === 'undefined') servers[data.serverNumber] = { status: {}, pings: { pingArr: [] }, players: {} };

					if (config.logDebug) console.log("Saving settings for " + (data.serverConfigName ? data.serverConfigName : "Unnamed Server") + " (Server " + data.serverNumber + ")");

					if (!servers[data.serverNumber].status) servers[data.serverNumber].status = {};
					for (var p in data.status) {
						// if (config.logDebug) console.log(p + ": " + data.status[p]);
						servers[data.serverNumber].status[p] = data.status[p];
					}

					if (data.status.players.length > 0) {
						if (!servers[data.serverNumber].pings) servers[data.serverNumber].pings = {};
						if (!servers[data.serverNumber].pings.pingArr) servers[data.serverNumber].pings.pingArr = [];

						servers[data.serverNumber].pings.pingArr.push( {time: Date.now().toString(), players: data.status.players} );
						while (servers[data.serverNumber].pings.pingArr.length > 30) servers[data.serverNumber].pings.pingArr.shift();

						if (!servers[data.serverNumber].players) servers[data.serverNumber].players = {};

						// Add minutes
						for (var i = 0; i < data.status.players.length; i++) {
							if (servers[data.serverNumber].players.hasOwnProperty(data.status.players[i].name)) {
								if (servers[data.serverNumber].players[data.status.players[i].name].minutes) {
									servers[data.serverNumber].players[data.status.players[i].name].minutes++;
								}else{
									servers[data.serverNumber].players[data.status.players[i].name].minutes = 1;
								}
							}else{
								servers[data.serverNumber].players[data.status.players[i].name] = {};
								servers[data.serverNumber].players[data.status.players[i].name].minutes = 1;
							}
						}
					}

					MinecraftWidgets.settings.set('servers', servers);
					MinecraftWidgets.settings.persist();
				}
			}
		};

	MinecraftWidgets.renderMCDynmapMiniMap = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 0 ? "0" : widget.data.serverNumber;

		widget.data.showModalMap = widget.data.showModalMap == "on" ? true : false;

		if (!widget.data.mapURI) widget.data.mapURI = 'http://' + MinecraftWidgets.settings.get('server' + widget.data.serverNumber + 'serverHost') + ':8123/';
		widget.data.minimapURI = widget.data.mapURI + '?nopanel=true&hidechat=true&nogui=true';
		if (widget.data.worldname) widget.data.minimapURI = widget.data.minimapURI + '&' + 'worldname=' + widget.data.worldname;
		if (widget.data.mapname) widget.data.minimapURI = widget.data.minimapURI + '&' + 'mapname=' + widget.data.mapname;
		if (widget.data.zoom) widget.data.minimapURI = widget.data.minimapURI + '&' + 'zoom=' + widget.data.zoom;
		if (widget.data.X) widget.data.minimapURI = widget.data.minimapURI + '&' + 'x=' + widget.data.X;
		if (widget.data.Z) widget.data.minimapURI = widget.data.minimapURI + '&' + 'z=' + widget.data.Z;

		widget.data.modalID = "minimap" + widget.data.serverNumber;

		if (widget.data.showModalMap) widget.data.title += '<i class="fa fa-compass pointer pull-right has-tooltip" data-title="Open Map" data-toggle="modal" data-target="#mcwe-modal-'+widget.data.modalID+'" style="font-size: 20px;"></i>';
		formatWidgetData(widget.data, "Mini Map - ");

		app.render('widgetMCDynmapMiniMap', widget.data, function(err, html) {
			translator.translate(html, function(translatedHTML) {
				callback(err, translatedHTML);
			});
		});
	}

	MinecraftWidgets.renderMCTopPlayersList = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 0 ? "0" : widget.data.serverNumber;

		MinecraftWidgets.pushData(widget.data, ['status', 'players'], function(err) {

			if (err) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}

			if (!widget.data.players) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}else{
				var empty = true;
				for(var prop in widget.data.players) {
					empty = false;
					break;
				}
				if (empty) {
					widget.data.title = '';
					widget.data.container = '';
					callback(null, '');
					return;
				}
			}

			widget.data.showTopPlayers = parseInt(widget.data.showTopPlayers);
			widget.data.showTopPlayers = isNaN(widget.data.showTopPlayers) ? 5 : widget.data.showTopPlayers < 1 ? 5 : widget.data.showTopPlayers;

			for (var p in widget.data.status) {
				if (p == 'players') continue;
				widget.data[p] = widget.data.status[p];
			}
			delete widget.data.status;

			widget.data.topPlayers = [];
			for (var player in widget.data.players) {
				widget.data.topPlayers.push({ 'name': player, 'minutes': widget.data.players[player].minutes });
			}
			widget.data.topPlayers.sort(function(a, b) { return b.minutes - a.minutes; });
			while (widget.data.topPlayers.length > widget.data.showTopPlayers) {
				widget.data.topPlayers.pop();
			}
			widget.data.players = widget.data.topPlayers;

			if (widget.data.showGlory) {
				if (!widget.data.gloryStart) widget.data.gloryStart = "000000";
				if (!widget.data.gloryEnd) widget.data.gloryEnd = "000000";
				var gloryStart = [ parseInt(widget.data.gloryStart.substring(0,2),16), parseInt(widget.data.gloryStart.substring(2,4),16), parseInt(widget.data.gloryStart.substring(4,6),16) ];
				var gloryEnd = [ parseInt(widget.data.gloryEnd.substring(0,2),16), parseInt(widget.data.gloryEnd.substring(2,4),16), parseInt(widget.data.gloryEnd.substring(4,6),16) ];
				var gloryStep =  [ Math.round( (gloryEnd[0]-gloryStart[0]) / widget.data.showTopPlayers ), Math.round( (gloryEnd[1]-gloryStart[1]) / widget.data.showTopPlayers ), Math.round( (gloryEnd[2]-gloryStart[2]) / widget.data.showTopPlayers ) ];
			}

			for (var i = 0; i < widget.data.players.length; i++) {
				if (widget.data.showGlory) widget.data.players[i].glory = "#" + ("00" + (gloryStart[0] + gloryStep[0] * i).toString(16)).substr(-2) + ("00" + (gloryStart[1] + gloryStep[1] * i).toString(16)).substr(-2) + ("00" + (gloryStart[2] + gloryStep[2] * i).toString(16)).substr(-2);
				if (widget.data.players[i].minutes > 60) {
					widget.data.players[i].minutes = Math.floor(widget.data.players[i].minutes / 60).toString() + " Hours, " + (widget.data.players[i].minutes % 60).toString() + " Minutes";
				}else{
					widget.data.players[i].minutes = widget.data.players[i].minutes + " Minutes";
				}
			}

			var avatarCDN = MinecraftWidgets.settings.get().avatarCDN ? MinecraftWidgets.settings.get().avatarCDN : "minotar";
			widget.data.avatarSize = MinecraftWidgets.settings.get().avatarSize ? MinecraftWidgets.settings.get().avatarSize : "40";
			widget.data.avatarSize = MinecraftWidgets.settings.get().avatarCDN === 'signaturecraft' ? widget.data.avatarSize / 8 : widget.data.avatarSize;
			widget.data.avatarStyle = MinecraftWidgets.settings.get().avatarStyle ? MinecraftWidgets.settings.get().avatarStyle : "flat";
			switch (avatarCDN) {
				default:
				case "minotar":
					widget.data.avatarCDNminotar = true;
					break;
				case "signaturecraft":
					widget.data.avatarCDNsignaturecraft = true;
					break;
				case "cravatar":
					widget.data.avatarCDNcravatar = true;
					break;
			}

			formatWidgetData(widget.data, "Top Players - ");

			app.render('widgetMCTopPlayersList', widget.data, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					callback(err, translatedHTML);
				});
			});
		});
	}

	MinecraftWidgets.renderMCOnlinePlayersGraph = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 0 ? "0" : widget.data.serverNumber;

		MinecraftWidgets.pushData(widget.data, ['pings', 'status'], function(err){

			if (err) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}

			if (!widget.data.status) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}

			for (var p in widget.data.status) {
				widget.data[p] = widget.data.status[p];
			}
			delete widget.data.status;

			widget.data.onlinePlayers = [];
			widget.data.labels = [];

			for (var i = 0; i < widget.data.pings.pingArr.length; i++) {
				widget.data.onlinePlayers.push( widget.data.pings.pingArr[i].players ? widget.data.pings.pingArr[i].players.length : 0 );
				if (widget.data.pings.pingArr[i].time) {
					var time = parseInt(widget.data.pings.pingArr[i].time);
					var date = new Date( time - time % 60000 ).toLocaleTimeString();
					widget.data.labels.push( date );
				}else{
					widget.data.labels.push( '0' );
				}
			}

			widget.data.onlinePlayers = JSON.stringify(widget.data.onlinePlayers);
			widget.data.labels = JSON.stringify(widget.data.labels);

			formatWidgetData(widget.data, "Online Players - ");

			app.render('widgetMCOnlinePlayersGraph', widget.data, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					callback(err, translatedHTML);
				});
			});
		});
	};

	MinecraftWidgets.renderMCOnlinePlayersGrid = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 0 ? "0" : widget.data.serverNumber;

		MinecraftWidgets.pushData(widget.data, ['status'], function(err){

			if (err) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}

			if (!widget.data.status || widget.data.status.players.length < 1) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}

			for (var p in widget.data.status) {
				widget.data[p] = widget.data.status[p];
			}
			delete widget.data.status;

			widget.data.showPlayers = widget.data.isServerOnline ? true : false;
			if (widget.data.showPlayers) {
				var avatarCDN = MinecraftWidgets.settings.get().avatarCDN ? MinecraftWidgets.settings.get().avatarCDN : "minotar";
				widget.data.avatarSize = MinecraftWidgets.settings.get().avatarSize ? MinecraftWidgets.settings.get().avatarSize : "40";
				widget.data.avatarSize = MinecraftWidgets.settings.get().avatarCDN === 'signaturecraft' ? widget.data.avatarSize / 8 : widget.data.avatarSize;
				widget.data.avatarStyle = MinecraftWidgets.settings.get().avatarStyle ? MinecraftWidgets.settings.get().avatarStyle : "flat";
				switch (avatarCDN) {
					default:
					case "minotar":
						widget.data.avatarCDNminotar = true;
						break;
					case "signaturecraft":
						widget.data.avatarCDNsignaturecraft = true;
						break;
					case "cravatar":
						widget.data.avatarCDNcravatar = true;
						break;
				}

				if (widget.data.showGlory) {
					if (!widget.data.gloryStart) widget.data.gloryStart = "000000";
					if (!widget.data.gloryEnd) widget.data.gloryEnd = "000000";
					var gloryStart = [ parseInt(widget.data.gloryStart.substring(0,2),16), parseInt(widget.data.gloryStart.substring(2,4),16), parseInt(widget.data.gloryStart.substring(4,6),16) ];
					var gloryEnd = [ parseInt(widget.data.gloryEnd.substring(0,2),16), parseInt(widget.data.gloryEnd.substring(2,4),16), parseInt(widget.data.gloryEnd.substring(4,6),16) ];
					var gloryStep =  [ Math.round( (gloryEnd[0]-gloryStart[0]) / widget.data.onlinePlayers ), Math.round( (gloryEnd[1]-gloryStart[1]) / widget.data.onlinePlayers ), Math.round( (gloryEnd[2]-gloryStart[2]) / widget.data.onlinePlayers ) ];
				}

				for (var i = 0; i < widget.data.players.length; i++) {
					if (widget.data.showGlory) widget.data.players[i].glory = "#" + ("00" + (gloryStart[0] + gloryStep[0] * i).toString(16)).substr(-2) + ("00" + (gloryStart[1] + gloryStep[1] * i).toString(16)).substr(-2) + ("00" + (gloryStart[2] + gloryStep[2] * i).toString(16)).substr(-2);
				}

				widget.data.avatarMargin = 5;
			}

			formatWidgetData(widget.data, "Online Players - ");

			app.render('widgetMCOnlinePlayersGrid', widget.data, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					callback(err, translatedHTML);
				});
			});
		});
	};

	MinecraftWidgets.renderMCTopPlayersGraph = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 0 ? "0" : widget.data.serverNumber;

		MinecraftWidgets.pushData(widget.data, ['status', 'players'], function (err) {

			if (err) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}

			if (!widget.data.players) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}else{
				var empty = true;
				for(var prop in widget.data.players) {
					empty = false;
					break;
				}
				if (empty) {
					widget.data.title = '';
					widget.data.container = '';
					callback(null, '');
					return;
				}
			}

			widget.data.showTopPlayers = parseInt(widget.data.showTopPlayers);
			widget.data.showTopPlayers = isNaN(widget.data.showTopPlayers) ? 5 : widget.data.showTopPlayers < 1 ? 5 : widget.data.showTopPlayers;

			widget.data.topPlayers = [];
			for (var player in widget.data.players) {
				widget.data.topPlayers.push({ 'player': player, 'minutes': widget.data.players[player].minutes });
			}
			widget.data.topPlayers.sort(function(a, b) { return b.minutes - a.minutes; });
			while (widget.data.topPlayers.length > widget.data.showTopPlayers) {
				widget.data.topPlayers.pop();
			}

			widget.data.chartOptions = '{ responsive: true, tooltipTemplate: "<%=label%>" }';
			widget.data.chartData = [];

			widget.data.gloryEnd = widget.data.gloryEnd ? widget.data.gloryEnd : widget.data.gloryStart ? widget.data.gloryStart : "ff5555";
			widget.data.gloryStart = widget.data.gloryStart ? widget.data.gloryStart : widget.data.gloryEnd ? widget.data.gloryEnd : "ff5555";
			if (widget.data.gloryStart === '000000') widget.data.gloryStart = 'ff5555';
			if (widget.data.gloryEnd === '000000') widget.data.gloryEnd = 'ff5555';
			var rainbow = new Rainbow();
			rainbow.setSpectrum(widget.data.gloryStart, widget.data.gloryEnd);
			rainbow.setNumberRange(0, widget.data.topPlayers.length);

			for (var i = 0; i < widget.data.topPlayers.length; i++) {
				if (widget.data.topPlayers[i].minutes > 60) {
					widget.data.topPlayers[i].label = Math.floor(widget.data.topPlayers[i].minutes / 60).toString() + " Hours, " + (widget.data.topPlayers[i].minutes % 60).toString() + " Minutes";
				}else{
					widget.data.topPlayers[i].label = widget.data.topPlayers[i].minutes + " Minutes";
				}
				widget.data.topPlayers[i].label = widget.data.topPlayers[i].player + ": " + widget.data.topPlayers[i].label;

				if (widget.data.useSuperFunMode) {
					var hue = Math.random() * 720;
					var color = 'hsl(' + hue + ','+'100%,40%)';
					var highlight = 'hsl(' + hue + ','+'100%,70%)';
				}else{
					var color = '#' + rainbow.colourAt(i);
					var highlight = color;
				}

				widget.data.chartData.push({ value: widget.data.topPlayers[i].minutes, color: color, highlight: highlight, label: widget.data.topPlayers[i].label });
			}

			widget.data.chartData = JSON.stringify(widget.data.chartData);

			formatWidgetData(widget.data, "Top Players - ");

			app.render('widgetMCTopPlayersGraph', widget.data, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					callback(err, translatedHTML);
				});
			});
		});
	};

	MinecraftWidgets.renderMCServerStatus = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 0 ? "0" : widget.data.serverNumber;
		var config = MinecraftWidgets.settings.get();

		MinecraftWidgets.pushData(widget.data, ['status'], function(err) {

			if (err) {
				widget.data.title = '';
				widget.data.container = '';
				callback(null, '');
				return;
			}

			for (var p in widget.data.status) {
				widget.data[p] = widget.data.status[p];
			}
			delete widget.data.status;

			widget.data.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;
			widget.data.showPlayerCount = widget.data.isServerOnline && widget.data.showPlayerCount == "on" ? true : false;
			widget.data.hidePluginList = widget.data.hidePluginList == "on" ? true : false;
			widget.data.showIP = widget.data.showIP == "on" ? true : false;
			widget.data.showModalMap = widget.data.showModalMap == "on" ? true : false;

			widget.data.showPlayers = widget.data.isServerOnline && widget.data.players.length > 0 ? true : false;
			widget.data.showVersion = widget.data.isServerOnline && widget.data.version ? true : false;

			widget.data.serverHost = config["server" + widget.data.serverNumber + "serverHost"] || "localhost";
			widget.data.serverPort = config["server" + widget.data.serverNumber + "serverPort"];

			// See if there is a port in the host input
			var hostarray = widget.data.serverHost.split(/:/g);
			if ( hostarray.length > 1 ) {
				if ( hostarray.length == 2 ) {
					if ( !widget.data.serverPort ) {
						if (config.logErrors) console.log("Configuration error: Two ports entered. Using (" + hostarray[1] + ") and ignoring (" + widget.data.serverPort + ").");
						widget.data.hasInvalidPort = true;
					}
					widget.data.serverHost = hostarray[0];
					widget.data.serverPort = hostarray[1];
				} else {
					if (config.logErrors) console.log("Configuration error: Invalid host (" + widget.data.serverHost + "). Too many \":\", using default \"0.0.0.0\". ");
					widget.data.serverHost = "0.0.0.0";
					widget.data.hasInvalidHost = true;
				}
			}

			if ( isIP( widget.data.serverHost ) ) {
				if ( widget.data.serverPort !== '25565' ) { widget.data.showPortDomain = true; widget.data.showPortIP = true; }
			}else{
				if ( widget.data.serverPort !== '25565' && widget.data.serverPort !== '' ) widget.data.showPortDomain = true;
				if ( widget.data.showIP && widget.data.showPortDomain ) widget.data.showPortIP = true;
			}

			var readCustomRow = function ( label, text, after ) {
				switch ( after ) {
					case "name":
						if ( !widget.data.customaftername ) { widget.data.customaftername = []; }
						widget.data.customaftername[widget.data.customaftername.length] = { label: label, text: text }
						break;
					case "status":
					default:
						if ( !widget.data.customafterstatus ) { widget.data.customafterstatus = []; }
						widget.data.customafterstatus[widget.data.customafterstatus.length] = { label: label, text: text }
						break;
					case "address":
						if ( !widget.data.customafteraddress ) { widget.data.customafteraddress = []; }
						widget.data.customafteraddress[widget.data.customafteraddress.length] = { label: label, text: text }
						break;
					case "version":
						if ( !widget.data.customafterversion ) { widget.data.customafterversion = []; }
						widget.data.customafterversion[widget.data.customafterversion.length] = { label: label, text: text }
						break;
					case "players":
						if ( !widget.data.customafterplayers ) { widget.data.customafterplayers = []; }
						widget.data.customafterplayers[widget.data.customafterplayers.length] = { label: label, text: text }
						break;
				}
			}

			if ( widget.data.usecustom1 ) readCustomRow( widget.data.custom1label, widget.data.custom1text, widget.data.custom1orderafter );
			if ( widget.data.usecustom2 ) readCustomRow( widget.data.custom2label, widget.data.custom2text, widget.data.custom2orderafter );
			if ( widget.data.usecustom3 ) readCustomRow( widget.data.custom3label, widget.data.custom3text, widget.data.custom3orderafter );

			widget.data.hasInvalidHost  = false;
			widget.data.hasInvalidPort  = false;
			widget.data.hasInvalidQuery = false;

			if (widget.data.showDebugIcons) {
				// widget.data.msgInvalidHost  = "<a class=\"fa fa-exclamation-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Configured host invalid: {serverHost}<br>Using the default localhost\"></a>";
				// widget.data.msgInvalidPort  = "<a class=\"fa fa-exclamation-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Configured server port invalid: {serverPort}<br>Using the default 25565\"></a>";
				// widget.data.msgInvalidQuery = "<a class=\"fa fa-exclamation-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Configured query port invalid: {queryPort}<br>Using the default 25565\"></a>";

				// widget.data.msgFailHost        = "<a class=\"fa fa-exclamation-circle text-danger has-tooltip\" data-html=\"true\" data-title=\"No IP was found for {host}\"></a>";
				// widget.data.msgFailPing        = "<a class=\"fa fa-exclamation-circle text-danger has-tooltip\" data-html=\"true\" data-title=\"Server did not respond to a ServerListPing.\"></a>";

				// widget.data.msgFailListPlayers = "<a class=\"fa fa-question-circle text-info has-tooltip\" data-html=\"true\" data-title=\"Server may be blocking its player list.\"></a>";
				// widget.data.msgFailListMods    = "<a class=\"fa fa-question-circle text-info has-tooltip\" data-html=\"true\" data-title=\"Server may be blocking its mod list.\"></a>";
				// widget.data.msgFailListPlugins = "<a class=\"fa fa-question-circle text-info has-tooltip\" data-html=\"true\" data-title=\"Server may be blocking its plugin list.\"></a>";

				//widget.data.msgFailQuery = "<a class=\"fa fa-question-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Server Query Failed<br>Tried to query the server at {serverIP}:{queryPort}<br>Is enable-query true in server.properties?\"></a>";
				//widget.data.msgFailQuery = widget.data.msgFailQuery.replace("{serverIP}", ( widget.data.serverIP || widget.data.serverHost ) );
				//widget.data.msgFailQuery = widget.data.msgFailQuery.replace("{queryPort}", widget.data.queryPort);
			}

			if (widget.data.isServerOnline) {
				if (widget.data.modList.length > 0) widget.data.hasMods = true;
				if (widget.data.pluginList.length > 0) widget.data.hasPlugins = true;
			}

			if (widget.data.hidePluginList) widget.data.pluginList = [];

			if (!widget.data.version && widget.data.isServerOnline) {
				widget.data.isServerOnline = false;
				widget.data.isServerRestarting = true;
			}
			if (!widget.data.isServerOnline && !widget.data.isServerRestarting) widget.data.isServerOffline = true;

			if (widget.data.showPlayers) {
				var avatarCDN = MinecraftWidgets.settings.get().avatarCDN ? MinecraftWidgets.settings.get().avatarCDN : "minotar";
				widget.data.avatarSize = MinecraftWidgets.settings.get().avatarSize ? MinecraftWidgets.settings.get().avatarSize : "40";
				widget.data.avatarSize = MinecraftWidgets.settings.get().avatarCDN === 'signaturecraft' ? widget.data.avatarSize / 8 : widget.data.avatarSize;
				widget.data.avatarStyle = MinecraftWidgets.settings.get().avatarStyle ? MinecraftWidgets.settings.get().avatarStyle : "flat";
				switch (avatarCDN) {
					default:
					case "minotar":
						widget.data.avatarCDNminotar = true;
						break;
					case "signaturecraft":
						widget.data.avatarCDNsignaturecraft = true;
						break;
					case "cravatar":
						widget.data.avatarCDNcravatar = true;
						break;
				}

				if (widget.data.showGlory) {
					if (!widget.data.gloryStart) widget.data.gloryStart = "000000";
					if (!widget.data.gloryEnd) widget.data.gloryEnd = "000000";
					var gloryStart = [ parseInt(widget.data.gloryStart.substring(0,2),16), parseInt(widget.data.gloryStart.substring(2,4),16), parseInt(widget.data.gloryStart.substring(4,6),16) ];
					var gloryEnd = [ parseInt(widget.data.gloryEnd.substring(0,2),16), parseInt(widget.data.gloryEnd.substring(2,4),16), parseInt(widget.data.gloryEnd.substring(4,6),16) ];
					var gloryStep =  [ Math.round( (gloryEnd[0]-gloryStart[0]) / widget.data.onlinePlayers ), Math.round( (gloryEnd[1]-gloryStart[1]) / widget.data.onlinePlayers ), Math.round( (gloryEnd[2]-gloryStart[2]) / widget.data.onlinePlayers ) ];

					for (var i = 0; i < widget.data.players.length; i++) {
						widget.data.players[i].glory = "#" + ("00" + (gloryStart[0] + gloryStep[0] * i).toString(16)).substr(-2) + ("00" + (gloryStart[1] + gloryStep[1] * i).toString(16)).substr(-2) + ("00" + (gloryStart[2] + gloryStep[2] * i).toString(16)).substr(-2);
					}
				}

				widget.data.avatarMargin = 5;
			}

			if (!widget.data.mapURI) widget.data.mapURI = 'http://' + MinecraftWidgets.settings.get('server' + widget.data.serverNumber + 'serverHost') + ':8123/';
			widget.data.minimapURI = widget.data.mapURI + '?nopanel=true&hidechat=true&nogui=true';
			widget.data.modalID = "serverstatusmap" + widget.data.serverNumber;

			if (widget.data.showModalMap) widget.data.title += '<i class="fa fa-compass pointer pull-right has-tooltip" data-title="Open Map" data-toggle="modal" data-target="#mcwe-modal-'+widget.data.modalID+'" style="font-size: 20px;"></i>';
			formatWidgetData(widget.data);

			if (widget.data.serverMOTD) {
				widget.data.serverMOTD = parseMCFormatCodes( widget.data.serverMOTD );
				switch (widget.data.showMOTD) {
					case "afterTitle":
						widget.data.serverMOTD = " ~" + widget.data.serverMOTD + "~";
						if(typeof widget.data.colorMOTD !== 'undefined') widget.data.serverMOTD = "<span style=\"color:#" + widget.data.colorMOTD + ";\">" + widget.data.serverMOTD + "</span>";
						widget.data.title = widget.data.title + widget.data.serverMOTD;
						break;
					case "replaceTitle":
						if(typeof widget.data.colorMOTD !== 'undefined') widget.data.serverMOTD = "<span style=\"color:#" + widget.data.colorMOTD + ";\">" + widget.data.serverMOTD + "</span>";
						widget.data.title = widget.data.serverMOTD;
						break;
					case "asRow":
						widget.data.showRowMOTD = true;
						break;
					case "nowhere":
					default:
						break;
				}
			}

			app.render('widgetMCServerStatus', widget.data, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					callback(err, translatedHTML);
				});
			});
		});
	};

	function formatWidgetData ( data, titlePrefix, titleSuffix ) {
		var config = MinecraftWidgets.settings.get();
		if (!titlePrefix) titlePrefix = "";
		if (!titleSuffix) titleSuffix = "";
		if (data.serverNumber && config["server" + data.serverNumber + "serverName"]) {
			data.serverTitle = parseMCFormatCodes( MinecraftWidgets.settings.get()["server" + data.serverNumber + "serverName"] );
			if(typeof data.colorTitle !== 'undefined') {
				data.serverTitle = "<span style=\"color:#" + data.colorTitle + ";\">" + data.serverTitle + "</span>";
			}
		}
		if (!data.title) {
			if ( data.serverTitle ) {
				data.title = titlePrefix + data.serverTitle + titleSuffix;
			}else{
				data.title = titlePrefix + "Server " + data.serverNumber + titleSuffix;
			}
		}else{
			if(typeof data.colorTitle !== 'undefined') {
				data.title = "<span style=\"color:#" + data.colorTitle + ";\">" + data.title + "</span>";
			}
			data.title = parseMCFormatCodes(titlePrefix + data.title + titleSuffix);
		}
		if (!data.container && !data.useEmptyContainer) data.container = '<div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title">{title}</h3></div><div class="panel-body">{body}</div></div>';
	}

	function verifyHost(data, hostBack) {
		if ( isIP(data.serverHost) ) {
			data.status.serverIP = data.serverHost;
			hostBack(null, data);
		}else{
			data.status.serverHost = data.serverHost;
			getSRV(data.serverHost, function(err, theHost, thePort) {
				if ( err ) {
					getIP(data.serverHost, function(err, theIP) {
						if (err) {
							hostBack(err, data);
						}else{
							data.status.serverIP = theIP;
							hostBack(null, data);
						}
					});
				}else{
					data.serverPort = thePort;
					if ( isIP(theHost) ) {
						data.status.serverIP = theHost;
						hostBack(null, data);
					}else{
						getIP(theHost, function(err, theIP) {
							if (err) {
								hostBack(err, data);
							}else{
								data.status.serverIP = theIP;
								hostBack(null, data);
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
				console.error("Couldn't find an IP for " + ( host || "undefined" ) + ", is it a valid address?");
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
				//console.info("No SRV for " + host)
				srvBack(true);
			}else{
				//console.info("Found SRV record for " + host);
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

	function readServerListPing(data, callback) {
		var hostData = { 'host':( MinecraftWidgets.settings.get()['server' + data.serverNumber + 'requestIP'] || data.status.serverIP || data.serverHost ), 'port':data.serverPort };
		if (MinecraftWidgets.settings.get().logDebug) console.log("Sending ServerListPing to " + hostData.host + ":" + hostData.port);
		var dataLength = -1, currentLength = 0, chunks = [];
		var socket = net.connect( hostData, function() {
			modernRequestBack(socket, hostData);
		});

		socket.setTimeout(4000, function () {
			socket.destroy();
			if (MinecraftWidgets.settings.get().logErrors) console.log("ServerListPing timed out when connecting to " + hostData.host + ":" + hostData.port);
			data.failPing = true;
			data.failTime = true;
		});

		socket.on('data', function(serverStatusPingData) {
			data.status.isServerOnline = true;

			try {
				if(dataLength < 0) {
					dataLength = varint.decode(serverStatusPingData);
					serverStatusPingData = serverStatusPingData.slice(varint.decode.bytes);
					if(serverStatusPingData[0] != 0x00) {
						console.log("Bad handshake.");
						socket.destroy();
					}
					serverStatusPingData = serverStatusPingData.slice(1);
					currentLength++;
				}else if (dataLength === 99){
					if(serverStatusPingData[0] == 0x01) {
						var ping = Date.now() - bufferpack.unpack(L, serverStatusPingData, 1);
						console.log("GOT PING " + ping + "ms");
						socket.destroy();
					}else{
						console.log("Bad handshake.");
						socket.destroy();
					}
				}
				currentLength += serverStatusPingData.length;
				chunks.push(serverStatusPingData);

				if(currentLength >= dataLength) {
					if (MinecraftWidgets.settings.get().logDebug) console.log("ServerListPing packet received from " + hostData.host + ":" + hostData.port);

					serverStatusPingData = Buffer.concat(chunks);
					var strLen = varint.decode(serverStatusPingData);
					var strLenOffset = varint.decode.bytes;
					var resp = JSON.parse(serverStatusPingData.toString("utf8", strLenOffset));

					if (resp.description) data.status.serverMOTD = resp.description;

					//data.status.protocolVersion = resp.version.protocolVersion;

					var versionSplit = resp.version.name.split(/ /g);
					if (versionSplit.length > 1) {
						data.status.version = versionSplit.pop();
						if (versionSplit[0].search("Bukkit") >= 0 || versionSplit[0].search("MCPC") >= 0 || versionSplit[0].search("Cauldron") >= 0) {
							data.status.pluginInfo = true;
						}
					}else{
						data.status.version = versionSplit[0];
					}

					data.status.onlinePlayers = resp.players.online;
					data.status.maxPlayers = resp.players.max;

					if(resp.players.sample) {
						data.status.players = resp.players.sample;
					}
					if(resp.favicon) data.status.icon = resp.favicon;

					if(resp.modinfo) {
						var fullModList = resp.modinfo.modList.slice(2);
						var modNames = [];
						data.status.modList = [];
						for (var i = 0; i < fullModList.length; i++) {
							var pipedMod = fullModList[i].modid.split("|")[0];
							if (modNames.indexOf(pipedMod) == -1) {
								modNames.push(pipedMod);
								data.status.modList.push({modid: pipedMod});
							}
						}
					}

					dataLength = 99;
					modernPingBack(socket, hostData);
				}
			} catch(err) {
				console.log(err);
				socket.destroy();
			}
		});

		socket.on('error', function(err) {
			if (MinecraftWidgets.settings.get().logErrors) console.log(err);
		});

		socket.on('close', function(err) {
			if (err) if (MinecraftWidgets.settings.get().logErrors) console.log("Connection was closed unexpectedly: " + err);
			callback(null, data);
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

	function modernPingBack(socket, hostData) {
		var buf = [
			packData([
				new Buffer([0x01]),
				bufferpack.pack("L", Date.now())
			])
		];

		socket.write(buf[0]);
	};

	function packData(raw) {
		if ( raw instanceof Array ) raw = Buffer.concat(raw);
		return Buffer.concat( [ new Buffer(varint.encode(raw.length)), raw ] );
	};

	function queryServer(data, queryBack) {
		var queryData = { host: MinecraftWidgets.settings.get()['server' + data.serverNumber + 'requestIP'] || data.status.serverIP || data.serverHost, port: data.queryPort };

		if (MinecraftWidgets.settings.get().logDebug) console.log("Querying " + queryData.host + ":" + queryData.port);

		var query = new mcquery( queryData.host, queryData.port, {timeout: 10000} );

		query.connect(function (err) {
			if (err) {
				if (MinecraftWidgets.settings.get().logErrors) console.log("Query failed for " + ( data.status.serverIP || data.serverHost ) + ":" + data.queryPort + ", is query-enabled set to true in server.properties?" );
				data.failQuery = true;
				if(!data.status.pluginList) data.status.pluginList = [];
				queryBack(null, data);
			} else {
				data.queryonline = true;
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
			if (!err) {
				data.status.isServerOnline = true;

				if (stat.MOTD) data.status.serverMOTD = stat.MOTD;

				if ( stat.player_ && data.status.players.length === 0 ) {
					for (var index = 0; index < stat.player_.length; ++index) {
						data.status.players[data.status.players.length] = { name: stat.player_[index] };
					}
				}

				if (stat.plugins) {
					data.status.pluginInfo = true;
					var pluginString = stat.plugins.split(": ")[1].split("; ");
					data.status.pluginList = [];
					var index;
					for (index = 0; index < pluginString.length; ++index) {
						data.status.pluginList[data.status.pluginList.length] = { name: pluginString[index] };
					}
					if (data.status.pluginList.length > 1) data.status.showPluginList = true;
				}

				data.status.onlinePlayers = stat.numplayers;
				data.status.maxPlayers = stat.maxplayers;
				data.status.version = stat.version;

				// Use queried hostname if none was specified.
				if ( data.serverHost == "0.0.0.0" || data.serverHost == "127.0.0.1" || data.serverHost == "localhost" ) {
					data.serverHost = stat.hostip;
					if ( stat.hostport != "25565" ) {
						data.serverPort = stat.hostport;
					}
				}

				shouldWeClose();
			}

			queryBack(err, data);
		}

		function shouldWeClose() {
			//have we got all answers
			if (query.outstandingRequests() === 0) {
				query.close();
			}
		}
	}

	function parseMCFormatCodes ( name ) {
		var spancount = name.split("§").length - 1;
		name = name.replace(/§0/g, "<span style=\"color:#000000;\">");
		name = name.replace(/§1/g, "<span style=\"color:#0000AA;\">");
		name = name.replace(/§2/g, "<span style=\"color:#00AA00;\">");
		name = name.replace(/§3/g, "<span style=\"color:#00AAAA;\">");
		name = name.replace(/§4/g, "<span style=\"color:#AA0000;\">");
		name = name.replace(/§5/g, "<span style=\"color:#AA00AA;\">");
		name = name.replace(/§6/g, "<span style=\"color:#FFAA00;\">");
		name = name.replace(/§7/g, "<span style=\"color:#AAAAAA;\">");
		name = name.replace(/§8/g, "<span style=\"color:#555555;\">");
		name = name.replace(/§9/g, "<span style=\"color:#5555FF;\">");
		name = name.replace(/§a/g, "<span style=\"color:#55FF55;\">");
		name = name.replace(/§b/g, "<span style=\"color:#55FFFF;\">");
		name = name.replace(/§c/g, "<span style=\"color:#FF5555;\">");
		name = name.replace(/§d/g, "<span style=\"color:#FF55FF;\">");
		name = name.replace(/§e/g, "<span style=\"color:#FFFF55;\">");
		name = name.replace(/§f/g, "<span style=\"color:#FFFFFF;\">");
		name = name.replace(/§k/g, "<span>");
		name = name.replace(/§l/g, "<span style=\"font-weight: bold;\">");
		name = name.replace(/§m/g, "<span style=\"text-decoration: line-through;\">");
		name = name.replace(/§n/g, "<span style=\"text-decoration: underline;\">");
		name = name.replace(/§o/g, "<span style=\"font-style: italic;\">");
		name = name.replace(/§r/g, "<span style=\"font-style: normal; text-decoration: none; font-weight: normal; color:#000000;\">");
		name = name.replace(/§/g, "<span>");
		for ( var i = 0; i < spancount; i++ ) name = name + "</span>";
		return name;
	}

	MinecraftWidgets.defineWidgets = function(widgets, callback) {
		var data = { 'serverConfigNames': [] };
		var config = MinecraftWidgets.settings.get();
		for (var serverNumber = 0; serverNumber < 10; serverNumber++) {
			if ( config['server' + serverNumber + 'isDisabled'] || typeof config['server' + serverNumber + 'isDisabled'] === 'undefined' ) continue;
			data.serverConfigNames.push({ 'configName': MinecraftWidgets.settings.get()["server" + serverNumber + "serverConfigName"] || "Server " + serverNumber , 'serverNumber': serverNumber.toString() });
		}

		var contentMCDynmapMiniMap      = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCDynmapMiniMap.tpl'], data);
		var contentMCOnlinePlayersGraph = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCOnlinePlayersGraph.tpl'], data);
		var contentMCOnlinePlayersGrid  = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCOnlinePlayersGrid.tpl'], data);
		var contentMCServerStatus       = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCServerStatus.tpl'], data);
		var contentMCTopPlayersGraph    = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCTopPlayersGraph.tpl'], data);
		var contentMCTopPlayersList     = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCTopPlayersList.tpl'], data);

		widgets = widgets.concat([
			{
				widget: "widgetMCDynmapMiniMap",
				name: "Dynmap Mini Map",
				description: "SHows a small Map.",
				content: contentMCDynmapMiniMap
			},
			{
				widget: "widgetMCOnlinePlayersGraph",
				name: "Minecraft Online Players Graph",
				description: "Shows a graph showing online players over time.",
				content: contentMCOnlinePlayersGraph
			},
			{
				widget: "widgetMCOnlinePlayersGrid",
				name: "Minecraft Online Players Grid",
				description: "Shows the avatars of online players.",
				content: contentMCOnlinePlayersGrid
			},
			{
				widget: "widgetMCServerStatus",
				name: "Minecraft Server Status",
				description: "Lists information on a Minecraft server.",
				content: contentMCServerStatus
			},
			{
				widget: "widgetMCTopPlayersGraph",
				name: "Minecraft Top Players Graph",
				description: "A graphic chart (Pie, Donut, or Bar) representing the top players' approximate play time.",
				content: contentMCTopPlayersGraph
			},
			{
				widget: "widgetMCTopPlayersList",
				name: "Minecraft Top Players List",
				description: "Lists avatars of players sorted by their approximate play time.",
				content: contentMCTopPlayersList
			}
		]);

		callback(null, widgets);
	};

	module.exports = MinecraftWidgets;
})();
