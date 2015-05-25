"use strict";

__MIDIR = "/plugins/nodebb-plugin-minecraft-integration/public/";

MinecraftIntegration = { };

socket.on('mi.ping', function (data) {
	console.log("PING: ", data);

	// Update Players
	console.log('Getting avatar template');
	$.get(__MIDIR + '/templates/partials/playerAvatars.tpl' + "?v=" + config['cache-buster'], function(avatarTemplate) {
		console.log('Got avatar template');
		$('[data-widget="mi-status"][data-sid="' + data.sid + '"]').each(function(i, $widget){
			console.log('Found Widget');
			$widget = $($widget);
			if (data.players) {
				try {
					data.players = JSON.parse(data.players);
					var _players = [ ];
					for (var i in data.players) {
						if (data.players[i] && typeof data.players[i] === 'object' && data.players[i].name) {
							_players.push(data.players[i].name);
						}
					}
					data.players = _players;
				}catch (e){
					data.players = [ ];
				}

				console.log('Found Players');
				$widget.find('.mi-avatar').each(function (i, el) {
					console.log('Found Player: ' + $(el).data('original-title'));
					if (data.players.indexOf($(el).data('original-title')) < 0) {
						$(el).fadeToggle(600, 'linear', function () {
							$(el).remove();
							$('.tooltip').each(function (i, el) {
								$(this).remove();
							});
						});
					}
				});

				for (var i in data.players) {
					if (!$widget.find('.mi-avatar[data-original-title="' + data.players[i] + '"]').length) {
						// Temp
						var $avatar = $($.parseHTML('<img src="http://cravatar.eu/avatar/{player}/32" class="mi-avatar user-img" style="margin-bottom:5px;margin-right:5px;display:none;border-style:double;border-width:6px;border-radius:4px;border-color:black;" data-original-title="{player}"/>'.replace(/\{player\}/g, data.players[i])));
						$avatar.appendTo($widget.find('.avatars'));
						$avatar.fadeToggle(600, 'linear');
					}
				}
			}
		});
	});
});

define('admin/plugins/minecraft-integration', function () {
	MinecraftIntegration.init = function () {
		require([__MIDIR + 'js/acp.js'], function (miACP) {
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
	require(['/vendor/chart.js/chart.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/async/1.0.0/async.min.js'], function (Chart, async) {
		async.each($('.mi-container'), function (el, next) {
			var $this = $(el),
				$parent = $this.parent(),
				sid = $this.data('sid');

			if (!$parent.prop('widget-area')) {
				$parent.css('padding-top', '0').css('padding-left', '0').css('padding-right', '0').css('padding-bottom', '0');
			}

			if (!$this.find('.mi-canvas').length) return next();

			$this.find('.mi-canvas').first().each(function () {
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
						tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %> Players Online"
					};

					var data = {
						labels: [ ],
						datasets: [
							{
								label: "",
								fillColor: "rgba(151,187,205,0.2)",
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
						data.labels.push(stamp);
						data.datasets[0].data.push(JSON.parse(pings[stamp].players).length);
					}

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

					console.log("done one");
					next();
				});
			});
		}, function (err) {
			console.log("resizing");
			resizeCanvases();
		});
	});

	$('.mcwe-widget-status, .mcwe-widget-minimap').each(function(){
		var $widget = $(this);

		$widget.find('h3').css('max-width', '90%');
		$widget.find('>.panel').prepend('<i style="position:relative;right:6px;top:6px;font-size:22px;" class="fa fa-compass pointer pull-right has-tooltip mcwe-modalmapicon" data-title="Open Map" data-toggle="modal" data-target="#mcwe-modal-'+ $widget.data('mcwe-mid') +'" style="font-size: 20px;"></i>');
	});
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
			case 'miStatus':
			case 'miPlayersGraph':
				initPanel($panel);
				break;
		}
	});

	$('.widget-area >[data-widget]').each(function (i, el) {
		switch ($(el).data('widget')) {
			case 'miStatus':
			case 'miPlayersGraph':
				initPanel($(el));
				break;
		}
	});
});
