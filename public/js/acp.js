"use strict";

define(['settings'], function (settings) {
	console.log('define acp.js');

	var miACP = { },
		$form, $serverList, $modal, $modalBody, $serverTemplate, $modalTemplate;

	miACP.load = function () {
		console.log('miACP.load() called');

		$form = $('#minecraft-integration');
		$serverList = $('#serverList');
		$modal = $form.find('#mia-modal-servers');
		$modalBody = $modal.find('.modal-body');

		function makeServerList() {
			for (var i in settings.cfg._.servers) {
				if (settings.cfg._.servers[i]) {
					addServerToModal({serverNum: i, name: settings.cfg._.servers[i].name});
					if (settings.cfg._.servers[i].active !== false) {
						addNewServer(i, settings.cfg._.servers[i]);
					}
				}
			}
		}

		function populateFields() {
			$('#avatarCDN').val(settings.cfg._.avatarCDN);
			$('#avatarSize').val(settings.cfg._.avatarSize);
			$('#avatarStyle').val(settings.cfg._.avatarStyle);
			makeServerList();
		}

		function validateAll() {
			
		}

		function toggleServer(serverNum) {
			var $server = $serverList.children().filter(function () {
				return $(this).data('serverNum') === serverNum;
			});
			if ($server.length) {
				$server.remove();
			}else{
				addNewServer(serverNum, settings.cfg._.servers[serverNum]);
			}
		}

		function populateServer($server, server) {
			$server.find('.mia-server-name').val(server.name);
			$server.find('.mia-server-address').val(server.address);
			$server.find('.mia-server-query-port').val(server.queryPort);
			$server.find('.mia-server-rcon-port').val(server.rconPort);
			$server.find('.mia-server-rcon-pass').val(server.rconPass);
			$server.find('.mia-server-xapi').val(server.xAPI);
			$server.find('a').text(server.name);
		}

		function addNewServer(serverNum, server) {
			var $server = $serverTemplate.clone();
			$server.data('server-num', serverNum);
			$server.find('.mia-server-label').text('Unnamed Server');
			$server.find('[data-parent="#serverList"]').attr('href', '#server' + serverNum);
			$server.find('.panel-body').attr('id', 'server' + serverNum);
			$server.appendTo($serverList);
			if (server) {
				populateServer($server, server);
			}
			return;
		}

		function addServerToModal(server) {
			var $serverListing = $modalTemplate.clone();
			$serverListing.data('server-num', server.serverNum);
			$serverListing.find('span').text(server.name);
			$serverListing.appendTo($modalBody);
		}

		function makeButtons() {
			console.log('MI: adding buttons');

			$form.on('click', 'a, button', function (e) {
				e.preventDefault();
			}).on('click', '.fa-times', function (e) {
				$(e.target).closest('.panel').remove();
			}).on('click', '#mia-save', function (e) {
				settings.cfg._.avatarCDN = $('#avatarCDN').val();
				settings.cfg._.avatarSize = $('#avatarSize').val();
				settings.cfg._.avatarStyle = $('#avatarStyle').val();
				for (var server in settings.cfg._.servers) {
					if (settings.cfg._.servers[server]) {
						settings.cfg._.servers[server].active = false;
					}
				}
				$serverList.children().each(function(i, el){
					var $el = $(el), serverNum = $el.data('server-num');
					if ($el.find('.mia-server-name').val()) {
						settings.cfg._.servers[serverNum] = { };
						settings.cfg._.servers[serverNum].name		= $el.find('.mia-server-name').val();
						settings.cfg._.servers[serverNum].address	= $el.find('.mia-server-address').val();
						settings.cfg._.servers[serverNum].queryPort	= $el.find('.mia-server-query-port').val();
						settings.cfg._.servers[serverNum].rconPort	= $el.find('.mia-server-rcon-port').val();
						settings.cfg._.servers[serverNum].rconPass	= $el.find('.mia-server-rcon-pass').val();
						settings.cfg._.servers[serverNum].xAPI		= $el.find('.mia-server-xapi').val();
						settings.cfg._.servers[serverNum].active	= true;
					}else{
						$el.remove();
					}
				});
				settings.helper.persistSettings('minecraft-integration', settings.cfg, true, function(){
					socket.emit('admin.settings.syncMinecraftIntegration');
					$serverList.empty();
					$modalBody.empty();
					populateFields();
				});
			}).on('click', '#mia-delete', function (e) {
				bootbox.confirm('Are you sure?<p class="text-danger strong">This will delete all data from all Minecraft servers.</p>', function(result) {
					if (result) {
						socket.emit('admin.settings.resetMinecraftIntegration');
					}
				});
			}).on('click', '#mia-reset', function (e) {
				$serverList.empty();
				$modalBody.empty();
				populateFields();
			}).on('click', '#mia-add-server', function (e) {
				console.log('MI: adding server...');
				var nextServerNum = settings.cfg._.servers.length;
				$serverList.children().each(function (i,el) {
					var num = $(el).data('server-num');
					if (num >= nextServerNum) nextServerNum = num + 1;
				});
				addNewServer(nextServerNum);
			}).on('click', '#mia-view-servers', function (e) {
				//$modalBody.empty();
				$modal.modal('show');
			}).on('click', '.mia-toggle-activation', function (e) {
				console.log('MI: toggle server activation');
				toggleServer($(e.target).closest('div').data('server-num'));
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
				var $this = $(this), $server = $this.closest('.panel'), serverNum = $server.data('server-num');
				$server.find('a').text($this.val() || 'Unnamed Server');
				var $serverListing = $modalBody.children().filter(function () {
					return $(this).data('serverNum') === serverNum;
				});
				if ($serverListing.length) {
					$serverListing.find('span').text($this.val() || 'Unnamed Server');
				}
			}).submit(validateAll);
		}

		socket.emit('admin.settings.get', { hash: 'minecraft-integration' }, function (err, values) {
			if (err) {
				console.log('Error getting values:', err);
			} else {
				console.log('MI: settings recieved');
				$.get(__MIDIR + '/templates/admin/plugins/server.tpl', function(data) {
					$serverTemplate = $($.parseHTML(data));
					$modalTemplate = $($.parseHTML('<div><span></span> <a class="mia-toggle-activation pointer">Activate/Deactivate</a> <a class="mia-purge pointer">Purge</a></div>'));
					console.log('MI: server template got');
					settings.helper.whenReady(function () {						
						settings.helper.use(values);
						settings.cfg._.servers = settings.cfg._.servers || [ ];
						makeButtons();
						populateFields();
						setupInputs();

						console.log('MI: template rendered');
					});
				});
			}
		});
	};

	return miACP;
});
