"use strict";

var Backend = { },

	NodeBB     = require('./nodebb'),
	Controller = require('./controller'),
	Config     = require('./config'),
	Utils      = require('./utils'),
	Sockets    = require('./sockets'),

	async      = require('async'),
	mcquery    = require('mcquery'),
	rcon       = require('rcon'),
	net        = require('net'),
	dns        = require('dns'),
	bufferpack = require('bufferpack'),
	encoding   = require('encoding'),
	varint     = require('varint'),
	mcping     = require('mc-ping'),
	util       = require('util'),

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
	console.log("[Minecraft Integration] The time is now " + updateTime + ", updating the active servers...");
	var servers = Config.settings.get('servers');
	async.each(servers, function (server, next) {
		if (server.active) {
			console.log("[Minecraft Integration] Updating server at index " + servers.indexOf(server) + " named " + server.name + " address [" + server.address + "]");

			var sid = servers.indexOf(server);

			// Only store the data we need.
			server = {
				name:      server.name,
				address:   server.address   || '0.0.0.0',
				queryPort: server.queryPort || '25565'
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
							// Temp
							return next();
							next("Server " + server.name + " has socket connection, skipping pinging.");
						}else{
							next();
						}
					});
				},
				function (next) {
					cleanAddress(server, next);
				},
				function (server, next) {
					console.log("[Minecraft Integration] Clean IP was: " + server.host + ":" + server.port);
					console.log('[Minecraft Integration] Pinging ' + server.name);
					doServerListPing(server, next);
				},
				function (ping, next) {
					console.log('[MinecraftIntegration] Querying ' + server.name);
					doServerQuery(ping, next);
				},
				function (ping, next) {
					ping.players = ping.players || '[]';
					NodeBB.db.setObject('mi:server:' + sid, ping, function (err) {
						NodeBB.db.expire('mi:server:' + sid, Config.getPingExpiry(), function (err) {
							next(err, ping);
						});
					});
				},
				function (ping, next) {
					NodeBB.db.listPrepend('mi:server:' + sid + ':pings', updateTime, function (err) {
						NodeBB.db.expire('mi:server:' + sid + ':pings', Config.getPingExpiry(), function (err) {
						if (!err) {
							ping.sid = sid;
							Controller.sendPingToUsers(ping);
							delete ping.sid;
						}
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
				next();
			});
		}else{
			next();
		}
	}, function(err){
		if (err) console.log('MI: Error: ' + err);
		console.log('MI: Done pinging servers.');
		Config.logActiveServers();
	});

	Backend.init();
};

function doFetchRCON(data) {
	if (!data.rconPort || !data.rconPass) {
		MinecraftWidgets.updateDatabase( data );
	}else{
		if (MinecraftWidgets.settings.get().logDebug) console.log("Connecting to RCON at " + data.host + ":" + data.rconPort);
		var conn = new rcon(data.host, data.rconPort, data.rconPass);

		conn.on('auth', function() {
			if (MinecraftWidgets.settings.get().logDebug) console.log("Successfully connected to RCON at " + data.host + ":" + data.rconPort);
			conn.send('time');
		}).on('response', function(str) {
			console.log("Got response: " + str);
			conn.disconnect();
		}).on('end', function() {
			if (MinecraftWidgets.settings.get().logDebug) console.log("RCON connection closed at " + data.host + ":" + data.rconPort);
			MinecraftWidgets.updateDatabase( data );
		}).on('error', function() {
			if (MinecraftWidgets.settings.get().logErrors) console.log("RCON connection failed at " + data.host + ":" + data.rconPort);
			MinecraftWidgets.updateDatabase( data );
		});
		conn.connect();
	}
};

