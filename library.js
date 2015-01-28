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
						
						'avatarCDN': "minotar",
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
					db.delete("MCWES1", function(err) {
						if (err) console.log("Error deleting MCWES1: " + err);
					});
					db.delete("MCWES2", function(err) {
						if (err) console.log("Error deleting MCWES2: " + err);
					});
					db.delete("MCWES3", function(err) {
						if (err) console.log("Error deleting MCWES3: " + err);
					});
					db.delete("MCWES1onlinePlayers", function(err) {
						if (err) console.log("Error deleting MCWES1onlinePlayers: " + err);
					});
					db.delete("MCWES2onlinePlayers", function(err) {
						if (err) console.log("Error deleting MCWES2onlinePlayers: " + err);
					});
					db.delete("MCWES3onlinePlayers", function(err) {
						if (err) console.log("Error deleting MCWES3onlinePlayers: " + err);
					});
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
			logServers: function() {
				for (var serverNumber = 1; serverNumber <= 3; serverNumber++) {
					MinecraftWidgets.logServer("MCWES" + serverNumber);
				}
				setTimeout(MinecraftWidgets.logServers, 10000);
			},
			logServer: function(serverKey) {
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
									console.log(JSON.parse(data));
								}
							});
						}
					}
				});
			},
			pushData: function(data, callback) {
				// Get information from the database and push it into the data object.
				// The passed object should be { serverNumber: STRING, requestData: [STRING] }
				var requestData = data.requestData ? data.requestData[0] : "S";
				delete data.requestData;
				var serverKey = ( data.serverNumber || "1") + requestData;
				if (MinecraftWidgets.settings.get().logDebug) console.log("Looking for db key: " + serverKey);
				db.get(serverKey, function(err, dbstring) {
					if (err) {
						if (MinecraftWidgets.settings.get().logErrors) console.log("Database failed to find " + serverKey + ": " + err);
					}
					if (typeof dbstring === 'string') {
						try {
							var dbo = JSON.parse(dbstring);
							for (var prop in dbo) data[prop] = dbo[prop];
						}catch(e){
							err = e;
							if (MinecraftWidgets.settings.get().logErrors) console.log("Error parsing database key " + serverKey + ": " + e);
						}
					}
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
								data.onlinePlayers = resp.num_players;
								data.maxPlayers = resp.max_players;
								data.isServerOnline = true;
								data.serverName = resp.server_name;
							  
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
								
								queryServer(data, function(err, queryData) {
									data = queryData;
									MinecraftWidgets.doFetchRCON( data );
								});
							}else{
								if (MinecraftWidgets.settings.get().logErrors) console.log("ServerListPing failed: " + err);
								data.isServerOnline = false;
								MinecraftWidgets.doFetchRCON( data );
							}
						});
					}else{
						readServerListPing(data, function(err, data) {
							if (err || data.isServerOnline === false) {
								MinecraftWidgets.doFetchRCON( data );
							}else{
								queryServer(data, function(err, data) {
									MinecraftWidgets.doFetchRCON( data );
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
				// console.log("Saving server data.");
				// Keys: { Status: S, PingedData: PD, PlayerStats: PS, }
				if ( data && data.serverNumber ) {
					if (MinecraftWidgets.settings.get().logDebug) console.log("Setting status key " + data.serverNumber + "S.");
					db.set(data.serverNumber + "S", JSON.stringify(data), function (err){
						if (err) console.log(err);
					});
					
					if (data.onlinePlayers) {
						db.get(data.serverNumber + "PD", function(err, dbo) {
							if (err || !dbo) {
								dbo = { 'onlinePlayers': [], 'time': [], 'players': [] };
							}else{
								try {
									dbo = JSON.parse(dbo);
								} catch (err) {
									if (MinecraftWidgets.settings.get().logError) console.log(data.serverNumber + "PD JSON was malformed. Resetting.");
									dbo = { 'onlinePlayers': [], 'time': [], 'players': [] };
								}
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
							db.set(data.serverNumber + "PD", JSON.stringify(dbo), function (err) {
								if (err) console.log(err);
							});
						});
						
						if (data.players && data.players.length > 0) {
							db.get(data.serverNumber + "PS", function(err, dbo) {
								if (err || !dbo) {
									// { PLAYER: { minutes: INT } }
									dbo = { playerStats: {} };
								}else{
									try {
										dbo = JSON.parse(dbo);
									}catch(err){
										if (MinecraftWidgets.settings.get().logError) console.log(data.serverNumber + "PS JSON was malformed. Resetting.");
										dbo = { playerStats: {} };
									}
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
								db.set(data.serverNumber + "PS", JSON.stringify(dbo), function (err) {
									if (err) console.log(err);
								});
							});
						}
					}
				}
			}
		};
	
	MinecraftWidgets.renderMCTopPlayersList = function(widget, callback) {
		var data = widget.data;
		data.serverNumber = isNaN(parseInt(data.serverNumber)) || parseInt(data.serverNumber) < 1 ? "1" : data.serverNumber;
		
		data.showTopPlayers = parseInt(data.showTopPlayers);
		data.showTopPlayers = isNaN(data.showTopPlayers) ? 5 : data.showTopPlayers < 1 ? 5 : data.showTopPlayers;
		
		MinecraftWidgets.pushData(data, function(err) {
			if (err || !data.serverName) {
				console.log("status data error");
				callback(null, "");
				return;
			}
			data.requestData = ["PS"];
			MinecraftWidgets.pushData(data, function(err) {
				if (err || !data.serverName) {
					console.log("players data error");
					callback(null, "");
					return;
				}
				
				data.players = [];
				for (var player in data.playerStats) { data.players.push({ 'name': player, 'minutes': data.playerStats[player].minutes }); }
				data.players.sort(function(a, b) { return b.minutes - a.minutes; });
				while (data.players.length > data.showTopPlayers) data.players.pop();
				
				if (data.showGlory) {
					if (!data.gloryStart) data.gloryStart = "000000";
					if (!data.gloryEnd) data.gloryEnd = "000000";
					var gloryStart = [ parseInt(data.gloryStart.substring(0,2),16), parseInt(data.gloryStart.substring(2,4),16), parseInt(data.gloryStart.substring(4,6),16) ];
					var gloryEnd = [ parseInt(data.gloryEnd.substring(0,2),16), parseInt(data.gloryEnd.substring(2,4),16), parseInt(data.gloryEnd.substring(4,6),16) ];
					var gloryStep =  [ Math.round( (gloryEnd[0]-gloryStart[0]) / data.showTopPlayers ), Math.round( (gloryEnd[1]-gloryStart[1]) / data.showTopPlayers ), Math.round( (gloryEnd[2]-gloryStart[2]) / data.showTopPlayers ) ];
				}
				
				for (var i = 0; i < data.players.length; i++) {
					if (data.showGlory) data.players[i].glory = "#" + ("00" + (gloryStart[0] + gloryStep[0] * i).toString(16)).substr(-2) + ("00" + (gloryStart[1] + gloryStep[1] * i).toString(16)).substr(-2) + ("00" + (gloryStart[2] + gloryStep[2] * i).toString(16)).substr(-2);
					if (data.players[i].minutes > 60) {
						data.players[i].minutes = Math.floor(data.players[i].minutes / 60).toString() + " Hours, " + (data.players[i].minutes % 60).toString() + " Minutes";
					}else{
						data.players[i].minutes = data.players[i].minutes + " Minutes";
					}
				}
				
				var avatarCDN = MinecraftWidgets.settings.get().avatarCDN ? MinecraftWidgets.settings.get().avatarCDN : "minotar";
				data.avatarSize = MinecraftWidgets.settings.get().avatarSize ? MinecraftWidgets.settings.get().avatarSize : "40";
				data.avatarSize = MinecraftWidgets.settings.get().avatarCDN === 'signaturecraft' ? data.avatarSize / 8 : data.avatarSize;
				data.avatarStyle = MinecraftWidgets.settings.get().avatarStyle ? MinecraftWidgets.settings.get().avatarStyle : "flat";
				switch (avatarCDN) {
					default:
					case "minotar":
						data.avatarCDNminotar = true;
						break;
					case "signaturecraft":
						data.avatarCDNsignaturecraft = true;
						break;
					case "cravatar":
						data.avatarCDNcravatar = true;
						break;
				}
				
				data.title = "Top Players - " + parseName( data.serverName || MinecraftWidgets.settings.get()["server" + data.serverNumber + "serverName"] );
				delete data.serverName;
				
				app.render('widgetMCTopPlayersList', data, function(err, html) {
					translator.translate(html, function(translatedHTML) {
						callback(err, translatedHTML);
					});
				});
			});
		});
	}
		
	MinecraftWidgets.renderMCOnlinePlayersGraph = function(widget, callback) {
		var html = MinecraftWidgets.templates['widgetMCOnlinePlayersGraph.tpl'],
			data = widget.data;
		data.serverNumber = isNaN(parseInt(data.serverNumber)) || parseInt(data.serverNumber) < 1 ? "1" : data.serverNumber;
		
		data.requestData = [ "PD" ];
		MinecraftWidgets.pushData(data, function(err){
			if (err) {
				console.log(err);
			}
			if (!data) {
				console.log("onlinePlayers data was null, skipping widget render.");
				callback(null, "");
				return;
			}
			
			data.labels = [];
			for (var i = 0; i < data.onlinePlayers.length; i++ ) {
				if (data.time && data.time[i]) {
					data.labels.push(data.time[i]);
				}else{
					data.labels.unshift("");
				}
			}
			
			var onlinePlayers = JSON.stringify(data.onlinePlayers);
			data.labels = JSON.stringify(data.labels);
			
			MinecraftWidgets.pushData(data, function(err) {
				if (err || !data.serverName) {
					console.log("serverStatus data was null, skipping widget render.");
					callback(null, "");
					return;
				}
				data.title = "Online Players - " + parseName( data.serverName || MinecraftWidgets.settings.get()["server" + widget.data.serverNumber + "serverName"] );
				delete data.serverName;
				data.onlinePlayers = onlinePlayers;
				html = templates.parse(html, data);
				callback(null, html);
			});
		});
	};
	
	MinecraftWidgets.renderMCOnlinePlayersGrid = function(widget, callback) {
		var data = widget.data;
		data.serverNumber = isNaN(parseInt(data.serverNumber)) || parseInt(data.serverNumber) < 1 ? "1" : data.serverNumber;
		
		data.requestData = [ "PD" ];
		MinecraftWidgets.pushData(data, function(err){
			if (err) {
				console.log(err);
			}
			if (!data) {
				console.log("onlinePlayers data was null, skipping widget render.");
				callback(null, "");
				return;
			}
			
			MinecraftWidgets.pushData(data, function(err) {
				if (err || !data.serverName) {
					console.log("serverStatus data was null, skipping widget render.");
					callback(null, "");
					return;
				}
				
				if (!data.players)
				{
					data.players = [];
				}else{
					var avatarCDN = MinecraftWidgets.settings.get().avatarCDN ? MinecraftWidgets.settings.get().avatarCDN : "minotar";
					data.avatarSize = MinecraftWidgets.settings.get().avatarSize ? MinecraftWidgets.settings.get().avatarSize : "40";
					data.avatarSize = MinecraftWidgets.settings.get().avatarCDN === 'signaturecraft' ? data.avatarSize / 8 : data.avatarSize;
					data.avatarStyle = MinecraftWidgets.settings.get().avatarStyle ? MinecraftWidgets.settings.get().avatarStyle : "flat";
					switch (avatarCDN) {
						default:
						case "minotar":
							data.avatarCDNminotar = true;
							break;
						case "signaturecraft":
							data.avatarCDNsignaturecraft = true;
							break;
						case "cravatar":
							data.avatarCDNcravatar = true;
							break;
					}
					
					if (data.showGlory) {
						if (!data.gloryStart) data.gloryStart = "000000";
						if (!data.gloryEnd) data.gloryEnd = "000000";
						var gloryStart = [ parseInt(data.gloryStart.substring(0,2),16), parseInt(data.gloryStart.substring(2,4),16), parseInt(data.gloryStart.substring(4,6),16) ];
						var gloryEnd = [ parseInt(data.gloryEnd.substring(0,2),16), parseInt(data.gloryEnd.substring(2,4),16), parseInt(data.gloryEnd.substring(4,6),16) ];
						var gloryStep =  [ Math.round( (gloryEnd[0]-gloryStart[0]) / data.onlinePlayers ), Math.round( (gloryEnd[1]-gloryStart[1]) / data.onlinePlayers ), Math.round( (gloryEnd[2]-gloryStart[2]) / data.onlinePlayers ) ];
					}
					
					for (var i = 0; i < data.players.length; i++) {
						if (data.showGlory) data.players[i].glory = "#" + ("00" + (gloryStart[0] + gloryStep[0] * i).toString(16)).substr(-2) + ("00" + (gloryStart[1] + gloryStep[1] * i).toString(16)).substr(-2) + ("00" + (gloryStart[2] + gloryStep[2] * i).toString(16)).substr(-2);
					}
				}
				
				data.title = "Online Players - " + parseName( data.serverName || MinecraftWidgets.settings.get()["server" + widget.data.serverNumber + "serverName"] );
				delete data.serverName;
				
				data.avatarMargin = 5;
				
				app.render('widgetMCOnlinePlayersGrid', data, function(err, html) {
					translator.translate(html, function(translatedHTML) {
						callback(err, translatedHTML);
					});
				});
			});
		});
	};
	
	MinecraftWidgets.renderMCTopPlayersGraph = function(widget, callback) {
		var html = MinecraftWidgets.templates['widgetMCTopPlayersGraph.tpl'],
			data = widget.data;
		data.serverNumber = isNaN(parseInt(data.serverNumber)) || parseInt(data.serverNumber) < 1 ? "1" : data.serverNumber;
		
		data.requestData = [ "PS" ];
		MinecraftWidgets.pushData(data, function(err){
			if (err) {
				console.log("status data error");
				callback(null, "");
				return;
			}
			MinecraftWidgets.pushData(data, function(err) {
				if (err || !data.serverName) {
					console.log("server data error");
					callback(null, "");
					return;
				}
				
				data.showTopPlayers = parseInt(data.showTopPlayers);
				data.showTopPlayers = isNaN(data.showTopPlayers) ? 5 : data.showTopPlayers < 1 ? 5 : data.showTopPlayers;
				
				data.topPlayers = [];
				for (var player in data.playerStats) {
					data.topPlayers.push({ 'player': player, 'minutes': data.playerStats[player].minutes });
				}
				data.topPlayers.sort(function(a, b) { return b.minutes - a.minutes; });
				while (data.topPlayers.length > data.showTopPlayers) {
					data.topPlayers.pop();
				}
				
				data.chartOptions = "{ responsive: true, tooltipTemplate: \"<%if (label){%><%=label%>: <%}%><%= value %> Minutes\" }";
				data.chartData = [];
				for (var i = 0; i < data.topPlayers.length; i++) {
					var newdata = { 'value': data.topPlayers[i].minutes, 'color': '','highlight': '', 'label': data.topPlayers[i].player };
					var hue = Math.random() * 720;
					newdata.color = 'hsl(' + hue + ','+'100%,40%)';
					newdata.highlight = 'hsl(' + hue + ','+'100%,70%)';
					data.chartData.push(newdata);
				}
				data.chartData = JSON.stringify(data.chartData);
			
				data.title = "Top Players - " + parseName( data.serverName || MinecraftWidgets.settings.get()["server" + data.serverNumber + "serverName"] );
				callback(null, templates.parse(html, data));
			});
		});
	};

	MinecraftWidgets.renderMCServerStatus = function(widget, callback) {
		var data = widget.data;
		data.serverNumber = isNaN(parseInt(data.serverNumber)) || parseInt(data.serverNumber) < 1 ? "1" : data.serverNumber;
		
		MinecraftWidgets.pushData(data, function(err){
			if (err || !data.serverName) {
				callback(null, "");
				return;
			}
		
			data = readWidgetConfigMCServerStatus(widget, data);
			data = parseStatusWidget(data);
			
			// Needs to be defined or will display incorrectly.
			if (!data.players)
			{
				data.players = [];
			}else{
				var avatarCDN = MinecraftWidgets.settings.get().avatarCDN ? MinecraftWidgets.settings.get().avatarCDN : "minotar";
				data.avatarSize = MinecraftWidgets.settings.get().avatarSize ? MinecraftWidgets.settings.get().avatarSize : "40";
				data.avatarSize = MinecraftWidgets.settings.get().avatarCDN === 'signaturecraft' ? data.avatarSize / 8 : data.avatarSize;
				data.avatarStyle = MinecraftWidgets.settings.get().avatarStyle ? MinecraftWidgets.settings.get().avatarStyle : "flat";
				switch (avatarCDN) {
					default:
					case "minotar":
						data.avatarCDNminotar = true;
						break;
					case "signaturecraft":
						data.avatarCDNsignaturecraft = true;
						break;
					case "cravatar":
						data.avatarCDNcravatar = true;
						break;
				}
				
				if (data.showGlory) {
					if (!data.gloryStart) data.gloryStart = "000000";
					if (!data.gloryEnd) data.gloryEnd = "000000";
					var gloryStart = [ parseInt(data.gloryStart.substring(0,2),16), parseInt(data.gloryStart.substring(2,4),16), parseInt(data.gloryStart.substring(4,6),16) ];
					var gloryEnd = [ parseInt(data.gloryEnd.substring(0,2),16), parseInt(data.gloryEnd.substring(2,4),16), parseInt(data.gloryEnd.substring(4,6),16) ];
					var gloryStep =  [ Math.round( (gloryEnd[0]-gloryStart[0]) / data.onlinePlayers ), Math.round( (gloryEnd[1]-gloryStart[1]) / data.onlinePlayers ), Math.round( (gloryEnd[2]-gloryStart[2]) / data.onlinePlayers ) ];
					
					for (var i = 0; i < data.players.length; i++) {
						data.players[i].glory = "#" + ("00" + (gloryStart[0] + gloryStep[0] * i).toString(16)).substr(-2) + ("00" + (gloryStart[1] + gloryStep[1] * i).toString(16)).substr(-2) + ("00" + (gloryStart[2] + gloryStep[2] * i).toString(16)).substr(-2);
						console.log(data.players[i].name + " gets glory: " + data.players[i].glory);
					}
				}
			}
			
			data.title = parseName( data.serverName || MinecraftWidgets.settings.get()["server" + data.serverNumber + "serverName"] );
			delete data.serverName;
			
			data.avatarMargin = 5;
			
			app.render('widgetMCServerStatus', data, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					callback(err, translatedHTML);
				});
			});
		});
	};
	
	function readWidgetConfigMCServerStatus(widget, templateData) {
		templateData.showIP = widget.data.showIP == "on" ? true : false;
		templateData.showPlayerCount = widget.data.showPlayerCount == "on" ? true : false;
		templateData.showNameAlways = widget.data.showNameAlways == "on" ? true : false;
		templateData.parseFormatCodes = widget.data.parseFormatCodes == "on" ? true : false;
		
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
		
		templateData.hasInvalidHost  = false;
		templateData.hasInvalidPort  = false;
		templateData.hasInvalidQuery = false;
		templateData.showModList     = true;
		//templateData.showPluginList  = false;
		//templateData.isServerOnline  = false;
		//templateData.showPlayersList = true;
		
		// if ( typeof parseInt(templateData.serverPort) !== "number" || templateData.serverPort.substring(0,1) == "0" ) {
			// templateData.serverPort = "25565";
			// templateData.hasInvalidPort = true;
		// }
 
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
							templateData.isServerOnline = false;
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
			data.isServerOnline = false;
			data.failPing = true;
			data.failTime = true;
		});
		
		socket.on('data', function(serverStatusPingData) {
			if (MinecraftWidgets.settings.get().logErrors) console.log("ServerListPing packet received from " + hostData.host + ":" + hostData.port);
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
						data.modInfo = true;
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
				data.isServerOnline = false;
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
				if (MinecraftWidgets.settings.get().logErrors) console.log("FullStats failed for " + ( templateData.serverIP || templateData.serverHost ) + ":" + templateData.queryPort + ", is the server blocking FullStats?");
			} else {
				if (MinecraftWidgets.settings.get().logTemplateDataChanges) console.log("Applying FullStats for " + ( templateData.serverIP || templateData.serverHost ) + ":" + templateData.queryPort);
				templateData.isServerOnline = true;
				
				if (stat.MOTD) templateData.serverName = stat.MOTD;
				
				if ( !templateData.players ) {
					// Convert player objects to the way NodeBB likes.
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
		//if ( !templateData.players ) templateData.players = []; 
		if ( templateData.players && templateData.players.length != index ) {
			user.exists(templateData.players[index].name, function(err, exists) {
				if ( err ) {
					if (MinecraftWidgets.settings.get().logErrors) console.log("Error finding user: " + err);
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
	
	function parseStatusWidget ( templateData ) {
		if (MinecraftWidgets.settings.get().logTemplateDataChanges) console.log("Original name: " + templateData.serverName);
		if ( templateData.showNameAlways ) templateData.serverName = MinecraftWidgets.settings.get()['server' + templateData.serverNumber + 'serverName'] + " ~" + templateData.serverName + "~";
		if ( templateData.parseFormatCodes ) templateData.serverName = parseName(templateData.serverName);
		if (MinecraftWidgets.settings.get().logTemplateDataChanges) console.log("New Name:" + templateData.serverName);
		
		templateData.msgFailQuery = templateData.msgFailQuery.replace("{serverIP}", ( templateData.serverIP || templateData.serverHost ) );
		templateData.msgFailQuery = templateData.msgFailQuery.replace("{queryPort}", templateData.queryPort);
		
		if (templateData.isServerOnline && templateData.players && templateData.players.length > 0) templateData.hasPlayers = true;
		
		if (templateData.showIP && templateData.serverPort != "25565") templateData.showPortIP = true;
		
		if (templateData.pluginInfo && !(templateData.showPluginList)) templateData.failListPlugins = true;
		
		if (!templateData.onlinePlayers || !templateData.maxPlayers) templateData.showPlayerCount = false;
		if (!templateData.version) {
			templateData.showVersion = false;
			if (templateData.isServerOnline) {
				templateData.isServerOnline = false;
				templateData.isServerRestarting = true;
			}
		}else{
			templateData.showVersion = true;
		}
		
		if (!templateData.isServerOnline && !templateData.isServerRestarting) templateData.isServerOffline = true;
		
		return templateData;
	}
	
	function parseName ( name ) {
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
