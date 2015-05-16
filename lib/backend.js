"use strict";

var Backend = { },
	NodeBB = require('./nodebb'),
	Config = require('./config'),
	Utils = require('./utils'),
	Sockets = require('./sockets'),
	async = require('async'),
	mcquery = require('mcquery'),
	rcon = require('rcon'),
	net = require('net'),
	dns = require('dns'),
	bufferpack = require("bufferpack"),
	encoding = require("encoding"),
	varint = require("varint"),
	mcping = require("mc-ping"),
	util = require('util'),
	updateTime = 0,
	scheduler;

NodeBB.pubsub.on('meta:reload', function () {
	if (scheduler) clearTimeout(scheduler);
});

Backend.init = function () {
	if (scheduler) clearTimeout(scheduler);
	scheduler = setTimeout(Backend.updateServers, 60000);
};

Backend.updateServers = function () {
	updateTime = Math.round(Date.now()/60000) * 60000;
	console.log("MI: I see it is now " + updateTime + ", I'm pinging the active servers...");
	var servers = Config.settings.get('servers');
	async.each(servers, function (server, next) {
		if (server.active) {
			console.log("Active server at index " + servers.indexOf(server) + " named " + server.name + " address [" + server.address + "]");

			var sid = servers.indexOf(server);

			// Only store the data we need.
			server = {
				name: server.name,
				address: server.address,
				queryPort: server.queryPort
			}

			var fields = [
				'host',
				'port',
				'motd',
				'onlinePlayers',
				'modList',
				'pluginList',
				'icon',
				'lastOnline'
			];

			async.waterfall([
				function (next) {
					Sockets.canHasServer(sid, function(err, hasServer){
						if (hasServer) {
							next("Server " + server.name + " has socket connection, skipping pinging.");
						}else{
							next();
						}
					});
				},
				function (next) {
					Utils.verifyAddress(server, next);
				},
				function (ping, next) {
					doServerListPing(ping, next);
				},
				function (ping, next) {
					doServerQuery(ping, next);
				},
				function (ping, next) {
					NodeBB.db.setObject('mi:server:' + sid, ping, function (err) {
						NodeBB.db.expire('mi:server:' + sid, Config.getPingExpiry(), function (err) {
							next(err, ping);
						});
					});
				},
				function (ping, next) {
					NodeBB.db.listPrepend('mi:server:' + sid + ':pings', updateTime, function (err) {
						NodeBB.db.expire('mi:server:' + sid + ':pings', Config.getPingExpiry(), function (err) {
							next(err, ping);
						});
					});
				},
				function (ping, next) {
					// Remove perpetual data.
					ping = {
						players: ping.players,
						tps: ping.tps,
						ping: ping.ping
					};
					NodeBB.db.setObject('mi:server:' + sid + ':ping:' + updateTime, ping, function (err) {
						NodeBB.db.expire('mi:server:' + sid + ':ping:' + updateTime, Config.getPingExpiry(), function (err) {
							next(err, ping);
						});
					});
				}
			], function (err, result) {
				if (err) {
					console.log('[MinecraftIntegration] ' + err);
				}else{
					console.log(util.inspect(result, { showHidden: true, depth: null }));
				}
				//Controller.updateClients(result);
				next();
			});
		}else{
			next();
		}
	}, function(err){
		if (err) console.log('MI: Error: ' + err);
		console.log('MI: Done pinging servers.');
		//Config.logActiveServers();
	});

	Backend.init();
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

function doServerListPing(data, callback) {
	var hostData = { host: data.host, port: data.port },
		dataLength = -1,
		currentLength = 0,
		chunks = [],
		socket = net.connect(hostData, function () {
			modernRequestBack(socket, hostData);
		});

	socket.setTimeout(4000, function () {
		socket.destroy();
	});

	socket.on('data', function(packet) {
		try {
			if (dataLength < 0) {
				dataLength = varint.decode(packet);
				packet = packet.slice(varint.decode.bytes);
				if(packet[0] != 0x00) {
					console.log("Bad handshake.");
					socket.destroy();
				}
				packet = packet.slice(1);
				currentLength++;
			}else if (dataLength === 99){
				if (packet[0] == 0x01) {
					var ping = Date.now() - bufferpack.unpack(L, packet, 1);
					console.log("GOT PING " + ping + "ms");
					socket.destroy();
				}else{
					console.log("Bad handshake.");
					socket.destroy();
				}
			}
			currentLength += packet.length;
			chunks.push(packet);

			if (currentLength >= dataLength) {
				packet = Buffer.concat(chunks);
				var strLen = varint.decode(packet);
				var strLenOffset = varint.decode.bytes;
				var resp = JSON.parse(packet.toString("utf8", strLenOffset));

				if (resp.description) data.motd = resp.description;
				if (resp.version.protocolVersion) data.protocol = resp.version.protocolVersion;
				if (resp.favicon) data.icon = resp.favicon;
				if (resp.players.sample) data.players = resp.players.sample;
				data.onlinePlayers = resp.players.online;
				data.maxPlayers = resp.players.max;

				var versionSplit = resp.version.name.split(/ /g);
				if (versionSplit.length > 1) {
					data.version = versionSplit.pop();
					if (versionSplit[0].search("Bukkit") >= 0 || versionSplit[0].search("MCPC") >= 0 || versionSplit[0].search("Cauldron") >= 0) {
						data.pluginInfo = true;
					}
				}else{
					data.version = versionSplit[0];
				}

				if (resp.modinfo) {
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
				data.modList = JSON.stringify(data.modList);

				dataLength = 99;
				modernPingBack(socket, hostData);
			}
		} catch(err) {
			console.log(err);
			socket.destroy();
		}
	});

	socket.on('error', function (err) {
		console.log(err);
	});

	socket.on('close', function (err) {
		callback(err, data);
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

function doServerQuery(data, next) {
	var query = new mcquery( data.host, data.queryPort, {timeout: 5000} );

	query.connect(function (err) {
		if (err) {
			if(!data.pluginList) data.pluginList = [];
			next(null, data);
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
			data.isServerOnline = true;

			if (stat.MOTD) data.serverMOTD = stat.MOTD;

			if (stat.player_) {
				data.players = JSON.stringify(stat.player_);
			}

			if (stat.plugins) {
				data.pluginInfo = true;
				var pluginString = stat.plugins.split(": ")[1].split("; ");
				data.pluginList = [];
				var index;
				for (index = 0; index < pluginString.length; ++index) {
					data.pluginList[data.pluginList.length] = { name: pluginString[index] };
				}
				data.pluginList = JSON.stringify(data.pluginList);
			}

			data.onlinePlayers = stat.numplayers;
			data.maxPlayers = stat.maxplayers;
			data.version = stat.version;

			// Use queried hostname if none was specified.
			if ( data.serverHost == "0.0.0.0" || data.serverHost == "127.0.0.1" || data.serverHost == "localhost" ) {
				data.serverHost = stat.hostip;
				if ( stat.hostport != "25565" ) {
					data.serverPort = stat.hostport;
				}
			}

			shouldWeClose();
		}

		next(err, data);
	}

	function shouldWeClose() {
		//have we got all answers
		if (query.outstandingRequests() === 0) {
			query.close();
		}
	}
};

module.exports = Backend;
