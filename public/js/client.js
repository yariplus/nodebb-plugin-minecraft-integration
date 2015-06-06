"use strict";

MinecraftIntegration = { templates: { } };

MinecraftIntegration.__MIDIR = "/plugins/nodebb-plugin-minecraft-integration/public/";

MinecraftIntegration.getTemplate = function (template, callback) {
	MinecraftIntegration.getTemplates([template], function (err, templates) {
		callback(null, templates[0]);
	});
};

MinecraftIntegration.getTemplates = function (templates, callback) {
	require([MinecraftIntegration.__MIDIR + 'js/vendor/async.min.js'], function (async) {
		async.map(templates, function (template, next) {
			if (MinecraftIntegration.templates[template]) {
				next(null, MinecraftIntegration.templates[template]);
			}else{
				$.get(MinecraftIntegration.__MIDIR + "templates/" + template + "?v=" + config['cache-buster'], function(data) {
					MinecraftIntegration.templates[template] = data;
					next(null, data);
				});
			}
		}, function (err, payload) {
			callback(null, payload);
		});
	});
};

MinecraftIntegration.API = { _: { } };

MinecraftIntegration.API.get = function (url, callback) {
	if (MinecraftIntegration.API._[url]) {
		callback(null, MinecraftIntegration.API._[url]);
	}else{
		$.get("/api/minecraft-integration/" + url + "?v=" + config['cache-buster'], function (data) {
			MinecraftIntegration.API._[url] = data;
			callback(null, data);
		});
	}
};

MinecraftIntegration.setPlayers = function (data) {
	if (!(data && data.sid !== void 0 && Array.isArray(data.players))) return;

	require([MinecraftIntegration.__MIDIR + 'js/vendor/async.min.js'], function (async) {
		async.parallel({
			avatarUrl: async.apply(MinecraftIntegration.API.get, "avatar"),
			avatarSize: async.apply(MinecraftIntegration.API.get, "avatar/size"),
			avatarTemplate: async.apply(MinecraftIntegration.getTemplate, "partials/playerAvatars.tpl")
		}, function (err, results) {
			results.avatarTemplate = results.avatarTemplate.replace("{url}", results.avatarUrl.replace("{size}", results.avatarSize));

			async.each($('[data-widget="mi-status"][data-sid="' + data.sid + '"], [data-widget="mi-players-grid"][data-sid="' + data.sid + '"]'), function ($widget, next) {
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

				// Add players now on the server.
				for (var i in data.players) {
					var found = false;

					$widget.find('.mi-avatar').each(function (i, el) {
						var $avatar = $(el);

						if ($avatar.data('id') === data.players[i].id) found = true;
					});

					if (!found) {
						var $avatar = $($.parseHTML(results.avatarTemplate.replace("{name}", data.players[i].name).replace("{styleGlory}", "double").replace("{players.glory}", "pink").replace("{players.name}", data.players[i].name)));
						$avatar.css("display", "none");
						$avatar.data('id', data.players[i].id);
						$avatar.appendTo($widget.find('.avatars'));
						$avatar.fadeToggle(600, 'linear');
						console.log("Adding from set");
					}
				}

				$widget.find(".online-players").text(data.players.length);

				next();
			}, function (err) {
				$('.tooltip').each(function (i, el) {
					$(this).remove();
				});
			});
		});
	});
};