function cleanAddress(server, next) {
	server.host = server.address.split(':')[0];
	server.port = server.address.split(':')[1] || '25565';

	if (Utils.isIP(server.address)) {
		next(null, server);
	}else{
		getSRV(server.host, function(err, theHost, thePort) {
			if (err) {
				getIP(server.host, function(err, theIP) {
					if (err) {
						next(err, server);
					}else{
						server.host = theIP;
						next(null, server);
					}
				});
			}else{
				server.port = thePort;
				if ( Utils.isIP(theHost) ) {
					server.host = theHost;
					next(null, server);
				}else{
					getIP(theHost, function(err, theIP) {
						if (err) {
							next(err, server);
						}else{
							server.host = theIP;
							next(null, server);
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
			if ( Utils.isIP(addresses[0]) ) {
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

	socket.setTimeout(10000, function () {
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
			}
			currentLength += packet.length;
			chunks.push(packet);

			if (currentLength >= dataLength) {
				packet = Buffer.concat(chunks);
				var strLen = varint.decode(packet);
				var strLenOffset = varint.decode.bytes;
				var resp = JSON.parse(packet.toString("utf8", strLenOffset));

				util.inspect(resp);

				if (resp.description)             data.motd     = resp.description;
				if (resp.version.protocolVersion) data.protocol = resp.version.protocolVersion;
				if (resp.favicon)                 data.icon     = resp.favicon;
				if (resp.players.sample)          data.players  = JSON.stringify(resp.players.sample);

				data.onlinePlayers = resp.players.online;
				data.maxPlayers    = resp.players.max;

				var versionSplit = resp.version.name.split(/ /g);
				if (versionSplit.length > 1) {
					data.version = versionSplit.pop();
					if (versionSplit[0].search("Bukkit") >= 0 || versionSplit[0].search("MCPC") >= 0 || versionSplit[0].search("Cauldron") >= 0) {
						data.hasPlugins = true;
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
				socket.destroy();
			}
		} catch(err) {
			console.log(err);
			socket.destroy();
		}
	});

	socket.on('error', function (err) {
		console.log("PING ERROR: " + err);
	});

	socket.on('close', function (err) {
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

function packData(raw){
	if ( raw instanceof Array ) raw = Buffer.concat(raw);
	return Buffer.concat( [ new Buffer(varint.encode(raw.length)), raw ] );
};

function doServerQuery(data, next) {
	var query = new mcquery( data.host, data.queryPort, {timeout: 15000} );

	query.connect(function (err) {
		if (err) {
			if(!data.pluginList) data.pluginList = [];
			console.log(err);
			next(null, data);
		} else {
			data.queryonline = true;
			query.full_stat(fullStatBack);
		}
	});

	function fullStatBack(err, stat) {
		if (!err) {
			data.isServerOnline = true;

			if (stat.hostname)   data.motd          = stat.hostname;
			if (stat.hostip)     data.hostip        = stat.hostip;
			if (stat.hostport)   data.hostport      = stat.hostport;
			if (stat.numplayers) data.onlinePlayers = stat.numplayers;
			if (stat.maxplayers) data.maxPlayers    = stat.maxplayers;
			if (stat.version)    data.version       = stat.version;
			if (stat.map)        data.map           = stat.map;
			if (stat.gametype)   data.gametype      = stat.gametype;
			if (stat.game_id)    data.game_id       = stat.game_id;

			if (stat.player_ && !data.players) {
				console.log(typeof stat.player_);
				data.players = [ ];
				for (var i in stat.player_) {
					console.log('add player');
					data.players[i] = {name: stat.player_[i]};
				}
				console.log(data.players);
				try {
					data.players = JSON.stringify(data.players);
				}catch(e){
					console.log(e);
					data.players = '[]';
				}
				console.log(data.players);
			}

			if (stat.plugins) {
				data.hasPlugins = true;
				var pluginString = stat.plugins.split(": ")[1].split("; ");
				data.pluginList = [];
				var index;
				for (index = 0; index < pluginString.length; ++index) {
					data.pluginList[data.pluginList.length] = { name: pluginString[index] };
				}
				data.pluginList = JSON.stringify(data.pluginList);
			}

			shouldWeClose();
		}else{
			console.log(err);
		}

		next(null, data);
	}

	function shouldWeClose() {
		//have we got all answers
		if (query.outstandingRequests() === 0) {
			query.close();
		}
	}
};

module.exports = Backend;
