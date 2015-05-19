"use strict";

define(['settings', 'translator', __MIDIR + "js/vendor/validator.min.js"], function (settings, translator, validator) {
	var miACP = { },
		$form, $serverList, $modal, $modalBody, $serverTemplate, $modalTemplate;

	miACP.load = function () {
		console.log('miACP.load() called');

		$form = $('#minecraft-integration');
		$serverList = $('#server-list');
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
			$('[name=avatarCDN]').val(settings.cfg._.avatarCDN);
			$('[name=avatarSize]').val(settings.cfg._.avatarSize);
			$('[name=avatarStyle]').val(settings.cfg._.avatarStyle);
			makeServerList();
		}

		function validateAll(e) {
			activate($('[name=avatarCDN]'));
			activate($('[name=avatarSize]'));
			activate($('[name=avatarStyle]'));

			$serverList.children().each(function (i, el) {
				var $el = $(el), serverNum = $el.data('server-num');

				$el.find('input[name]').each(function (i, el) {
					activate($(el));
				});

				if ($el.find('.error').length) $el.find('.panel-body').collapse("show");
			});

			if ($form.find('.error').length) {
				$('html, body').animate({'scrollTop': '0px'}, 400);
				return false;
			} else {
				return true;
			}
		}

		function activate($el) {
			var value  = $el.val(),
				parent = $el.parents('.input-row'),
				help   = parent.children('.help-text'),
				key    = $el.attr('name');

			function validateName() {
				if (!validator.isLength(value, 6)) {
					parent.addClass('error');
					help.html('Server name must be at least 6 characters long.');
				} else {
					parent.removeClass('error');
				}
			}

			switch (key) {
				case 'name':
					return validateName();
				default:
					return;
			}
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
			$server.find('[name=name]').val(server.name);
			$server.find('[name=address]').val(server.address);
			$server.find('[name=query-port]').val(server.queryPort);
			$server.find('[name=rcon-port]').val(server.rconPort);
			$server.find('[name=rcon-pass]').val(server.rconPass);
			$server.find('[name=xapi]').val(server.xAPI);
			$server.find('a').text(server.name);
		}

		function addNewServer(serverNum, server) {
			var $server = $serverTemplate.clone();
			$server.data('server-num', serverNum);
			$server.find('a').first().text('Unnamed Server');
			$server.find('[data-toggle="collapse"]').attr('href', '#server' + serverNum);
			$server.find('.panel-body').attr('id', 'server' + serverNum);
			$server.appendTo($serverList);
			if (server) {
				populateServer($server, server);
			}else{
				$server.find('[data-toggle="collapse"]').addClass('in');
				$server.find('[name="name"]').focus();
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
				e.preventDefault();
				if (!validateAll()) return;

				settings.cfg._.avatarCDN = $('[name=avatarCDN]').val();
				settings.cfg._.avatarSize = $('[name=avatarSize]').val();
				settings.cfg._.avatarStyle = $('[name=avatarStyle]').val();
				for (var server in settings.cfg._.servers) {
					if (settings.cfg._.servers[server]) {
						settings.cfg._.servers[server].active = false;
					}
				}
				$serverList.children().each(function(i, el){
					var $el = $(el), serverNum = $el.data('server-num');
					if ($el.find('[name=name]').val()) {
						settings.cfg._.servers[serverNum] = { };
						settings.cfg._.servers[serverNum].name		= $el.find('[name=name]').val();
						settings.cfg._.servers[serverNum].address	= $el.find('[name=address]').val();
						settings.cfg._.servers[serverNum].queryPort	= $el.find('[name=query-port]').val();
						settings.cfg._.servers[serverNum].rconPort	= $el.find('[name=rcon-port]').val();
						settings.cfg._.servers[serverNum].rconPass	= $el.find('[name=rcon-pass]').val();
						settings.cfg._.servers[serverNum].xAPI		= $el.find('[name=xapi]').val();
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
			}).on('input', '[name="name"]', function() {
				var $this = $(this), $server = $this.closest('.panel'), serverNum = $server.data('server-num');
				$server.find('a').first().text($this.val() || 'Unnamed Server (Will be removed if left unnamed.)');
				var $serverListing = $modalBody.children().filter(function () {
					return $(this).data('serverNum') === serverNum;
				});
				if ($serverListing.length) {
					$serverListing.find('span').text($this.val() || 'Unnamed Server (Will be removed if left unnamed.)');
				}
			}).submit(validateAll);
		}

		socket.emit('admin.settings.get', { hash: 'minecraft-integration' }, function (err, values) {
			if (err) {
				console.log('Error getting values:', err);
			} else {
				console.log('MI: settings recieved');
				$.get(__MIDIR + '/templates/admin/plugins/server.tpl', function(data) {
					translator.translate(data, function (translatedTemplate) {
						$serverTemplate = $($.parseHTML(translatedTemplate));
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
				});
			}
		});
	};

	return miACP;
});
