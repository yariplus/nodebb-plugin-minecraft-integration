"use strict";

define(['settings'], function (settings) {
	console.log('define acp.js');

	var miACP = { },
		$form = $('#minecraft-integration'),
		$serverTemplate;

	miACP.load = function () {
		console.log('miACP.load() called');

		function makeServerList() {
			for (var i in settings.cfg._.servers) {
				if (settings.cfg._.servers[i]) {
					var $server = addServer({serverNum: i});
					$server.find('.mia-server-name').val(settings.cfg._.servers[i].name);
					$server.find('.mia-server-address').val(settings.cfg._.servers[i].address);
					$server.find('.mia-server-query-port').val(settings.cfg._.servers[i].queryPort);
					$server.find('.mia-server-rcon-port').val(settings.cfg._.servers[i].rconPort);
					$server.find('.mia-server-rcon-pass').val(settings.cfg._.servers[i].rconPass);
					$server.find('.mia-server-xapi').val(settings.cfg._.servers[i].xAPI);
					$server.find('a').text(settings.cfg._.servers[i].name);
				}
			}
		}

		function validateAll() {
			
		}

		function addServer(data) {
			var $server = $serverTemplate.clone();
			$server.data('server-num', data.serverNum);
			$server.find('.mia-server-label').text('Unnamed Server');
			$server.find('[data-parent="#serverList"]').attr('href', '#server' + data.serverNum);
			$server.find('.panel-body').attr('id', 'server' + data.serverNum);
			$server.appendTo($('#serverList'));
			return $server;
		}

		function makeButtons() {
			console.log('MI: adding buttons');
			$('#mia-add-server').click(function(e){
				console.log('MI: adding server...');
				e.preventDefault();
				var nextServerNum = settings.cfg._.servers.length;
				$('#serverList').children().each(function(i,el){
					console.log('compare ' + nextServerNum + ' to ' + $(el).data('server-num'))
					var num = $(el).data('server-num');
					if (num >= nextServerNum) nextServerNum = num + 1;
				});
				addServer({serverNum: nextServerNum});
			});

			$('#save').click(function (event) {
				event.preventDefault();

				settings.cfg._.avatarCDN = $('#avatarCDN').val();
				settings.cfg._.avatarSize = $('#avatarSize').val();
				settings.cfg._.avatarStyle = $('#avatarStyle').val();
				$('#serverList').children().each(function(i, el){
					var $el = $(el), serverNum = $el.data('server-num');
					if ($el.find('.mia-server-name').val()) {
						settings.cfg._.servers[serverNum] = { };
						settings.cfg._.servers[serverNum].name		= $el.find('.mia-server-name').val();
						settings.cfg._.servers[serverNum].address	= $el.find('.mia-server-address').val();
						settings.cfg._.servers[serverNum].queryPort	= $el.find('.mia-server-query-port').val();
						settings.cfg._.servers[serverNum].rconPort	= $el.find('.mia-server-rcon-port').val();
						settings.cfg._.servers[serverNum].rconPass	= $el.find('.mia-server-rcon-pass').val();
						settings.cfg._.servers[serverNum].xAPI		= $el.find('.mia-server-xapi').val();
					}
				});
				settings.helper.persistSettings('minecraft-integration', settings.cfg, true, function(){
					socket.emit('admin.settings.syncMinecraftIntegration');
				});
			});

			$('#form-btn-delete-all').click( function (event) {
				event.preventDefault();
				bootbox.confirm('Are you sure?<br><span class="text-danger strong">This will delete all data from all Minecraft servers.</span>', function(result) {
					if (result) {
						socket.emit('admin.settings.resetMinecraftIntegration');
					}
				});
			});
		}

		function setupInputs() {
			$form.on('focus', '.form-control', function() {
				var parent = $(this).parents('.input-row');

				$('.input-row.active').removeClass('active');
				parent.addClass('active').removeClass('error');

				var help = parent.find('.help-text');
				help.html(help.attr('data-help'));
			}).on('blur change', '[name]', function() {
				//activate($(this).attr('name'), $(this));
			}).on('input', '.mia-server-name', function() {
				var $this = $(this), $server = $this.closest('.panel');
				$server.find('a').text($this.val() || 'Unnamed Server');
			}).submit(validateAll);
		}
		
		socket.emit('admin.settings.get', { hash: 'minecraft-integration' }, function (err, values) {
			if (err) {
				console.log('Error getting values:', err);
				settings.cfg._ = { };
			} else {
				console.log('MI: settings recieved');
				$.get( "/plugins/nodebb-widget-minecraft-essentials/public/templates/admin/plugins/server.tpl", function(data) {
					$serverTemplate = $($.parseHTML(data));
					console.log('MI: template got');
					settings.helper.whenReady(function () {						
						settings.helper.use(values);
						settings.cfg._.servers = settings.cfg._.servers || [ ];
						$('#avatarCDN').val(settings.cfg._.avatarCDN);
						$('#avatarSize').val(settings.cfg._.avatarSize);
						$('#avatarStyle').val(settings.cfg._.avatarStyle);

						makeButtons();
						makeServerList();
						setupInputs();

						console.log('MI: template rendered');
					});
				});
			}
		});
	};

	return miACP;
});
