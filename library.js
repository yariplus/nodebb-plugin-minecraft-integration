(function() {
	"use strict";
	
	// All your sanity and wits they will all vanish, I promise.
	
	var async = require('async'),
		fs = require('fs'),
		path = require('path'),
		db = module.parent.require('./database'),
		meta = module.parent.require('./meta'),
		Settings = module.parent.require('./settings'),
		user = module.parent.require('./user'),
		plugins = module.parent.require('./plugins'),
		templates = module.parent.require('templates.js'),
		websockets = module.parent.require('./socket.io'),
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
						'resetDatabase': false,
						'serverUpdateDelay': '1',
						'showDebugIcons': true,
						'logErrors': true,
						'logDebug': false,
						
						'avatarCDN': "cravatar",
						'avatarSize': "40",
						'avatarStyle': "flat",
					
						'server1isDisabled': false,
						'server1serverConfigName': 'Server One',
						'server1serverName': 'Server One',
						'server1isLegacy': false,
						'server1serverHost': '',
						'server1serverIP': '',
						'server1serverPort': '',
						'server1queryPort': '',
						'server1rconPort': '',
						'server1rconPass': '',
						
						'server2isDisabled': true,
						'server2serverConfigName': 'Server Two',
						'server2serverName': 'Server Two',
						'server2isLegacy': false,
						'server2serverHost': '',
						'server2serverIP': '',
						'server2serverPort': '',
						'server2queryPort': '',
						'server2rconPort': '',
						'server2rconPass': '',
						
						'server3isDisabled': true,
						'server3serverConfigName': 'Server Three',
						'server3serverName': 'Server Three',
						'server3isLegacy': false,
						'server3serverHost': '',
						'server3serverIP': '',
						'server3serverPort': '',
						'server3queryPort': '',
						'server3rconPort': '',
						'server3rconPass': ''
					};
				
				MinecraftWidgets.settings = new Settings('minecraft-essentials', '0.2.11.2', defaultSettings, function() {
					var config = MinecraftWidgets.settings.get();
					if (config.logDebug) {
						for ( var p in config ) {
							console.log(p + ": " + config[p]);
						}
					}
					setTimeout(MinecraftWidgets.updateServers, MinecraftWidgets.settings.get().logDebug ? 60000 : 5000);
				});
				
				SocketAdmin.settings.syncMinecraftEssentials = function () {
					MinecraftWidgets.settings.sync();
				};
					
				if (MinecraftWidgets.settings.get().resetDatabase) {
					for (var i = 1; i <= 3; i++) {
						db.delete(i + "S", function(err) {
							if (err) console.log("Error deleting " + i + "S" + err);
						});
						db.delete(i + "PD", function(err) {
							if (err) console.log("Error deleting " + i + "PD" + err);
						});
						db.delete(i + "PS", function(err) {
							if (err) console.log("Error deleting " + i + "PS" + err);
						});
					}
				}

				var templatesToLoad = [
					"widgetMCOnlinePlayersGraph.tpl",
					"widgetMCOnlinePlayersGrid.tpl",
					"widgetMCServerStatus.tpl",
					"widgetMCTopPlayersGraph.tpl",
					"widgetMCTopPlayersList.tpl",
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
			pushData: function(data, callback) {
				// Get information from the database and push it into the data object.
				var requestData = data.requestData ? data.requestData[0] : "S";
				delete data.requestData;
				var serverKey = ( data.serverNumber || "1") + requestData;
				if (MinecraftWidgets.settings.get().logDebug) console.log("Looking for db key: " + serverKey);
				db.getObject(serverKey, function(err, dbo) {
					if (err) {
						if (MinecraftWidgets.settings.get().logErrors) console.log("Database failed to find " + serverKey + ": " + err);
					}
					for (var prop in dbo) data[prop] = dbo[prop];
					callback(err, data);
				});
			},
			updateServers: function() {
				// Read from plugin config
				var data;
				for (var serverNumber = 1; serverNumber <= 3; serverNumber++) {
					if (MinecraftWidgets.settings.get()['server' + serverNumber + 'isDisabled']) continue;
					data = {};
					data.serverNumber = serverNumber;
					data.serverName = MinecraftWidgets.settings.get()['server' + serverNumber + 'serverName'] || "Server " + serverNumber;
					data.serverHost = MinecraftWidgets.settings.get()['server' + serverNumber + 'serverHost'] || "0.0.0.0";
					data.serverPort = MinecraftWidgets.settings.get()['server' + serverNumber + 'serverPort'] || "25565";
					data.queryPort  = MinecraftWidgets.settings.get()['server' + serverNumber + 'queryPort'];
					data.rconPort   = MinecraftWidgets.settings.get()['server' + serverNumber + 'rconPort']   || "25575";
					data.rconPass   = MinecraftWidgets.settings.get()['server' + serverNumber + 'rconPass']   || "password";
					
					// Set all fields to false/empty.
					data.isServerOnline = false;
					data.version = '';
					data.serverMOTD = '';
					data.failPing = false;
					data.failQuery = false;
					data.failTime = false;
					data.onlinePlayers = '0';
					data.icon = '';
					data.players = [];
					data.modList = [];
					data.pluginList = [];
					
					// See if there is a port in the host input
					var hostarray = data.serverHost.split(/:/g);
					if ( hostarray.length > 1 ) {
						if ( hostarray.length == 2 ) {
							if ( !data.serverPort ) {
								if (MinecraftWidgets.settings.get().logErrors) console.log("Configuration error: Two ports entered. Using (" + hostarray[1] + ") and ignoring (" + data.serverPort + ").");
								data.hasInvalidPort = true;
							}
							data.serverHost = hostarray[0];
							data.serverPort = hostarray[1];
						} else {
							if (MinecraftWidgets.settings.get().logErrors) console.log("Configuration error: Invalid host (" + data.serverHost + "). Too many \":\", using default \"0.0.0.0\". ");
							data.serverHost = "0.0.0.0";
							data.hasInvalidHost = true;
						}
					}
					
					if (MinecraftWidgets.settings.get().logDebug) console.log("Updating server status for " + ( data.serverName || "Unnamed Server" ) + " (Server " + serverNumber + ")\nConfigured Host: " + ( data.serverHost || "default" ) + "   Port: " + ( data.serverPort || "default" ) + "   Query: " + ( data.queryPort || "default" ));
					
					MinecraftWidgets.pushServerStatusPing(data, MinecraftWidgets.updateDatabase);
				}
				setTimeout(MinecraftWidgets.updateServers, 60000);
			},
			pushServerStatusPing: function(data, callback) {
				verifyHost(data, function(err, data) {
					if (MinecraftWidgets.settings.get().logErrors) console.log("Resolved host " + ( data.serverHost || "localhost" ) + " to " + data.serverIP + ":" + data.serverPort + " query at port " + data.queryPort);
					if (MinecraftWidgets.settings.get()['server'+data.serverNumber+'isLegacy']) {
						if (MinecraftWidgets.settings.get().logDebug) console.log("Using legacy ServerListPing for " + data.serverHost); 
						mcping(data.serverIP, parseInt(data.serverPort), function(err, resp) {
							if (!err) {
								data.isServerOnline = true;
								data.onlinePlayers = resp.num_players;
								data.maxPlayers = resp.max_players;
								data.serverName = resp.server_name;
								if (resp.version) data.version = resp.version;
							  
								if(resp.modinfo) {
									var fullModList = resp.modinfo.modList.slice(2);
									var modNames = [];
									data.modList = [];
									for (var i = 0; i < fullModList.length; i++) {
										var pipedMod = fullModList[i].modid.split("|")[0];
										if (modNames.indexOf(pipedMod) == -1) {
											modNames.push(pipedMod);
											data.modList.push({modid: pipedMod});
										}
									}
								}
								
								queryServer(data, function(err, queryData) {
									data = queryData;
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
						readServerListPing(data, function(err, data) {
							if (err) {
								//MinecraftWidgets.doFetchRCON( data );
								MinecraftWidgets.updateDatabase( data );
							}else{
								queryServer(data, function(err, data) {
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
					if (MinecraftWidgets.settings.get().logDebug) console.log("Connecting to RCON at " + data.serverIP + ":" + data.rconPort);
					var conn = new rcon(data.serverIP, data.rconPort, data.rconPass);
					
					conn.on('auth', function() {
						if (MinecraftWidgets.settings.get().logDebug) console.log("Successfully connected to RCON at " + data.serverIP + ":" + data.rconPort);
						conn.send('time');
					}).on('response', function(str) {
						console.log("Got response: " + str);
						conn.disconnect();
					}).on('end', function() {
						if (MinecraftWidgets.settings.get().logDebug) console.log("RCON connection closed at " + data.serverIP + ":" + data.rconPort);
						MinecraftWidgets.updateDatabase( data );
					}).on('error', function() {
						if (MinecraftWidgets.settings.get().logErrors) console.log("RCON connection failed at " + data.serverIP + ":" + data.rconPort);
						MinecraftWidgets.updateDatabase( data );
					});
					conn.connect();
				}
			},
			updateDatabase: function( data ) {
				// Keys: { Status: #S, PingedData: #PD, PlayerStats: #PS, }
				if ( data && data.serverNumber ) {
					if (MinecraftWidgets.settings.get().logDebug) console.log("Setting status key " + data.serverNumber + "S.");
					db.setObject(data.serverNumber + "S", data, function (err){
						if (err) console.log(err);
						
						if (data.onlinePlayers) {
							db.getObject(data.serverNumber + "PD", function(err, dbo) {
								if (err || !dbo) {
									dbo = { 'onlinePlayers': [], 'time': [], 'players': [] };
								}
								
								if (!dbo.onlinePlayers) dbo.onlinePlayers = [];
								if (!dbo.time) dbo.time = [];
								if (!dbo.players) dbo.players = [];
								
								// TODO: Fix this to be locale independent.
								var time = (new Date()).toLocaleTimeString();
								time = time.slice(0,time.lastIndexOf(":"));
								
								// TODO: Add configurable limit.
								if (dbo.time.push(time) > 30)
								{
									dbo.time.shift();
								}
								if (dbo.onlinePlayers.push(data.onlinePlayers) > 30)
								{
									dbo.onlinePlayers.shift();
								}
								if (dbo.players.push(data.players || []) > 30) {
									dbo.players.shift();
								}
								
								if (MinecraftWidgets.settings.get().logDebug) console.log("Setting ping data key " + data.serverNumber + "PD.");
								db.setObject(data.serverNumber + "PD", dbo, function (err) {
									if (err) console.log(err);
									
									if (data.players && data.players.length > 0) {
										db.getObject(data.serverNumber + "PS", function(err, dbo) {
											if (err || !dbo) {
												// { PLAYER: { minutes: INT } }
												dbo = { playerStats: {} };
											}
											
											// Add minutes
											for (var i = 0; i < data.players.length; i++) {
												if (dbo.playerStats.hasOwnProperty(data.players[i].name)) {
													if (dbo.playerStats[data.players[i].name].minutes) {
														dbo.playerStats[data.players[i].name].minutes++;
													}else{
														dbo.playerStats[data.players[i].name].minutes = 1;
													}
												}else{
													dbo.playerStats[data.players[i].name] = { minutes: 1 };
												}
											}
											
											if (MinecraftWidgets.settings.get().logDebug) console.log("Setting players statistics key " + data.serverNumber + "PS.");
											db.setObject(data.serverNumber + "PS", dbo, function (err) {
												if (err) console.log(err);
											});
										});
									}
								});
							});							
						}
					});					
				}
			}
		};
	
	MinecraftWidgets.renderMCTopPlayersList = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 1 ? "1" : widget.data.serverNumber;
		
		widget.data.showTopPlayers = parseInt(widget.data.showTopPlayers);
		widget.data.showTopPlayers = isNaN(widget.data.showTopPlayers) ? 5 : widget.data.showTopPlayers < 1 ? 5 : widget.data.showTopPlayers;
		
		MinecraftWidgets.pushData(widget.data, function(err) {
			if (err || !widget.data.serverName) {
				console.log("status data error");
				callback(null, "");
				return;
			}
			widget.data.requestData = ["PS"];
			MinecraftWidgets.pushData(widget.data, function(err) {
				if (err || !widget.data.serverName) {
					console.log("players data error");
					callback(null, "");
					return;
				}
				
				widget.data.players = [];
				for (var player in widget.data.playerStats) { widget.data.players.push({ 'name': player, 'minutes': widget.data.playerStats[player].minutes }); }
				widget.data.players.sort(function(a, b) { return b.minutes - a.minutes; });
				while (widget.data.players.length > widget.data.showTopPlayers) widget.data.players.pop();
				
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
		});
	}
		
	MinecraftWidgets.renderMCOnlinePlayersGraph = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 1 ? "1" : widget.data.serverNumber;
		
		widget.data.requestData = [ "PD" ];
		MinecraftWidgets.pushData(widget.data, function(err){
			if (err) {
				console.log(err);
			}
			
			if (!widget.data.onlinePlayers) widget.data.onlinePlayers = [];
			
			// TODO: This unshift should probably go in the lookup function.
			widget.data.labels = [];
			for (var i = 0; i < widget.data.onlinePlayers.length; i++ ) {
				if (widget.data.time && widget.data.time[i]) {
					widget.data.labels.push(widget.data.time[i]);
				}else{
					widget.data.labels.unshift("");
				}
			}
			
			var onlinePlayers = JSON.stringify(widget.data.onlinePlayers);
			widget.data.labels = JSON.stringify(widget.data.labels);
			
			MinecraftWidgets.pushData(widget.data, function(err) {
				if (err) {
					console.log(err);
				}
				
				widget.data.onlinePlayers = onlinePlayers;
				
				formatWidgetData(widget.data, "Online Players - ");
				
				app.render('widgetMCOnlinePlayersGraph', widget.data, function(err, html) {
					translator.translate(html, function(translatedHTML) {
						callback(err, translatedHTML);
					});
				});
			});
		});
	};
	
	MinecraftWidgets.renderMCOnlinePlayersGrid = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 1 ? "1" : widget.data.serverNumber;
		
		widget.data.requestData = [ "PD" ];
		MinecraftWidgets.pushData(widget.data, function(err){
			if (err) {
				console.log(err);
			}
			if (!widget.data) {
				console.log("onlinePlayers data was null, skipping widget render.");
				callback(null, "");
				return;
			}
			
			MinecraftWidgets.pushData(widget.data, function(err) {
				if (err || !widget.data.serverName) {
					console.log("serverStatus data was null, skipping widget render.");
					callback(null, "");
					return;
				}
				
				if (widget.data.players.length < 1) {
					widget.data.title = '';
					widget.data.container = '';
					callback(null, '');
					return;
				}
				
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
		});
	};
	
	MinecraftWidgets.renderMCTopPlayersGraph = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 1 ? "1" : widget.data.serverNumber;
		
		widget.data.requestData = [ "PS" ];
		MinecraftWidgets.pushData(widget.data, function(err){
			if (err) {
				console.log("status data error");
				callback(null, "");
				return;
			}
			MinecraftWidgets.pushData(widget.data, function(err) {
				if (err || !widget.data.serverName) {
					console.log("server data error");
					callback(null, "");
					return;
				}
				
				widget.data.showTopPlayers = parseInt(widget.data.showTopPlayers);
				widget.data.showTopPlayers = isNaN(widget.data.showTopPlayers) ? 5 : widget.data.showTopPlayers < 1 ? 5 : widget.data.showTopPlayers;
				
				widget.data.topPlayers = [];
				for (var player in widget.data.playerStats) {
					widget.data.topPlayers.push({ 'player': player, 'minutes': widget.data.playerStats[player].minutes });
				}
				widget.data.topPlayers.sort(function(a, b) { return b.minutes - a.minutes; });
				while (widget.data.topPlayers.length > widget.data.showTopPlayers) {
					widget.data.topPlayers.pop();
				}
				
				widget.data.chartOptions = "{ responsive: true, tooltipTemplate: \"<%if (label){%><%=label%>: <%}%><%= value %> Minutes\" }";
				widget.data.chartData = [];
				for (var i = 0; i < widget.data.topPlayers.length; i++) {
					var newdata = { 'value': widget.data.topPlayers[i].minutes, 'color': '','highlight': '', 'label': widget.data.topPlayers[i].player };
					var hue = Math.random() * 720;
					newdata.color = 'hsl(' + hue + ','+'100%,40%)';
					newdata.highlight = 'hsl(' + hue + ','+'100%,70%)';
					widget.data.chartData.push(newdata);
				}
				widget.data.chartData = JSON.stringify(widget.data.chartData);
				
				formatWidgetData(widget.data, "Top Players - ");
				
				app.render('widgetMCTopPlayersGraph', widget.data, function(err, html) {
					translator.translate(html, function(translatedHTML) {
						callback(err, translatedHTML);
					});
				});
			});
		});
	};

	MinecraftWidgets.renderMCServerStatus = function(widget, callback) {
		widget.data.serverNumber = isNaN(parseInt(widget.data.serverNumber)) || parseInt(widget.data.serverNumber) < 1 ? "1" : widget.data.serverNumber;
		
		MinecraftWidgets.pushData(widget.data, function(err){
			if (err || !widget.data.serverName) {
				callback(null, "");
				return;
			}
			
			widget.data.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;
			widget.data.showPlayerCount = widget.data.showPlayerCount == "on" ? true : false;
			widget.data.showDebugIcons = widget.data.showDebugIcons == "on" ? true : false;
			widget.data.showIP = widget.data.showIP == "on" ? true : false;
			
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
				
				widget.data.msgFailQuery = "<a class=\"fa fa-question-circle text-warning has-tooltip\" data-html=\"true\" data-title=\"Server Query Failed<br>Tried to query the server at {serverIP}:{queryPort}<br>Is enable-query true in server.properties?\"></a>";
				widget.data.msgFailQuery = widget.data.msgFailQuery.replace("{serverIP}", ( widget.data.serverIP || widget.data.serverHost ) );
				widget.data.msgFailQuery = widget.data.msgFailQuery.replace("{queryPort}", widget.data.queryPort);
			}
			
			widget.data.showPlayers = widget.data.isServerOnline && widget.data.players.length > 0 ? true : false;
			widget.data.showPlayerCount = widget.data.isServerOnline && widget.data.showPlayerCount ? true : false;
			widget.data.showVersion = widget.data.isServerOnline && widget.data.version ? true : false;
			
			if (widget.data.modList.length > 0) widget.data.hasMods = true;
			if (widget.data.pluginList.length > 0) widget.data.hasPlugins = true;
			
			if (widget.data.showIP && widget.data.serverPort != "25565") widget.data.showPortIP = true;
			
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
			
			formatWidgetData(widget.data);
			
			app.render('widgetMCServerStatus', widget.data, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					callback(err, translatedHTML);
				});
			});
		});
	};
	
	function formatWidgetData ( data, titlePrefix ) {
		if(!titlePrefix) titlePrefix = "";
		data.title = !data.title && !data.useEmptyContainer ? parseMCFormatCodes(titlePrefix + MinecraftWidgets.settings.get()["server" + data.serverNumber + "serverName"] ) : parseMCFormatCodes(titlePrefix + data.title);
		if (!data.container && !data.useEmptyContainer) data.container = '<div class="panel panel-default"><div class="panel-heading">{title}</div><div class="panel-body">{body}</div></div>';
	}
	
	function verifyHost(templateData, hostBack) {
		if ( isIP(templateData.serverHost) ) {
			if (MinecraftWidgets.settings.get().logDebug) console.log("Host is IP, not looking up DNS or SRV.");
			templateData.serverIP = templateData.serverHost;
			templateData.showPortDomain = true;
			templateData.showIP = false;
			hostBack(null, templateData);
		}else{
			getSRV(templateData.serverHost, function(err, theHost, thePort) {
				if ( err ) {
					getIP(templateData.serverHost, function(err, theIP) {
						if (err) {
							templateData.failHost = true;
							hostBack(err, templateData);
						}else{
							templateData.serverIP = theIP;
							if (templateData.serverPort !== "25565") templateData.showPortDomain = true;
							hostBack(null, templateData);
						}
					});
				}else{
					templateData.serverPort = thePort;
					if ( isIP(theHost) ) {
						templateData.serverIP = theHost;
						hostBack(null, templateData);
					}else{
						getIP(theHost, function(err, theIP) {
							if (err) {
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
		var hostData = { 'host':( data.serverIP || data.serverHost ), 'port':data.serverPort };
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
			data.isServerOnline = true;
			
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
					if (MinecraftWidgets.settings.get().logErrors) console.log("ServerListPing packet received from " + hostData.host + ":" + hostData.port);
					
					serverStatusPingData = Buffer.concat(chunks);
					var strLen = varint.decode(serverStatusPingData);
					var strLenOffset = varint.decode.bytes;
					var resp = JSON.parse(serverStatusPingData.toString("utf8", strLenOffset));
					
					if (resp.description) data.serverName = resp.description;
					
					//data.protocolVersion = resp.version.protocolVersion;
					
					var versionSplit = resp.version.name.split(/ /g);
					if (versionSplit.length > 1) {
						data.version = versionSplit.pop();
						if (versionSplit[0].search("Bukkit") >= 0 || versionSplit[0].search("MCPC") >= 0 || versionSplit[0].search("Cauldron") >= 0) {
							data.pluginInfo = true;
						}
					}else{
						data.version = versionSplit[0];
					}
				  
					data.onlinePlayers = resp.players.online;
					data.maxPlayers = resp.players.max;
					
					if(resp.players.sample) {
						data.players = resp.players.sample;
					}
					if(resp.favicon) data.icon = resp.favicon;
				  
					if(resp.modinfo) {
						var fullModList = resp.modinfo.modList.slice(2);
						var modNames = [];
						data.modList = [];
						for (var i = 0; i < fullModList.length; i++) {
							var pipedMod = fullModList[i].modid.split("|")[0];
							if (modNames.indexOf(pipedMod) == -1) {
								modNames.push(pipedMod);
								data.modList.push({modid: pipedMod});
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

		socket.on('error', function(e) {            
			if (MinecraftWidgets.settings.get().logErrors) console.log(e);
		});
		
		socket.on('close', function(e) {
			if (e) {
				if (MinecraftWidgets.settings.get().logErrors) console.log("Connection was closed unexpectedly, was the packet malformed?");
			}
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
	
	function queryServer(templateData, queryBack) {
		if ( !templateData.queryPort || templateData.queryPort === '' ) templateData.queryPort = templateData.serverPort;
		var queryData;
		if ( templateData.uselocalhost ) {
			queryData = { host: "0.0.0.0", port: templateData.queryPort };
		}else{
			queryData = { host: templateData.serverIP || templateData.serverHost, port: templateData.queryPort };
		}
		
		if (MinecraftWidgets.settings.get().logDebug) console.log("Querying " + queryData.host + ":" + queryData.port);
		
		var query = new mcquery( queryData.host, queryData.port, {timeout: 10000} );
		
		query.connect(function (err) {
			if (err) {
				if (MinecraftWidgets.settings.get().logErrors) console.log("Query failed for " + ( templateData.serverIP || templateData.serverHost ) + ":" + templateData.queryPort + ", is query-enabled set to true in server.properties?" );
				templateData.failQuery = true;
				if(!templateData.pluginList) templateData.pluginList = [];
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
				if (MinecraftWidgets.settings.get().logErrors) console.log("FullStats Query request failed for " + ( templateData.serverIP || templateData.serverHost ) + ":" + templateData.queryPort + ", is the server blocking FullStats?");
			} else {
				if (MinecraftWidgets.settings.get().logDebug) console.log("Received FullStats Query response for " + ( templateData.serverIP || templateData.serverHost ) + ":" + templateData.queryPort);
				templateData.isServerOnline = true;
				
				if (stat.MOTD) templateData.serverName = stat.MOTD;
				
				if ( stat.player_ && templateData.players.length === 0 ) {
					for (var index = 0; index < stat.player_.length; ++index) {
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
		for ( var i = 0; i < spancount; i++ ) name = name + "</span>";
		return name;
	}
	
	MinecraftWidgets.defineWidgets = function(widgets, callback) {
		var data = { 'serverConfigNames': [] };
		data.serverConfigNames.push({ 'configName': MinecraftWidgets.settings.get()["server1serverConfigName"], 'serverNumber': '1' });
		data.serverConfigNames.push({ 'configName': MinecraftWidgets.settings.get()["server2serverConfigName"], 'serverNumber': '2' });
		data.serverConfigNames.push({ 'configName': MinecraftWidgets.settings.get()["server3serverConfigName"], 'serverNumber': '3' });
		
		var contentMCOnlinePlayersGraph = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCOnlinePlayersGraph.tpl'], data);
		var contentMCOnlinePlayersGrid  = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCOnlinePlayersGrid.tpl'], data);
		var contentMCServerStatus       = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCServerStatus.tpl'], data);
		var contentMCTopPlayersGraph    = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCTopPlayersGraph.tpl'], data);
		var contentMCTopPlayersList     = templates.parse( MinecraftWidgets.templates['admin/adminWidgetMCTopPlayersList.tpl'], data);
		
		widgets = widgets.concat([
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
