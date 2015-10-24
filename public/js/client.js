// Global
MinecraftIntegration = { templates: { }, API: { }, avatarEls: { } };

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
			console.log("Adding prefixes...");
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

	MinecraftIntegration.API.get = function (route, callback) {
		$.get("/api/minecraft-integration/" + route + "?v=" + config['cache-buster'], function (data) { callback(null, data); });
	};

	// 
	MinecraftIntegration.setAvatarBorders = function ($widget) {
		var	$avatars = $widget.find('.mi-avatar'),
			$scores  = $widget.find('.score');

		if ($avatars.length === 0 || $widget.is('[data-show-avatar-borders="off"]')) return console.log("No avatar borders", $widget.data('widget'), $avatars.length, $widget.is('[data-show-avatar-borders="off"]'));
		if (!($widget.data('color-start') || $widget.attr('data-avatar-border-start'))) return console.log("No colors", $widget.data('widget'));

		require([MinecraftIntegration.__MIDIR + 'js/vendor/rainbowvis.js'], function () {
			if (Rainbow) {
				var rainbow = new Rainbow();
				rainbow.setNumberRange(0, $avatars.length > 1 ? $avatars.length - 1 : $avatars.length);

				rainbow.setSpectrum($widget.attr('data-color-start') || $widget.attr('data-avatar-border-start') || 'white', $widget.attr('data-color-end') || $widget.attr('data-avatar-border-end') || 'white');

				$avatars.each(function (i, el) {
					$(el).css('border-style', $widget.attr('data-avatar-border-style') || 'solid');
					$(el).css('border-color', '#' + rainbow.colourAt(i));
				});
				$scores.each(function (i, el) {
					$(el).css('color', '#' + rainbow.colourAt(i));
				});
			}else{
				return MinecraftIntegration.log("Failed loading Rainbow-vis");
			}
		});
	};

	// When a new status update is received, refresh widgets that track players.
	// TODO: This does too many things, separate into more functions based on each task.
	MinecraftIntegration.setPlayers = function (data) {
		if (!(data && data.sid !== void 0 && Array.isArray(data.players))) {
			MinecraftIntegration.log("Received invalid status data.");
			MinecraftIntegration.log(data);
			return;
		}

		MinecraftIntegration.getTemplate("partials/playerAvatars.tpl", function (err, avatarTemplate) {

			$('[data-widget="mi-status"][data-sid="' + data.sid + '"], [data-widget="mi-players-grid"][data-sid="' + data.sid + '"]').each(function (i, $widget) {
				$widget = $($widget);

				// Remove players no longer on the server.
				$widget.find('.mi-avatar').each(function (i, el) {
					var $avatar = $(el);

					for (var i in data.players) {
						if (data.players[i].id && data.players[i].name) {
							if ($avatar.data('id') === data.players[i].id) return;
						}
					}

					$avatar.fadeToggle(600, 'linear', function () {
						$avatar.remove();
					});
				});

				var pendingPlayers = data.players.length;

				// Add players now on the server.
				data.players.forEach(function (player) {
					var i = data.players.indexOf(player);

					var found = false;

					$widget.find('.mi-avatar').each(function () {
						var $avatar = $(this);

						if ($avatar.data('id') === data.players[i].id) {
							found = true;
						}
					});

					if (!found) {
						MinecraftIntegration.API.get("avatar/" + data.players[i].name + "/base64", function (err, avatar) {
							if (err) console.log(err);

							if (avatar) {
								avatarTemplate = avatarTemplate.replace("{url}", "data:image/png;base64," + avatar);
								var $avatar = $($.parseHTML(avatarTemplate.replace("{name}", data.players[i].name).replace("{styleGlory}", "").replace("{players.glory}", "").replace("{players.name}", data.players[i].name)));
								$avatar.css("display", "none");
								$avatar.data('id', data.players[i].id);

								// if (!$avatar.parent().is('a')) {
									// socket.emit('getPlayer', data.players[i].id + "/username", function (err, username) {
										// if (username && username !== '[[global:guest]]') {
											// $avatar.wrap('<a href="/user/' + username + '"/>');
										// }
									// });
								// }

								$avatar.appendTo($widget.find('.mi-avatars'));
								$avatar.fadeToggle(600, 'linear');
							}
							if (!--pendingPlayers) MinecraftIntegration.setAvatarBorders($widget);
						});
						$widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) + 1);
					}else{
						if (!--pendingPlayers) MinecraftIntegration.setAvatarBorders($widget);
					}
				});

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

				// TODO: Reverse this so players is only traversed once.
				data.players.forEach(function (player) {
					var $img = $('[data-uuid="' + player.id + '"]');
					if ($img.length) {
						socket.emit('getPlayer', {id: player.id}, function (err, playerData) {
							var playtime = parseInt(playerData.playtime, 10);
							if (playtime > 60) {
								playtime = Math.floor(playtime / 60).toString() + " Hours, " + (playtime % 60).toString();
							}
							$img.parent().parent().find('.mi-score').html(playtime);
						});
					}
				});

				MinecraftIntegration.setAvatarBorders($widget);
			});
		});
	};

	MinecraftIntegration.removeTooltips = function ($el) {
		$el.find('.tooltip').each(function (i, el) {
			$(this).remove();
		});
	};

	MinecraftIntegration.addPlayer = function (data) {
		MinecraftIntegration.getTemplate("partials/playerAvatars.tpl", function (err, avatarTemplate) {
			if (err) return;

			$('[data-sid="' + data.sid + '"]').each(function(){
				var $widget = $(this);

				switch ($widget.attr('data-widget')) {
					case 'mi-status':
					case 'mi-players-grid':

						// Add player now on the server, but not if they are already listed.
						var found = false;
						$widget.find('.mi-avatar').each(function(){
							if ($(this).data('id') === data.player.id) found = true;
						});

						if (!found) {
							MinecraftIntegration.API.get("avatar/" + data.player.name + "/base64", function (err, avatar) {
								if (err) console.log(err);

								if (avatar) {
									var $avatar = $($.parseHTML(avatarTemplate.replace("{url}", "data:image/png;base64," + avatar).replace("{players.name}", data.player.name)));
									$avatar.css("display", "none");
									$avatar.data('id', data.player.id);
									$widget.find('.mi-avatars').append($avatar);
									MinecraftIntegration.setAvatarBorders($widget);
									$avatar.fadeToggle(600, 'linear');
								}
							});
							$widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) + 1);
						}

						MinecraftIntegration.removeTooltips($widget);
					break;
				}
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

						if ($avatar.data('id') !== data.player.id) return;

						$avatar.fadeToggle(600, 'linear', function () {
							$avatar.remove();
							MinecraftIntegration.setAvatarBorders($widget);
						});
					});

					$widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) - 1);

					MinecraftIntegration.removeTooltips($widget);
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

	MinecraftIntegration.setGraphs = function (status) {
		// TODO: Need to clean this up.

		require(['/vendor/chart.js/chart.min.js'], function (Chart) {

			$('[data-widget="mi-players-graph"][data-sid="' + status.sid + '"]').each(function (i, $widget) {
				$widget = $($widget).find('.mi-canvas');

				MinecraftIntegration.API.get("server/" + status.sid + "/pings/30", function (err, pings) {
					if (typeof pings !== 'object') return;

					var scaleMax = 10, date, hours, minutes, meridiem, chart;

					var options = {
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
						backgroundColor: "#ffffff"
					};

					var data = {
						labels: [ ],
						datasets: [
							{
								label: "",
								fillColor: "rgba(151,187,205,1)",
								strokeColor: "rgba(151,187,205,1)",
								pointColor: "rgba(151,187,205,1)",
								pointStrokeColor: "#fff",
								pointHighlightFill: "#fff",
								pointHighlightStroke: "rgba(151,187,205,1)",
								data: [ ]
							}
						]
					};

					for (var stamp in pings) {
						date = new Date(parseInt(stamp,10));
						hours = date.getHours() < 13 ? (date.getHours() === 0 ? 12 : date.getHours()) : date.getHours() - 12;
						minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
						meridiem = date.getHours() < 12 ? "AM" : "PM";
						data.labels.unshift(hours + ":" + minutes + " " + meridiem);
						data.datasets[0].data.unshift(pings[stamp].players.length);
						if (pings[stamp].players.length > scaleMax) scaleMax = pings[stamp].players.length;
					}

					options.scaleSteps = scaleMax + 1;

					switch ('line') {
						case "Pie":
						case "pie":
							chart = new Chart($widget[0].getContext('2d')).Pie(data, options);
							break;
						case "Donut":
						case "donut":
							chart = new Chart($widget[0].getContext('2d')).Pie(data, options);
							break;
						case "Line":
						case "line":
						default:
							chart = new Chart($widget[0].getContext('2d')).Line(data, options);
							break;
					}

					$widget.data('chart', chart);
				});
			});

			$('[data-widget="mi-tps-graph"][data-sid="' + status.sid + '"]').each(function (i, $widget) {
				$widget = $($widget).find('.mi-canvas');

				MinecraftIntegration.API.get("server/" + status.sid + "/pings/30", function (err, pings) {
					if (typeof pings !== 'object') return;

					var date, hours, minutes, meridiem, chart;

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
						backgroundColor: "#ffffff"
					};

					var data = {
						labels: [ ],
						datasets: [
							{
								label: "",
								fillColor: "rgba(151,187,205,1)",
								strokeColor: "rgba(151,187,205,1)",
								pointColor: "rgba(151,187,205,1)",
								pointStrokeColor: "#fff",
								pointHighlightFill: "#fff",
								pointHighlightStroke: "rgba(151,187,205,1)",
								data: [ ]
							}
						]
					};

					for (var stamp in pings) {
						date = new Date(parseInt(stamp,10));
						hours = date.getHours() < 13 ? (date.getHours() === 0 ? 12 : date.getHours()) : date.getHours() - 12;
						minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
						meridiem = date.getHours() < 12 ? "AM" : "PM";
						data.labels.unshift(hours + ":" + minutes + " " + meridiem);
						data.datasets[0].data.unshift(pings[stamp].tps);
					}

					options.scaleSteps = 6;

					switch ('line') {
						case "Pie":
						case "pie":
							chart = new Chart($widget[0].getContext('2d')).Pie(data, options);
							break;
						case "Donut":
						case "donut":
							chart = new Chart($widget[0].getContext('2d')).Pie(data, options);
							break;
						case "Line":
						case "line":
						default:
							chart = new Chart($widget[0].getContext('2d')).Line(data, options);
							break;
					}

					$widget.data('chart', chart);
				});
			});

			$('[data-widget="mi-top-graph"][data-sid="' + status.sid + '"]').each(function (i, $widget) {
				$widget = $($widget).find('.mi-canvas');

				socket.emit('plugins.MinecraftIntegration.getTopPlayersByPlaytimes', {show: 10}, function (err, players) {
					if (typeof players !== 'object') return;

					var time;

					var options = {
						responsive: true,
						tooltipTemplate: "<%if (label){%><%=label%><%}%>: <%= value %>"
					};

					var data = [ ];

					for (var i in players) {
						// TODO: Increment time.

						data.unshift({
							value: parseInt(players[i].playtime, 10),
							color: "#5B94DE",
							highlight: "#AADDFF",
							label: players[i].playername || players[i].name
						});
					}

					switch ('pie') {
						case "Pie":
						case "pie":
							chart = new Chart($widget[0].getContext('2d')).Pie(data, options);
							break;
						case "Donut":
						case "donut":
							chart = new Chart($widget[0].getContext('2d')).Pie(data, options);
							break;
						case "Line":
						case "line":
						default:
							chart = new Chart($widget[0].getContext('2d')).Line(data, options);
							break;
					}

					$widget.data('chart', chart);
				});
			});

		});
	};

	$(window).on('action:widgets.loaded', function (event) {
		var sids = [ ];

		resizeCanvases();

		require(['/vendor/chart.js/chart.min.js'], function (Chart) {
			$('.mi-container').each(function (i, el) {
				var $this = $(el),
					$parent = $this.parent(),
					sid = $this.attr('data-sid');

				if (!$parent.is('[widget-area]')) {
					$parent.css('padding-top', '0').css('padding-left', '0').css('padding-right', '0').css('padding-bottom', '0');
				}

				if (sids.indexOf(sid) < 0) {
					sids.push(sid);
				}
			});

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

	////////////////
	// Widget ACP //
	////////////////

	var miIDcounter = 1;

	$(window).on('action:ajaxify.end', function (event, url) {
		url = url.url.split('?')[0].split('#')[0];

		switch (url) {
			case 'admin/extend/widgets':
				setTimeout(function(){ $(window).trigger('action:widgets.adminDataLoaded'); }, 2500);
				break;
		}
	});

	$(window).on('action:widgets.adminDataLoaded', function (event, data) {
		function formatTitle($panel) {
			var $title = $panel.find('>.panel-heading strong'),
				title = $panel.find('>.panel-body [name="title"]').val();

			if (!title) {
				$title.html($title.text().split(' - ')[0]);
				return;
			}

			if ($panel.data('motd') === void 0) {
				$.get('/api/minecraft-integration/server/' + $panel.find('[name="sid"]').val() + "?v=" + config['cache-buster'], function (server) {
					if (server && server.motd && server.name) {
						$panel.data('motd', server.motd);
						$panel.data('name', server.name);
					}else{
						$panel.data('motd', '');
						$panel.data('name', '');
					}
					formatTitle($panel);
				});
			}

			title = title.replace(/\{\{motd\}\}/g, $panel.data('motd') || $panel.find('[name="sid"]').val());
			title = title.replace(/\{\{name\}\}/g, $panel.data('name'));
			title = title.replace(/[§&][0123456789abcdefklmnorABCDEFKLMNOR]/g, '');

			$title.html($title.text().split(' - ')[0] + ' - ' + title);
		}

		function initPanel($panel) {
			var $heading = $panel.find('>.panel-heading'),
				$body = $heading.next();

			if ($body.hasClass('mcwe-ajaxed')) {
				return;
			}else{
				$body.addClass('mcwe-ajaxed');
			}

			if ($body.find('[name="sid"]').val()) {
				$.get('/api/minecraft-integration/server/' + $body.find('[name="sid"]').val() + "?v=" + config['cache-buster'], function (server) {
					if (server && server.motd && server.name) {
						$panel.data('motd', server.motd);
						$panel.data('name', server.name);
					}else{
						$panel.data('motd', '');
						$panel.data('name', '');
					}
					formatTitle($panel);
				});
			}

			$body.find('[name="title"]').on('input', function (e) {
				formatTitle($panel);
			});

			$body.find('input.ajaxSelectSibling').each(function(index){
				var MCWESN = $(this);
				if (MCWESN.val()) {
					MCWESN.prev().val($(this).val());
				}else{
					var first = MCWESN.prev().find('option:first'),
						selected = MCWESN.prev().find('option:selected');
					if (selected) {
						MCWESN.val( selected.val() );
					}else{
						if (first) {
							MCWESN.val( first.val() );
							MCWESN.prev().val( first.val() );
						}
					}
				}
				MCWESN.prev().on('change', function(){
					MCWESN.val($(this).val());
					$.get('/api/minecraft-integration/server/' + $body.find('[name="sid"]').val() + "?v=" + config['cache-buster'], function (server) {
						if (server && server.motd && server.name) {
							$panel.data('motd', server.motd);
							$panel.data('name', server.name);
						}else{
							$panel.data('motd', '');
							$panel.data('name', '');
						}
						formatTitle($panel);
					});
				});
			});

			$body.find('input.ajaxInputColorPicker').each(function(index){
				if ($(this).val() === '') $(this).val('000000');
				var MCWECP = $(this);
				var id = 'ajaxInputColorPicker' + miIDcounter;
				MCWECP.attr('id',id);
				$('#'+id).ColorPicker({
					color: MCWECP.val() || '#000000',
					onChange: function(hsb, hex) {
						MCWECP.val(hex);
						MCWECP.css('color', '#' + hex);

						if(MCWECP.is('[preview]')) {
							MCWECP.parents('.panel-body').find('.mcWidgetPreview').find(MCWECP.attr('preview')).each(function(){$(this).css('color', '#' + MCWECP.val())});
						}
					},
					onShow: function(colpkr) {
						$(colpkr).css('z-index', 1051);
					}
				}).css('color', '#' + $(this).val()).bind('keyup', function(){
					$(this).ColorPickerSetColor($(this).val());
					$(this).css('color', '#' + $(this).val());
				});
				if(MCWECP.is('[preview]')) {
					MCWECP.parents('.panel-body').find('.mcWidgetPreview').find(MCWECP.attr('preview')).each(function(){$(this).css('color', '#' + MCWECP.val())});
				}
				miIDcounter++;
			});
		}

		$('.widget-area').on('mouseup', '> .panel > .panel-heading', function (e) {
			var $heading = $(this),
				$panel = $heading.parent(),
				$body = $heading.next(),
				widget = $panel.data('widget');

			if ($heading.parent().is('.ui-sortable-helper') || $(e.target).closest('.delete-widget').length) return;

			switch (widget) {
				case 'mi-chat':
				case 'mi-directory':
				case 'mi-gallery':
				case 'mi-map':
				case 'mi-ping-graph':
				case 'mi-players-graph':
				case 'mi-players-grid':
				case 'mi-status':
				case 'mi-top-graph':
				case 'mi-top-list':
				case 'mi-tps-graph':
					initPanel($panel);
					break;
			}
		});

		$('.widget-area >[data-widget]').each(function (i, el) {
			switch ($(el).data('widget')) {
				case 'mi-chat':
				case 'mi-directory':
				case 'mi-gallery':
				case 'mi-map':
				case 'mi-ping-graph':
				case 'mi-players-graph':
				case 'mi-players-grid':
				case 'mi-status':
				case 'mi-top-graph':
				case 'mi-top-list':
				case 'mi-tps-graph':
					initPanel($(el));
					break;
			}
		});
	});

}());