MinecraftIntegration.addPlayer = function (data) {
	require([MinecraftIntegration.__MIDIR + 'js/vendor/async.min.js'], function (async) {
		async.parallel({
			avatarUrl: async.apply(MinecraftIntegration.API.get, "avatar"),
			avatarSize: async.apply(MinecraftIntegration.API.get, "avatar/size"),
			avatarTemplate: async.apply(MinecraftIntegration.getTemplate, "partials/playerAvatars.tpl")
		}, function (err, results) {
			results.avatarTemplate = results.avatarTemplate.replace("{url}", results.avatarUrl.replace("{size}", results.avatarSize));

			async.each($('[data-widget="mi-status"][data-sid="' + data.sid + '"], [data-widget="mi-players-grid"][data-sid="' + data.sid + '"]'), function ($widget, next) {
				$widget = $($widget);

				console.log("Found Widget");

				// Add player now on the server.
				var found = false;

				$widget.find('.mi-avatar').each(function (i, el) {
					var $avatar = $(el);

					if ($avatar.data('id') === data.player.id) {
						console.log("Found Player");
						found = true;
					}
				});

				if (!found) {
					console.log("Adding Player");
					var $avatar = $($.parseHTML(results.avatarTemplate.replace("{name}", data.player.name).replace("{styleGlory}", "double").replace("{players.glory}", "pink").replace("{players.name}", data.player.name)));
					$avatar.css("display", "none");
					$avatar.data('id', data.player.id);
					$avatar.appendTo($widget.find('.avatars'));
					$avatar.fadeToggle(600, 'linear');
					console.log("Adding from ping");
				}

				$widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) + 1);

				next();
			}, function (err) {
				$('.tooltip').each(function (i, el) {
					$(this).remove();
				});
			});
		});
	});
};

MinecraftIntegration.removePlayer = function (data) {
	require([MinecraftIntegration.__MIDIR + 'js/vendor/async.min.js'], function (async) {
		async.parallel({
			avatarUrl: async.apply(MinecraftIntegration.API.get, "avatar"),
			avatarSize: async.apply(MinecraftIntegration.API.get, "avatar/size"),
			avatarTemplate: async.apply(MinecraftIntegration.getTemplate, "partials/playerAvatars.tpl")
		}, function (err, results) {
			results.avatarTemplate = results.avatarTemplate.replace("{url}", results.avatarUrl.replace("{size}", results.avatarSize));

			async.each($('[data-widget="mi-status"][data-sid="' + data.sid + '"], [data-widget="mi-players-grid"][data-sid="' + data.sid + '"]'), function ($widget, next) {
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

				$widget.find(".online-players").text(parseInt($widget.find(".online-players").text(), 10) - 1);

				next();
			}, function (err) {
				$('.tooltip').each(function (i, el) {
					$(this).remove();
				});
			});
		});
	});
};

socket.on('mi.PlayerJoin', function (data) {
	console.log("[Minecraft Integration] I saw " + data.player.name + " " + data.player.id + " joined the server.");

	MinecraftIntegration.addPlayer(data);
});

socket.on('mi.PlayerQuit', function (data) {
	console.log("[Minecraft Integration] I saw " + data.player.name + " " + data.player.id + " quit the server.");

	MinecraftIntegration.removePlayer(data);
});

socket.on('mi.status', function (data) {
	console.log("[Minecraft Integration] Received status update: ", data);

	MinecraftIntegration.setPlayers(data);
});

socket.on('mi.ping', function (ping) {
	console.log("[Minecraft Integration] Received server ping: ", ping);
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
		container: 'body'
	});
	$body.popover({
		selector: '.has-popover',
		container: 'body'
	});
});

var rtime = new Date(1, 1, 2000, 12,00,00);
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
			heightRatio = $this.attr('height-ratio');

		heightRatio = typeof heightRatio == 'undefined' ? 2 : parseInt(heightRatio);
		heightRatio = isNaN(heightRatio) ? 2 : heightRatio < 1 ? 2 : heightRatio;
		$this.attr('width', $this.parent().width());
		$this.attr('height', $this.parent().width() / heightRatio);
		$this.css('width', $this.parent().width());
		$this.css('height', $this.parent().width() / heightRatio);
	});
}

