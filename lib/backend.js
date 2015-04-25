"use strict";

var Backend = { },
	Config = require('./config'),
	Utils = require('./utils'),
	async = require('async'),
	mcquery = require('mcquery'),
	rcon = require('rcon'),
	net = require('net'),
	dns = require('dns'),
	bufferpack = require("bufferpack"),
	encoding = require("encoding"),
	varint = require("varint"),
	mcping = require("mc-ping");

Backend.updateServers = function(){
	// TODO: Check connection to minecraft-plugin-nodebb-integration and skip pinging if a socket connection is already established.
	async.each(Config.settings.get('servers'), function(server, next){
		if (!server.isDisabled){
			server.name      = server.name      || 'A Minecraft Server';
			server.host      = server.host      || '0.0.0.0';
			server.port      = server.port      || '25565';
			server.queryPort = server.queryPort || server.port;
			server.rconPort  = server.rconPort  || '25575';
			server.rconPass  = server.rconPass  || 'password';

			Utils.formatHost(server);

			console.log("Updating data for server " + server.name + ", Host=" + server.host + ", Port=" + server.port + ", Query=" + server.queryPort);

			data.status = {
				serverIP: "0.0.0.0",
				isServerOnline: false,
				version: '',
				serverMOTD: '',
				failPing: false,
				failQuery: false,
				failTime: false,
				onlinePlayers: '0',
				icon: '',
				players: [],
				modList: [],
				pluginList: []
			};

			Backend.doServerStatusPing(server);
		}
		next();
	}, function(err){
		if (err){
			console.log(err);
		}
	});

	setTimeout(Backend.updateServers, ( Config.settings.get('serverUpdateDelay') || 60 ) * 1000);
};

Backend.storePingData = function(serverConfig, pingData) {
	var serverKey = Utils.formatServerName(server.name),
		stamp = Utils.getTimeStamp();
	async.parallel({
		players: function(callback){
			db.setObjectFields('minecraft:server.' + serverKey, players + stamp, pingData.players, callback);
		},
		stamp: function(callback){
			db.sortedSetAdd('minecraft:server.' + serverKey + ".stamps", stamp, stamp, callback);
		}
	}, function(err, results){
		if (!err && results){
			Controller.updateClients(results);
		}
	});
};

Backend.doServerStatusPing = function(data) {
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
};

Backend.doFetchRCON = function( data ) {
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
};

Backend.updateDatabase = function( data ) {
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
	if (!data.container) data.container = '<div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title">{title}</h3></div><div class="panel-body">{body}</div></div>';
	data.container = '<div class="'+ (data.widget ? 'mcwe-widget-'+ data.widget : 'mcwe-widget') +'" data-mcwe-mid="'+ data.modalID +'">'+ data.container +'</div>';
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

function getIP(host, ipBack){
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

function getSRV(host, srvBack){
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

function readServerListPing(data, callback){
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

function modernRequestBack(socket, hostData){
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

function modernPingBack(socket, hostData){
	var buf = [
		packData([
			new Buffer([0x01]),
			bufferpack.pack("L", Date.now())
		])
	];

	socket.write(buf[0]);
};

function packData(raw){
	if ( raw instanceof Array ) raw = Buffer.concat(raw);
	return Buffer.concat( [ new Buffer(varint.encode(raw.length)), raw ] );
};

function queryServer(data, queryBack){
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
};

module.exports = Backend;
