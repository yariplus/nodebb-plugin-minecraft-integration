//
// Scheduled task to ping and query all active servers.
// Skips servers with an active socket connection.
//

"use strict";

var Updater = module.exports = { },

	NodeBB     = require('./nodebb'),
	Backend    = require('./backend'),
	Controller = require('./controller'),
	Config     = require('./config'),
	Utils      = require('./utils'),

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

Updater.init = function () {
	if (scheduler) clearTimeout(scheduler);
	scheduler = setTimeout(Updater.updateServers, 60000);
};

Updater.updateServers = function () {

	// Get the current minute.
	updateTime = Math.round(Date.now()/60000) * 60000;

	// Remove old avatars from cache.
	Backend.clearOldAvatars();

	// Ping and query the servers.
	// TODO: Add "Unknown" status for inactive servers.
	var servers = Config.settings.get('servers');
	async.each(servers, function (server, next) {

		// Only update active servers.
		if (!server.active) return next();

		// Don't ping or query if socket connected.
		if (NodeBB.SocketIO.server.sockets.connected[server.socketid]) return next();

		console.log("[Minecraft Integration] [" + server.name + "] Updating at address [" + server.address + "]");

		var sid = servers.indexOf(server);

		// Only store the data we need.
		server = {
			name:      server.name,
			address:   server.address   || '0.0.0.0',
			queryPort: server.queryPort,
			players:   [ ],
			plugins:   [ ],
			mods:      [ ],
			isServerOnline: 0
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
				cleanAddress(server, next);
			},
			function (server, next) {
				console.log('[Minecraft Integration] [' + server.name + '] Cleaned IP was: ' + server.host + ':' + server.port);
				console.log('[Minecraft Integration] [' + server.name + '] Sending ServerListPing...');
				doServerListPing(server, next);
			},
			function (status, next) {
				console.log('[Minecraft Integration] [' + server.name + '] Sending ServerQuery...');
				doServerQuery(status, next);
			},
			function (status, next) {
				status.sid = sid;
				Backend.updateServerStatus(status, next);
			},
			function (status, next) {
				// TODO: Oops, needs to be sortedSet.
				// TODO: And expire based on score each update.
				NodeBB.db.listPrepend('mi:server:' + sid + ':pings', updateTime, function (err) {
					next(err, status);
				});
			},
			function (status, next) {
				NodeBB.db.setObjectField('mi:server:' + sid + ':ping:' + updateTime, 'players', status.players, function (err) {
					NodeBB.db.expire('mi:server:' + sid + ':ping:' + updateTime, Config.getPingExpiry(), function (err) {
						next(err, status);
					});
				});
			}
		], function (err, result) {
			if (err) {
				console.log('[Minecraft Integration] [' + server.name + '] ' + err);
			}
			next();
		});
	});

	// Schedule next update.
	Updater.init();
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
		if (err || !(addresses && addresses[0])) {
			console.error("Couldn't find an IP for " + ( host || "undefined" ) + ", is it a valid address?");
			ipBack(true);
		}else{
			if ( Utils.isIP(addresses[0])) {
				ipBack(null, addresses[0]);
			}else{
				getIP(addresses[0], ipBack);
			}
		}
	});
};

function getSRV(host, srvBack){
	dns.resolve( "_minecraft._tcp." + host, 'SRV', function (err, addresses) {
		if ( err || !(addresses && addresses[0] && addresses[0].name && addresses[0].port)) {
			//console.info("No SRV for " + host)
			srvBack(true);
		}else{
			//console.info("Found SRV record for " + host);
			srvBack(null, addresses[0].name.charAt(addresses[0].name.length-1) === '.' ? addresses[0].name.slice(0, -1) : addresses[0].name, addresses[0].port);
		}
	});
};

function doServerListPing(data, callback) {
	var hostData = { host: data.host, port: data.queryPort || data.port },
		dataLength = -1,
		currentLength = 0,
		chunks = [],
		socket = net.connect(hostData, function () {
			modernRequestBack(socket, hostData);
		});

	socket.setTimeout(3000, socket.destroy);

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

				//console.log('[Minecraft Integration] Server responded with:\n' + util.inspect(resp));

				data.isServerOnline = 1;

				if (resp.description)             data.motd     = resp.description;
				if (resp.version.protocolVersion) data.protocol = resp.version.protocolVersion;
				if (resp.favicon)                 data.icon     = resp.favicon;
				if (resp.players.sample)          data.players  = resp.players.sample;

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
					var modNames = [ ];
					data.modList = [ ];
					data.hasMods = !!fullModList.length;
					for (var i = 0; i < fullModList.length; i++) {
						var pipedMod = fullModList[i].modid.split("|")[0];
						if (modNames.indexOf(pipedMod) == -1) {
							modNames.push(pipedMod);
							data.modList.push({modid: pipedMod});
						}
					}
				}

				data.modList = data.modList ? data.modList : [ ];

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
	var query = new mcquery( data.host, data.queryPort || data.port );

	function connect() {
		query.connect(function (err) {
			if (err) {
				if (!data.pluginList) data.pluginList = [];
				console.log(err);
				next(null, data);
			} else {
				// What is this?
				data.queryonline = true;

				query.full_stat(fullStatBack);
			}
		});
	}

	function fullStatBack(err, stat) {
		if (!err) {
			//console.log('[Minecraft Integration] Server responded with:\n' + util.inspect(stat));

			data.isServerOnline = 1;

			if (stat.hostname)   data.motd          = stat.hostname;
			if (stat.hostip)     data.hostip        = stat.hostip;
			if (stat.hostport)   data.hostport      = stat.hostport;
			if (stat.numplayers) data.onlinePlayers = stat.numplayers;
			if (stat.maxplayers) data.maxPlayers    = stat.maxplayers;
			if (stat.version)    data.version       = stat.version;
			if (stat.map)        data.map           = stat.map;
			if (stat.gametype)   data.gametype      = stat.gametype;
			if (stat.game_id)    data.game_id       = stat.game_id;

			if (stat.player_) {
				data.players = [ ];
				for (var i in stat.player_) {
					data.players[i] = {name: stat.player_[i]};
				}
			}

			if (stat.plugins) {
				var pluginString = stat.plugins.split(": ")[1];

				if (pluginString) {
					data.hasPlugins = true;
					data.pluginList = [];
					pluginString = pluginString.split("; ");

					for (var i = 0; i < pluginString.length; i++) {
						data.pluginList[i] = { name: pluginString[i] };
					}
				}
			}
		}else{
			console.log(err);
		}

		shouldWeClose();
		next(null, data);
	}

	function shouldWeClose() {
		//have we got all answers
		if (query.outstandingRequests() === 0) {
			query.close();
		}
	}

	connect();
};