$(window).on('action:widgets.loaded', function (event) {
	var sids = [ ];

	require(['/vendor/chart.js/chart.min.js', MinecraftIntegration.__MIDIR + 'js/vendor/async.min.js'], function (Chart, async) {
		async.each($('.mi-container'), function (el, next) {
			var $this = $(el),
				$parent = $this.parent(),
				sid = $this.data('sid');

			if (sids.indexOf(sid) < 0) {
				sids.push(sid);
			}

			if (!$parent.is('[widget-area]')) {
				$parent.css('padding-top', '0').css('padding-left', '0').css('padding-right', '0').css('padding-bottom', '0');
			}

			if (!$this.find('.mi-canvas').length) return next();

			$this.find('.mi-canvas').each(function () {
				var $this = $(this);

				$.get('/api/minecraft-integration/server/' + sid + '/pings/30', function (pings) {
					if (typeof pings !== 'object') return next();

					var options = {
						showScale: false,
						scaleShowGridLines : true,
						scaleGridLineColor : "rgba(0,0,0,.05)",
						scaleGridLineWidth : 1,
						scaleShowHorizontalLines: true,
						scaleShowVerticalLines: true,
						scaleOverride : true,
						scaleSteps : 3,
						scaleStepWidth : 1,
						scaleStartValue : -1,
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
						var date = new Date(parseInt(stamp,10));
						data.labels.unshift(date.getHours() + ":" + date.getMinutes());
						data.datasets[0].data.unshift(pings[stamp].players.length);
					}

					console.log("saw ", data.labels, " and ", data.datasets[0].data);
					switch ('line') {
						case "Pie":
						case "pie":
							new Chart($this[0].getContext('2d')).Pie(data, options);
							break;
						case "Donut":
						case "donut":
							new Chart($this[0].getContext('2d')).Pie(data, options);
							break;
						case "Line":
						case "line":
						default:
							new Chart($this[0].getContext('2d')).Line(data, options);
							break;
					}
					next();
				});
			});
		}, function (err) {
			console.log("[Minecraft Integration] Resizing widgets.");
			resizeCanvases();
		});
	});

	$('.mcwe-widget-status, .mcwe-widget-minimap').each(function(){
		var $widget = $(this);

		$widget.find('h3').css('max-width', '90%');
		$widget.find('>.panel').prepend('<i style="position:relative;right:6px;top:6px;font-size:22px;" class="fa fa-compass pointer pull-right has-tooltip mcwe-modalmapicon" data-title="Open Map" data-toggle="modal" data-target="#mcwe-modal-'+ $widget.data('mcwe-mid') +'" style="font-size: 20px;"></i>');
	});

	for (var i = 0; i < sids.length; i++) {
		var sid = sids[i];

		MinecraftIntegration.API.get('server/' + sid, function (err, status) {
			status.sid = sid;
			MinecraftIntegration.setPlayers(status);
		});
	}
});

var miIDcounter = 1;

$(window).on('action:ajaxify.end', function (event, url) {
	url = url.url.split('?')[0].split('#')[0];

	console.log('ajaxify.end: ' + url);

	switch (url) {
		case 'admin/extend/widgets':
			setTimeout(function(){ $(window).trigger('action:widgets.adminDataLoaded'); }, 5000);
			break;
	}
});

$(window).on('action:ajaxify.contentLoaded', function (event, data) {
	console.log("contentLoaded: " + JSON.stringify(data));
});

$(window).on('action:ajaxify.dataLoaded', function (event, data) {
	console.log("dataLoaded: " + JSON.stringify(data));
});

$(window).on('action:widgets.adminDataLoaded', function (event, data) {
	function formatTitle($panel) {
		var $title = $panel.find('>.panel-heading strong'),
			title = $panel.find('>.panel-body [name="title"]').val();

		if (!title) {
			$title.html($title.text().split(' - ')[0]);
			return;
		}

		title = title.replace(/\{\{motd\}\}/g, $panel.data('motd'));
		title = title.replace(/\{\{name\}\}/g, $panel.data('name'));
		title = title.replace(/[\u0247&][0123456789abcdefklmnor]/g, '');

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
