"use strict";

var NodeBB = require('./nodebb'),
	app = NodeBB.app,
	Rainbow = require('./vendor/rainbowvis.js'),
	Widgets = {
	DynmapMiniMap: {
		render: function(widget, callback) {
			return callback(null, '');
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

			Utils.formatWidgetData(widget.data, "Mini Map - ");

			app.render('widgetMCDynmapMiniMap', widget.data, function(err, html) {
				translator.translate(html, function(html) {
					callback(err, html);
				});
			});
		}
	},
	TopPlayersList: {
		render: function(widget, callback) {
			return callback(null, '');
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
	},
	OnlinePlayersGraph: {
		render: function(widget, callback) {
			return callback(null, '');
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
		}
	},
	OnlinePlayersGrid: {
		render: function(widget, callback) {
			return callback(null, '');
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
		}
	},
	TopPlayersGraph: {
		render: function(widget, callback) {
			return callback(null, '');
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
		}
	},
	ServerStatus: {
		render: function(widget, callback) {
			return callback(null, '');
			if (widget.data.showModalMap) widget.data.widget = "status";
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
		}
	}
};

module.exports = Widgets;
