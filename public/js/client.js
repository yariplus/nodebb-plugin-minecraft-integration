MinecraftIntegration = {};

(function(){

	function log(memo, object) {

		if (!(config.MinecraftIntegration && config.MinecraftIntegration.debug)) return;

		if (typeof memo === 'object') {
			console.dir(memo);
		}else{
			console.log("[Minecraft Integration] " + memo);
			if (object) console.dir(object);
		}
	}

	MinecraftIntegration.staticDir = "/plugins/nodebb-plugin-minecraft-integration/public/";
	MinecraftIntegration.templates = { };

	$('body').on('click', '.resetPlayerKey', function () {
		socket.emit('plugins.MinecraftIntegration.resetPlayerKey', {uid: app.user.uid}, function (err, data) {
			if (err) return log(err.message);
			if (!(data && data.key)) return log("Received invalid response to resetPlayerKey call.");

			$('[name="player-key"]').html('key-' + data.key);
			$('.copyPlayerKey').attr('data-clipboard-text', 'key-' + data.key);
		});
	});

	$(window).on('action:ajaxify.end', function (event, url) {

		url = url.url.split('?')[0].split('#')[0];

		// Minecraft profile page.
		if (url.match(/user\/[^\/]*\/minecraft/)) {

			var key = $('[name="player-key"]').html();

			$('.copyPlayerKey').attr('data-clipboard-text', key);

			require(['//cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.5/clipboard.min.js'], function (Clipboard) {
				var clipboard = new Clipboard('.copyPlayerKey');

				$('.copyPlayerKey')
					.mouseout(function () {
						$(this).tooltip('destroy');
					});

				clipboard.on('success', function(e) {
					e.clearSelection();
					$(e.trigger).tooltip({title:'Copied!',placement:'bottom'});
					$(e.trigger).tooltip('show');
				});
			});
		}
	});

	$(window).on('action:widgets.loaded', function(){
		var scripts = [
			MinecraftIntegration.staticDir + 'js/vendor/rainbowvis.js',
			'//cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.5/clipboard.min.js',
			'//d3js.org/d3.v3.min.js'
		];

		require(scripts, function (Rainbow, Clipboard, d3) {
			"use strict";

			console.log("Loading Minecraft Integration...");

			// Do initial setup.

			// Find servers to be setup.
			var sids = [ ];
			log("Preparing widgets.");

			// Loop through widget containers.
			$('.mi-container').each(function(){

				var	$this = $(this),
					$parent = $this.parent(),
					sid = $this.attr('data-sid');

				log("Preparing widgets for " + sid);

				// Add paddings based on container.
				if (!$parent.is('[widget-area]')) {
					$parent.css('padding-top', '0').css('padding-left', '0').css('padding-right', '0').css('padding-bottom', '0');
				}else{
					$parent.css('padding-top', '10px').css('padding-bottom', '10px');
				}

				// If not in server list, add it.
				if (!~sids.indexOf(sid)) sids.push(sid);

			});

			// ???
			resizeCanvases();

			sids.forEach(function (sid) {

				socket.emit('plugins.MinecraftIntegration.getServerStatus', {sid: sid}, function (err, status) {
					if (err || !status) return log("No Status");
					log("Got initial status", status);
					MinecraftIntegration.setPlayers(status);
					MinecraftIntegration.setGraphs(status);
				});

				var widgetsChat = $('[data-widget="mi-chat"][data-sid="' + sid + '"]');

				if (widgetsChat.length) {
					socket.emit('plugins.MinecraftIntegration.getChat', {sid: sid}, function (err, data) {
						widgetsChat.each(function (i, $chatwidget) {
							$chatwidget = $($chatwidget);
							var $chatbox    = $chatwidget.find('div');

							for (var i in data.chats) {
								$chatbox.append("<span>" + data.chats[i].name + ": " + data.chats[i].message + "</span><br>");
							}

							$chatwidget.find('button').click(function (e) {

								if (app.user.uid === 0) return;

								var $this = $(this);

								var chatData = {
									sid: $chatwidget.attr('data-sid'),
									name: app.user.username,
									message: $this.parent().prev().children('input').val()
								};

								socket.emit('plugins.MinecraftIntegration.eventWebChat', chatData);

								log("Sending chat: ", chatData);
								$this.parent().prev().children('input').val('');

							});

							$chatwidget.find('input').keyup(function(e){
								if (app.user.uid === 0) return;
								if(e.keyCode == 13)
								{
									var $this = $(this);

									socket.emit('plugins.MinecraftIntegration.eventWebChat', {sid: $chatwidget.attr('data-sid'), name: app.user.username, message: $this.val()});
									$this.val('');
								}
							});

							$chatbox.scrollTop(100000);
						});
					});
				}
			});

			resizeCanvases();

			var	clipboard = new Clipboard('.mi-serveraddresscopy');

			$('.mi-serveraddresscopy')
				.mouseout(function () {
					$(this).tooltip('destroy');
					$(this).removeClass('mi-highlight');
					$(this).prev().removeClass('mi-highlight');
				})
				.mouseenter(function () {
					$(this).addClass('mi-highlight');
					$(this).prev().addClass('mi-highlight');
				})
				.removeClass('hide');

			clipboard.on('success', function(e) {
				e.clearSelection();
				$(e.trigger).tooltip({title:'Copied!',placement:'bottom'});
				$(e.trigger).tooltip('show');
			});

			// Vault Prefixes
			function addPrefix($el, prefix) {
				$el.find('.username>a').prepend('<span class="prefix">' + prefix + '</span><br>');
				$el.find('[itemprop="author"]').prepend('<span class="prefix">' + prefix + '</span>&nbsp&nbsp');
			}
			function addPrefixes(event, data) {
				if (!config.MinecraftIntegration.showPrefixes) return;

				if (ajaxify.data.prefixes) {

					$('[data-pid]:not([data-prefix])').each(function () {

						var $el = $(this), prefix = ajaxify.data.prefixes[$el.attr("data-uid")];

						$el.attr("data-prefix", "true");

						if (prefix) return addPrefix($el, prefix);
						if (prefix === null) return;

						socket.emit('plugins.MinecraftIntegration.getPrefix', {uid:$el.attr("data-uid")}, function (err, data) {
							if (data.prefix) addPrefix($el, data.prefix);
						});

					});
				}
			}
			$(window).on('action:posts.loaded', addPrefixes);
			$(window).on('action:ajaxify.end',  addPrefixes);
			addPrefixes();

			function getAvatarUrl(name) {
				return "/api/minecraft-integration/avatar/" + name + "/64";
			}

			MinecraftIntegration.getTemplate = function (template, callback) {
				if (MinecraftIntegration.templates[template]) {
					callback(null, MinecraftIntegration.templates[template]);
				}else{
					log("Getting template: " + template);
					$.get(MinecraftIntegration.staticDir + "templates/" + template + "?v=" + config['cache-buster'], function(data) {
						MinecraftIntegration.templates[template] = data;
						log("Got template: " + MinecraftIntegration.templates[template]);
						callback(null, data);
					});
				}
			};

			// When avatars change, render new effects.
			MinecraftIntegration.setAvatarBorders = function ($widget) {

				var	$avatars = $widget.find('.mi-avatar'),
					$scores  = $widget.find('.score');

				if ($avatars.length === 0) return;
				if ($widget.is(':not([data-colors="on"])')) return;

				var rainbow = getRainbow($widget, $avatars.length > 1 ? $avatars.length - 1 : $avatars.length);

				if (!rainbow) return;

				$avatars.each(function (i, el) {
					$(el).css('border-style', $widget.attr('data-border') || 'none');
					$(el).css('border-color', '#' + rainbow.colourAt(i));
				});

				$scores.each(function (i, el) {
					$(el).css('color', '#' + rainbow.colourAt(i));
				});

			};

			function getRainbow($widget, range) {

				if (!Rainbow) return null;

				var	rainbow = new Rainbow();

				var	colorStart = $widget.attr('data-color-start') || "white",
					colorEnd   = $widget.attr('data-color-end')   || "white";

				colorStart = colorStart.slice(0, 1) === '#' ? colorStart.slice(1) : colorStart;
				colorEnd   = colorEnd.slice(0, 1) === '#'   ? colorEnd.slice(1) : colorStart;

				rainbow.setNumberRange(0, range);
				rainbow.setSpectrum(colorStart, colorEnd);

				return rainbow;

			}

			// Wrap avatar in profile link if user is registered.
			function wrapAvatar($avatar) {
				if (!$avatar.parent().is('a')) {
					socket.emit('plugins.MinecraftIntegration.getUser', {id: $avatar.data('uuid')}, function (err, userData) {
						if (!err && userData && userData.userslug) {
							$avatar.wrap('<a href="/user/' + userData.userslug + '"></a>');
						}else{
							$avatar.wrap('<a></a>');
						}
						$avatar.parent().click(function () {
							$('.tooltip').remove();
						});
					});
				}
			}

			// When a new status update is received, refresh widgets that track players.
			// TODO: This does too many things, separate into more functions based on each task.
			MinecraftIntegration.setPlayers = function (data) {

				if (!(data && data.sid !== void 0 && Array.isArray(data.players))) {
					log("Received invalid status data.");
					log(data);
					return;
				}

				MinecraftIntegration.getTemplate("partials/playerAvatars.tpl", function (err, avatarTemplate) {

					if (err) return log(err);
					if (!avatarTemplate) return log("Avatar Template was null.");

					// Loop widgets with a current players display.
					// TODO: Don't select widgets that have avatars turned off.
					$('[data-widget="mi-status"][data-sid="' + data.sid + '"], [data-widget="mi-players-grid"][data-sid="' + data.sid + '"]').each(function (i, $widget) {

						// Re-wrap
						$widget = $($widget);

						// Update Icon Time
						var	updateTime = data.updateTime || Date.now();
						$widget.find(".mc-statusicon")
							.attr('data-original-title', moment(parseInt(updateTime, 10)).format('MMM Do h:mma'))
							.attr('data-title', moment(parseInt(updateTime, 10)).format('MMM Do h:mma'));

						// Loop avatars and remove players no longer on the server.
						$widget.find('.mi-avatar').each(function (i, el) {

							// Re-wrap
							var $avatar = $(el);

							// If the player's online, return.
							for (var i in data.players) {
								if (data.players[i].id && data.players[i].name) {
									if ($avatar.data('uuid') === data.players[i].id) return;
									log("Kept " + data.players[i].name);
								}
							}

							// Otherwise, fade it out.
							log("Fading " + $avatar.attr('data-original-title'));
							if ($avatar.parent().is('a')) $avatar = $avatar.parent();
							$avatar.fadeToggle(600, 'linear', function () {
								$avatar.remove();
							});

						});

						// Track number of players left to add.
						var pendingPlayers = data.players.length;

						// Add players now on the server.
						data.players.forEach(function (player) {

							var found = false;

							$widget.find('.mi-avatar').each(function () {
								var $avatar = $(this);

								if ($avatar.data('uuid') === player.id) {
									found = true;
									log("Found " + player.name);
								}
							});

							if (!found) {

								var $avatar = $(avatarTemplate
								.replace("{url}", getAvatarUrl(player.name))
								.replace("{players.name}", player.name)
								.replace("{name}", player.name)
								.replace("{styleGlory}", "")
								.replace("{players.glory}", ""));

								$avatar.css("display", "none");
								$avatar.data('uuid', player.id);

								$avatar.appendTo($widget.find('.mi-avatars'));

								// Wrap avatar in profile link if user is registered.
								wrapAvatar($avatar);

								$avatar.load(function(){
									log("Fading in " + player.name);
									$avatar.fadeIn(600, 'linear');
									if (!--pendingPlayers) MinecraftIntegration.setAvatarBorders($widget);
								});
							}else{
								// Set avatar borders if complete.
								if (!--pendingPlayers) MinecraftIntegration.setAvatarBorders($widget);
							}

						});

						// Set player count text.
						$widget.find(".online-players").text(data.players.length);

						var $popover;

						if ($widget.attr('data-widget') === 'mi-status') {
							$popover = $widget.find('a.fa-plug');
							if ($popover.length && Array.isArray(data.pluginList) && data.pluginList.length) {
								var html = '<table class="table table-plugin-list"><tbody>';

								for (var i = 0; i < data.pluginList.length; i++) {
									html += '<tr><td>' + data.pluginList[i].name + '</td></tr>';
								}

								html += '</tbody></table>';
								$popover.attr('data-content', html);
								$popover.popover({
									container: 'body',
									viewport: { selector: 'body', padding: 20 },
									template: '<div class="popover plugin-list"><div class="arrow"></div><div class="popover-inner"><h1 class="popover-title"></h1><div class="popover-content"><p></p></div></div></div>'
								});
							}

							$popover = $widget.find('a.fa-gavel');
							if ($popover.length && data.modList) {
								var html = '<table class="table table-mod-list"><tbody>';

								for (var i in data.modList) {
									html += '<tr><td>' + data.modList[i].modid + '</td></tr>';
								}

								html += '</tbody></table>';
								$popover.attr('data-content', html);
								$popover.popover({
									container: 'body',
									viewport: { selector: 'body', padding: 20 },
									template: '<div class="popover mod-list"><div class="arrow"></div><div class="popover-inner"><h1 class="popover-title"></h1><div class="popover-content"><p></p></div></div></div>'
								});
							}
						}
					});

					$('[data-widget="mi-top-list"][data-sid="' + data.sid + '"]').each(function (i, $widget) {

						$widget = $($widget);

						var	$avatars = $widget.find('.mi-avatar'),
							pendingPlayers = $avatars.length;

						$avatars.each(function (i, $avatar) {

							$avatar = $($avatar);

							var id = $avatar.data('uuid');

							if (!id) return --pendingPlayers;

							socket.emit('plugins.MinecraftIntegration.getPlayer', {id: id}, function (err, playerData) {

								var playtime = parseInt(playerData.playtime, 10);
								if (playtime > 60) {
									playtime = Math.floor(playtime / 60).toString() + " Hours, " + (playtime % 60).toString();
								}
								$avatar.closest('tr').find('.mi-score').html(playtime);

								if (!--pendingPlayers) MinecraftIntegration.setAvatarBorders($widget);

							});

							wrapAvatar($avatar);

						});

					});
				});
			};

			MinecraftIntegration.addPlayer = function (data) {

				var player = data.player;

				MinecraftIntegration.getTemplate("partials/playerAvatars.tpl", function (err, avatarTemplate) {

					// Asserts
					if (err) return log(err);
					if (!avatarTemplate) return log("Avatar Template was null.");

					// Loop widgets with a current players display.
					// TODO: Don't select widgets that have avatars turned off.
					$('[data-widget="mi-status"][data-sid="' + data.sid + '"], [data-widget="mi-players-grid"][data-sid="' + data.sid + '"]').each(function (i, $widget) {

						var $widget = $(this);

						// Add the player only if they are not already listed.
						var found = false;
						$widget.find('.mi-avatar').each(function(){
							if ($(this).data('uuid') === player.id) return found = true;
						});
						if (found) return;

						var $avatar = $(avatarTemplate
						.replace("{url}", getAvatarUrl(player.name))
						.replace("{players.name}", player.name)
						.replace("{name}", player.name)
						.replace("{styleGlory}", "")
						.replace("{players.glory}", ""));

						$avatar.css("display", "none");
						$avatar.data('uuid', player.id);

						$avatar.appendTo($widget.find('.mi-avatars'));

						// Wrap avatar in profile link if user is registered.
						wrapAvatar($avatar);

						$avatar.load(function(){

							$avatar.fadeIn(600, 'linear');
							MinecraftIntegration.setAvatarBorders($widget);

							// Update player count.
							$widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) + 1);

						});

					});

				});
			};

			// Remove a single player from widgets.
			MinecraftIntegration.removePlayer = function (data) {

				// TODO: Better selectors.
				$('[data-sid="' + data.sid + '"]').each(function (i, el) {
					var $widget = $(el);

					switch ($widget.attr('data-widget')) {
						case 'mi-status':
						case 'mi-players-grid':

							// Store if the player is actually on the list.
							var found = false;

							// Remove the player who is no longer on the server.
							$widget.find('.mi-avatar').each(function (i, el) {

								found = true;

								var $avatar = $(el);

								if ($avatar.data('uuid') !== data.player.id) return;

								if ($avatar.parent().is('a')) $avatar = $avatar.parent();
								$avatar.fadeToggle(600, 'linear', function () {
									$avatar.remove();
									MinecraftIntegration.setAvatarBorders($widget);
								});
							});

							// If they were on the list, decrease the player count.
							if (found) $widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) - 1);

							// Don't leave tooltips behind.
							// TODO: Only remove MI tooltips.
							$('.tooltip').remove();
						break;
					}
				});
			};

			var rtime = new Date();
			var timeout = false;
			var delta = 300;
			$(window).resize(function() {
				rtime = new Date();
				if (timeout === false) {
					timeout = true;
					setTimeout(resizeend, delta);
				}
			});

			function resizeend() {
				if (new Date() - rtime < delta) {
					setTimeout(resizeend, delta);
				} else {
					timeout = false;
					resizeCanvases();
				}
			}

			function resizeCanvases()
			{
				$('.mi-chart').each(function()
				{
					var	$this   = $(this)
					,	chart   = $this.data('chart')
					,	data    = $this.data('chart-data')
					,	options = $this.data('chart-options');

					if (!chart) return;

					chart.draw(data, options);
				});
			}

			MinecraftIntegration.updateCharts = function (status) {
			};

			// Setup charts
			MinecraftIntegration.setGraphs = function (status) {
				//setGraphs(status);
			};

			function humanTime(stamp) {

				var	date     = new Date(parseInt(stamp,10))
				,	hours    = date.getHours() < 13 ? (date.getHours() === 0 ? 12 : date.getHours()) : date.getHours() - 12
				,	minutes  = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes()
				,	meridiem = date.getHours() < 12 ? "AM" : "PM";

				return hours + ":" + minutes + " " + meridiem;

			}

			function setGraphs(status) {

				$('[data-widget="mi-players-graph"][data-sid="' + status.sid + '"]').each(function (i, widget) {

					var	$widget   = $(widget),
						$chart    = $widget.find('.mi-chart'),
						chart     = $chart.data('chart'),
						fillColor = $widget.attr('data-chart-color-fill') ? $widget.attr('data-chart-color-fill') : "rgba(151,187,205,1)";

					socket.emit('plugins.MinecraftIntegration.getRecentPings', {sid: status.sid}, function (err, pings) {
						// TODO
					});
				});

				$('[data-widget="mi-tps-graph"][data-sid="' + status.sid + '"]').each(function (i, widget) {

					var	$widget   = $(widget),
						$chart    = $widget.find('.mi-chart'),
						chart     = $chart.data('chart'),
						fillColor = $widget.attr('data-chart-color-fill') ? $widget.attr('data-chart-color-fill') : "rgba(151,187,205,1)";

					socket.emit('plugins.MinecraftIntegration.getRecentPings', {sid: status.sid}, function (err, pings) {
						// TODO
					});

				});

				$('[data-widget="mi-top-graph"][data-sid="' + status.sid + '"]').each(function (i, widget) {

					var	$widget = $(widget),
						$canvas = $widget.find('.mi-canvas'),
						chart = $canvas.data('chart');

					socket.emit('plugins.MinecraftIntegration.getTopPlayersByPlaytimes', {show: 10}, function (err, players) {
						// TODO
					});
				});
			}
		});

	});

	socket.on('mi.PlayerJoin',  onPlayerJoin);
	socket.on('mi.PlayerQuit',  onPlayerQuit);
	socket.on('mi.status',      onStatus);
	socket.on('mi.PlayerChat',  onPlayerChat);
	socket.on('mi.PlayerVotes', onPlayerVotes);

	function onPlayerJoin(data) {
		MinecraftIntegration.addPlayer(data);
		MinecraftIntegration.updateCharts(data);
	}

	function onPlayerQuit(data) {
		MinecraftIntegration.removePlayer(data);
		MinecraftIntegration.updateCharts(data);
	}

	function onStatus(data) {
		log("Received Status Ping", data);

		MinecraftIntegration.setPlayers(data);
		MinecraftIntegration.setGraphs(data);

		var $widget = $('[data-sid="' + data.sid + '"]');

		if (parseInt(data.isServerOnline, 10)) {
			$widget.find(".mc-statusicon")
			.addClass("fa-check-circle")
			.addClass("text-success")
			.removeClass("fa-exclamation-circle")
			.removeClass("text-danger");
			$widget.find(".mc-statustext")
			.addClass("text-success")
			.removeClass("text-danger")
			.text("Online");
			$widget.find(".mc-playercount").show();
		}else{
			$widget.find(".mc-statusicon")
			.removeClass("fa-check-circle")
			.removeClass("text-success")
			.addClass("fa-exclamation-circle")
			.addClass("text-danger");
			$widget.find(".mc-statustext")
			.removeClass("text-success")
			.addClass("text-danger")
			.text("Offline");
			$widget.find(".mc-playercount").hide();
		}
	}

	function onPlayerChat(data) {
		$('[data-widget="mi-chat"][data-sid="' + data.sid + '"]').each(function (i, $widget) {
			$widget = $($widget);

			$widget.find('div').append("<span>" + data.chat.name + ": " + data.chat.message + "</span><br>");
			$widget.find('div').scrollTop(100000);
		});
	}

	function onPlayerVotes(data) {
		log(data);
	}

}());
