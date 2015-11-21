// Global
MinecraftIntegration = { templates: { }, avatars: { } };

// TODO: This still needs a ton of work.
(function(){

	"use strict";

	MinecraftIntegration.log = function (memo) {
		if (typeof memo === 'object') {
			console.log(memo);
		}else{
			console.log("[Minecraft Integration] " + memo);
		}
	};

	MinecraftIntegration.log("Loading...");
	MinecraftIntegration.__MIDIR = "/plugins/nodebb-plugin-minecraft-integration/public/";

	function addPrefixes(event, data) {

		if (ajaxify.data.prefixes) {

			$('[data-pid]:not([data-prefix])').each(function () {
				var $el = $(this);
				var prefix = ajaxify.data.prefixes[$el.attr("data-uid")];
				if (!prefix) {
					socket.emit('plugins.MinecraftIntegration.getPrefix', {uid:$el.attr("data-uid")}, function (err, data) {
						$el.attr("data-prefix", data.prefix);
						if (data.prefix) $el.find(".username>a").prepend('<span class="prefix" style="text-shadow: 0.5px 0.5px rgba(0,0,0,0.5);">' + data.prefix + '</span><br>');
					});
				}else{
					$el.attr("data-prefix", prefix);
					$el.find('.username>a').prepend('<span class="prefix" style="text-shadow: 0.5px 0.5px rgba(0,0,0,0.5);">' + prefix + '</span><br>');
					$el.find('[itemprop="author"]').prepend('<span class="prefix" style="text-shadow: 0.5px 0.5px rgba(0,0,0,0.5);">' + prefix + '</span>&nbsp&nbsp');
				}
			});
		}
	}
	$(window).on('action:posts.loaded',          addPrefixes);
	$(window).on('action:ajaxify.contentLoaded', addPrefixes);

	MinecraftIntegration.getTemplate = function (template, callback) {
		if (MinecraftIntegration.templates[template]) {
			callback(null, MinecraftIntegration.templates[template]);
		}else{
			MinecraftIntegration.log("Getting template: " + template);
			$.get(MinecraftIntegration.__MIDIR + "templates/" + template + "?v=" + config['cache-buster'], function(data) {
				MinecraftIntegration.templates[template] = data;
				MinecraftIntegration.log("Got template: " + MinecraftIntegration.templates[template]);
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
			socket.emit('plugins.MinecraftIntegration.getRegisteredUser', {id: $avatar.data('uuid')}, function (err, userData) {
				if (!err && userData && userData.username) {
					$avatar.wrap('<a href="/user/' + userData.username + '"></a>');
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
			MinecraftIntegration.log("Received invalid status data.");
			MinecraftIntegration.log(data);
			return;
		}

		MinecraftIntegration.getTemplate("partials/playerAvatars.tpl", function (err, avatarTemplate) {

			if (err) return MinecraftIntegration.log(err);
			if (!avatarTemplate) return MinecraftIntegration.log("Avatar Template was null.");

			// Loop widgets with a current players display.
			// TODO: Don't select widgets that have avatars turned off.
			$('[data-widget="mi-status"][data-sid="' + data.sid + '"], [data-widget="mi-players-grid"][data-sid="' + data.sid + '"]').each(function (i, $widget) {

				// Re-wrap
				$widget = $($widget);

				// Loop avatars and remove players no longer on the server.
				$widget.find('.mi-avatar').each(function (i, el) {

					// Re-wrap
					var $avatar = $(el);

					// If the player's online, return.
					for (var i in data.players) {
						if (data.players[i].id && data.players[i].name) {
							if ($avatar.data('uuid') === data.players[i].id) return;
						}
					}

					// Otherwise, fade it out.
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
						}
					});

					if (!found) {

						socket.emit('plugins.MinecraftIntegration.getAvatar', {name: player.name}, function (err, avatar) {

							if (err) return MinecraftIntegration.log(err);
							if (!avatar) return MinecraftIntegration.log("No avatar found for " + player.name);

							var html = avatarTemplate
							.replace("{url}", "data:image/png;base64," + avatar)
							.replace("{players.name}", player.name)
							.replace("{name}", player.name)
							.replace("{styleGlory}", "")
							.replace("{players.glory}", "");

							var $avatar = $(html);

							$avatar.css("display", "none");
							$avatar.data('uuid', player.id);

							$avatar.appendTo($widget.find('.mi-avatars'));

							// Wrap avatar in profile link if user is registered.
							wrapAvatar($avatar);

							$avatar.fadeToggle(600, 'linear');

						});

					}

					// Set avatar borders if complete.
					if (!--pendingPlayers) MinecraftIntegration.setAvatarBorders($widget);

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

				var $avatars = $widget.find('.mi-avatar');
				$avatars.each(function (i, $avatar) {
					$avatar = $($avatar);
					var id = $avatar.data('uuid');

					if (id) {
						socket.emit('plugins.MinecraftIntegration.getPlayer', {id: id}, function (err, playerData) {
							var playtime = parseInt(playerData.playtime, 10);
							if (playtime > 60) {
								playtime = Math.floor(playtime / 60).toString() + " Hours, " + (playtime % 60).toString();
							}
							$avatar.parent().parent().find('.mi-score').html(playtime);
						});
						wrapAvatar($avatar);
					}
				});

				MinecraftIntegration.setAvatarBorders($widget);
			});
		});
	};

	MinecraftIntegration.addPlayer = function (data) {

		var player = data.player;

		MinecraftIntegration.getTemplate("partials/playerAvatars.tpl", function (err, avatarTemplate) {

			// Asserts
			if (err) return MinecraftIntegration.log(err);
			if (!avatarTemplate) return MinecraftIntegration.log("Avatar Template was null.");

			// Loop widgets with a current players display.
			// TODO: Don't select widgets that have avatars turned off.
			$('[data-widget="mi-status"][data-sid="' + data.sid + '"], [data-widget="mi-players-grid"][data-sid="' + data.sid + '"]').each(function (i, $widget) {

				var $widget = $(this);

				// Add the player only if they are not already listed.
				$widget.find('.mi-avatar').each(function(){
					if ($(this).data('uuid') === player.id) return;
				});

				socket.emit('plugins.MinecraftIntegration.getAvatar', {name: player.name}, function (err, avatar) {

					if (err) return MinecraftIntegration.log(err);
					if (!avatar) return MinecraftIntegration.log("No avatar found for " + player.name);

					var html = avatarTemplate
					.replace("{url}", "data:image/png;base64," + avatar)
					.replace("{players.name}", player.name)
					.replace("{name}", player.name)
					.replace("{styleGlory}", "")
					.replace("{players.glory}", "");

					var $avatar = $(html);

					$avatar.css("display", "none");
					$avatar.data('uuid', player.id);

					$avatar.appendTo($widget.find('.mi-avatars'));

					// Wrap avatar in profile link if user is registered.
					wrapAvatar($avatar);

					$avatar.fadeToggle(600, 'linear');

				});

				// Update player count.
				$widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) + 1);

			});

		});
	};

	MinecraftIntegration.removePlayer = function (data) {
		$('[data-sid="' + data.sid + '"]').each(function (i, el) {
			var $widget = $(el);

			switch ($widget.attr('data-widget')) {
				case 'mi-status':
				case 'mi-players-grid':

					// Remove players no longer on the server.
					$widget.find('.mi-avatar').each(function (i, el) {
						var $avatar = $(el);

						if ($avatar.data('uuid') !== data.player.id) return;

						if ($avatar.parent().is('a')) $avatar = $avatar.parent();
						$avatar.fadeToggle(600, 'linear', function () {
							$avatar.remove();
							MinecraftIntegration.setAvatarBorders($widget);
						});
					});

					$widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) - 1);

					$('.tooltip').remove();
				break;
			}
		});
	};

	socket.on('mi.PlayerJoin', function (data) {
		MinecraftIntegration.addPlayer(data);
		MinecraftIntegration.updateCharts(data);
	});

	socket.on('mi.PlayerQuit', function (data) {
		MinecraftIntegration.removePlayer(data);
		MinecraftIntegration.updateCharts(data);
	});

	socket.on('mi.status', function (data) {
		MinecraftIntegration.log("Received Status Ping from " + data.name + ":");
		MinecraftIntegration.log(data);
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
	});

	socket.on('mi.PlayerChat', function (data) {
		$('[data-widget="mi-chat"][data-sid="' + data.sid + '"]').each(function (i, $widget) {
			$widget = $($widget);

			$widget.find('div').append("<span>" + data.chat.name + ": " + data.chat.message + "</span><br>");
			$widget.find('div').scrollTop(100000);
		});
	});

	define('admin/plugins/minecraft-integration', function () {
		MinecraftIntegration.init = function () {
			require([MinecraftIntegration.__MIDIR + 'js/acp.js'], function (miACP) {
				miACP.load();
			});
		};

		return MinecraftIntegration;
	});

	$(document).ready(function() {
		var $body = $('body');
		$body.tooltip({
			selector: '.has-tooltip, .mi-avatar',
			container: 'body',
			viewport: { selector: 'body', padding: 20 }
		});
	});

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

	function resizeCanvases() {
		$('.mi-iframe, .mi-canvas').each(function () {
			var $this = $(this),
				heightRatio = $this.attr('data-height-ratio');

			heightRatio = typeof heightRatio == 'undefined' ? 2 : parseInt(heightRatio);
			heightRatio = isNaN(heightRatio) ? 2 : heightRatio < 1 ? 2 : heightRatio;
			$this.attr('width', $this.parent().width());
			$this.attr('height', $this.parent().width() / heightRatio);
			$this.css('width', $this.parent().width());
			$this.css('height', $this.parent().width() / heightRatio);
		});
	}

	MinecraftIntegration.updateCharts = function (status) {

		$('[data-widget="mi-players-graph"][data-sid="' + status.sid + '"]').each(function (i, $widget) {

			$widget = $($widget).find('.mi-canvas');
			if (!$widget.length) return;

			var chart = $widget.data('chart');

			$.get('/api/minecraft-integration/server/' + status.sid, function (status) {
				if (typeof status !== 'object' || !status.players || !Array.isArray(status.players)) return;

				chart.datasets[0].points[chart.datasets[0].points.length - 1].value = status.players.length;
				chart.update();
			});
		});
	};

	// Setup charts
	MinecraftIntegration.setGraphs = function (status) {

		// Require chart.js
		require(['/vendor/chart.js/chart.min.js'], function (Chart) {

			// MEMO: We gets pings separately because graphs will be able to specify different ranges.
			// TODO: Need to DRY this.

			$('[data-widget="mi-players-graph"][data-sid="' + status.sid + '"]').each(function (i, widget) {

				var	$widget = $(widget),
					$canvas = $widget.find('.mi-canvas'),
					chart = $canvas.data('chart');

				socket.emit('plugins.MinecraftIntegration.getRecentPings', {sid: status.sid}, function (err, pings) {

					if (err) return MinecraftIntegration.log(err);

					var fillColor = $widget.attr('data-chart-color-fill') ? $widget.attr('data-chart-color-fill') : "rgba(151,187,205,1)";

					var	data = {
						labels: [ ],
						datasets: [
							{
								label: "",
								fillColor: fillColor,
								strokeColor: "rgba(151,187,205,1)",
								pointColor: "rgba(151,187,205,1)",
								pointStrokeColor: "#fff",
								pointHighlightFill: "#fff",
								pointHighlightStroke: "rgba(151,187,205,1)",
								data: [ ]
							}
						]
					};

					var	scaleMax = 10, date, hours, minutes, meridiem;

					for	(var stamp in pings) {
						date = new Date(parseInt(stamp,10));
						hours = date.getHours() < 13 ? (date.getHours() === 0 ? 12 : date.getHours()) : date.getHours() - 12;
						minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
						meridiem = date.getHours() < 12 ? "AM" : "PM";

						data.labels.unshift(hours + ":" + minutes + " " + meridiem);
						data.datasets[0].data.unshift(pings[stamp].players.length);

						if (pings[stamp].players.length > scaleMax) scaleMax = pings[stamp].players.length;
					}

					if ($widget.data('chart')) {

						var	chart = $widget.data('chart');

						for (var i in data.labels) {
							if (!chart.datasets[0].points[i]) continue;

							chart.datasets[0].points[i].label = data.labels[i];
							chart.datasets[0].points[i].value = data.datasets[0].data[i];
						}

						chart.update();

					}else{

						var	options = {
							showScale: false,
							scaleShowGridLines : true,
							scaleGridLineColor : "rgba(0,0,0,.05)",
							scaleGridLineWidth : 1,
							scaleShowHorizontalLines: true,
							scaleShowVerticalLines: true,
							scaleOverride : true,
							scaleStepWidth : 1,
							scaleStartValue : 0,
							bezierCurve : false,
							bezierCurveTension : 0.4,
							pointDot : true,
							pointDotRadius : 2,
							pointDotStrokeWidth : 1,
							pointHitDetectionRadius : 4,
							datasetStroke : true,
							datasetStrokeWidth : 2,
							datasetFill : true,
							scaleBeginAtZero: true,
							responsive: true,
							tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %> Players Online",
							backgroundColor: "#ffffff",
							scaleSteps: scaleMax + 1
						};

						$widget.data('chart', new Chart($canvas[0].getContext('2d')).Line(data, options));

					}

				});

			});

			$('[data-widget="mi-tps-graph"][data-sid="' + status.sid + '"]').each(function (i, widget) {

				var	$widget = $(widget),
					$canvas = $widget.find('.mi-canvas'),
					chart = $canvas.data('chart');

				socket.emit('plugins.MinecraftIntegration.getRecentPings', {sid: status.sid}, function (err, pings) {

					if (err) return MinecraftIntegration.log(err);

					var fillColor = $widget.attr('data-chart-color-fill') ? $widget.attr('data-chart-color-fill') : "rgba(151,187,205,1)";

					var data = {
						labels: [ ],
						datasets: [
							{
								label: "",
								fillColor: fillColor,
								strokeColor: "rgba(151,187,205,1)",
								pointColor: "rgba(151,187,205,1)",
								pointStrokeColor: "#fff",
								pointHighlightFill: "#fff",
								pointHighlightStroke: "rgba(151,187,205,1)",
								data: [ ]
							}
						]
					};

					var date, hours, minutes, meridiem;

					for (var stamp in pings) {
						date = new Date(parseInt(stamp,10));
						hours = date.getHours() < 13 ? (date.getHours() === 0 ? 12 : date.getHours()) : date.getHours() - 12;
						minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
						meridiem = date.getHours() < 12 ? "AM" : "PM";
						data.labels.unshift(hours + ":" + minutes + " " + meridiem);
						data.datasets[0].data.unshift(pings[stamp].tps);
					}

					if ($widget.data('chart')) {

						var	chart = $widget.data('chart');

						for (var i in data.labels) {
							if (!chart.datasets[0].points[i]) continue;

							chart.datasets[0].points[i].label = data.labels[i];
							chart.datasets[0].points[i].value = data.datasets[0].data[i];
						}

						chart.update();

					}else{

						var options = {
							showScale: false,
							scaleShowGridLines : true,
							scaleGridLineColor : "rgba(0,0,0,.05)",
							scaleGridLineWidth : 1,
							scaleShowHorizontalLines: true,
							scaleShowVerticalLines: true,
							scaleOverride : true,
							scaleStepWidth : 1,
							scaleStartValue : 14,
							bezierCurve : false,
							bezierCurveTension : 0.4,
							pointDot : true,
							pointDotRadius : 2,
							pointDotStrokeWidth : 1,
							pointHitDetectionRadius : 4,
							datasetStroke : true,
							datasetStrokeWidth : 2,
							datasetFill : true,
							scaleBeginAtZero: true,
							responsive: true,
							tooltipTemplate: "<%if (label){%><%=label%><%}%>: <%= value %> TPS",
							backgroundColor: "#ffffff",
							scaleSteps: 7
						};

						$widget.data('chart', new Chart($canvas[0].getContext('2d')).Line(data, options));

					}

				});

			});

			$('[data-widget="mi-top-graph"][data-sid="' + status.sid + '"]').each(function (i, widget) {

				var	$widget = $(widget),
					$canvas = $widget.find('.mi-canvas'),
					chart = $canvas.data('chart');

				socket.emit('plugins.MinecraftIntegration.getTopPlayersByPlaytimes', {show: 10}, function (err, players) {

					if (err) return MinecraftIntegration.log(err);
					if (!players.length) return;

					var	data = [ ];

					var rainbow = getRainbow($widget, players.length > 1 ? players.length - 1 : 1);

					var options = {
						responsive: true,
						tooltipTemplate: "<%if (label){%><%=label%><%}%>: <%= value %>"
					};

					if (chart) {

						for (var i in players) {

							if (!chart.segments[i]) continue;

							chart.segments[i].value = parseInt(players[i].playtime, 10);
							chart.segments[i].label = players[i].playername || players[i].name;
							if (rainbow) chart.segments[i].fillColor = '#' + rainbow.colourAt(i);

						}

						chart.update();

					}else{

						for (var i in players) {

							var color = "#5B94DE";
							if (rainbow) color = '#' + rainbow.colourAt(i);

							data.push({
								value: parseInt(players[i].playtime, 10),
								color: color,
								highlight: "#AADDFF",
								label: players[i].playername || players[i].name
							});
						}

						$canvas.data('chart', new Chart($canvas[0].getContext('2d')).Pie(data, options));

					}

				});

			});

		});

	};

	// Do initial setup.
	$(window).on('action:widgets.loaded', function (event) {

		// Requires
		require([MinecraftIntegration.__MIDIR + 'js/vendor/rainbowvis.js'], function () {

			// Find servers to be setup.
			var sids = [ ];

			// Loop through widget containers.
			$('.mi-container').each(function(){

				var	$this = $(this),
					$parent = $this.parent(),
					sid = $this.attr('data-sid');

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

								socket.emit('plugins.MinecraftIntegration.eventWebChat', {sid: $chatwidget.attr('data-sid'), name: app.user.username, message: $this.parent().prev().children('input').val()});
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

		});

	});

	$(window).on('action:ajaxify.end', function (event, url) {

		url = url.url.split('?')[0].split('#')[0];

		switch (url) {
			case 'admin/extend/widgets':
				require([MinecraftIntegration.__MIDIR + 'js/acp-widgets.js'], function (module) {
					module.init();
				});
				break;
		}
	});

}());
