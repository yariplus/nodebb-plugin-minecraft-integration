define(['settings', 'translator', MinecraftIntegration.__MIDIR + "js/vendor/validator.min.js"], function (settings, translator, validator) {

	"use strict";

	var miACP = { }, $form, $serverList, $modal, $modalBody, $serverTemplate, $modalTemplate;

	miACP.load = function () {

		MinecraftIntegration.log("Loading admin data...");

		$form = $('#minecraft-integration');
		$serverList = $('#server-list');
		$modal = $form.find('#mia-modal-servers');
		$modalBody = $modal.find('.modal-body').find('tbody');

		// Tables
		var	$elTableUsers   = $('#miTableUsers'),
			$elTableAvatars = $('#miTableAvatars'),
			$elTablePlayers = $('#miTablePlayers'),
			tplTablePlayers = '<tr data-uuid="{id}"><td class="compact no-break">{idf}</td><td><span class="name">{name}</span></td><td><span class="prefix">{prefix}</span></td><td>{playtime}</td><td>{lastonline}</td><td class="compact squish"><button type="button" class="btn btn-info mi-btn-refresh-player">Refresh</button></td><td class="compact"><button type="button" class="btn btn-danger mi-btn-delete-player">Delete</button></td></tr>';

		function populateFields() {
			$('[name=avatarCDN]').val(settings.cfg._.avatarCDN);
			$('[name=custom-cdn]').val(settings.cfg._.customCDN);
			$('[name=avatarSize]').val(settings.cfg._.avatarSize);
			$('[name=avatarStyle]').val(settings.cfg._.avatarStyle);
		}

		function validateAll(e) {
			activate($('[name=api-key]'));
			activate($('[name=avatarCDN]'));
			activate($('[name=custom-cdn]'));
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
				return $(this).data('server-num') === serverNum;
			});
			if ($server.length) {
				$server.remove();
			}else{
				addServer(serverNum, settings.cfg._.servers[serverNum]);
			}

			var $modalBtn = $modalBody.children().filter(function () {
				return $(this).data('server-num') === serverNum;
			}).find('.mia-toggle-activation');
			if ($modalBtn.hasClass('btn-success')) {
				$modalBtn.addClass('btn-warning').removeClass('btn-success').text('Deactivate');
			}else{
				$modalBtn.addClass('btn-success').removeClass('btn-warning').text('Activate');
			}
		}

		function populateServer($server, server) {
			$server.find('[name=name]').val(server.name);
			$server.find('[name=address]').val(server.address);
			$server.find('[name=query-port]').val(server.queryPort);
			$server.find('[name=rcon-port]').val(server.rconPort);
			$server.find('[name=rcon-pass]').val(server.rconPass);
			$server.find('[name=api-key]').val(server.APIKey);
			$server.find('[name=hide-plugins]').prop( "checked", server.hidePlugins);
			$server.find('a').text(server.name);
		}

		// Add a server to the active list.
		function addServer(sid, server) {

			MinecraftIntegration.log("Adding " + (server ? "" : "new ") + "server: " + sid);

			var $server = $serverTemplate.clone();

			$server.data('sid', sid);

			$server.find('a').first().text('Unnamed Server');
			$server.find('[data-toggle="collapse"]').attr('href', '#server' + sid);
			$server.find('.panel-body').attr('id', 'server' + sid);

			$server.on('click', '[name="api-key"]', function (e) {
				if (!$(this).val()) {
					regenKey($(this));
				}else{
					$(this).select();
				}
			});
			$server.appendTo($serverList);

			if (server) {
				populateServer($server, server);
			}else{
				$server.find('[data-toggle="collapse"]').removeClass('collapsed');
				$server.find('.collapse').addClass('in');
				regenKey($server.find('[name="api-key"]'));
				setTimeout(function () { $server.find('[name="name"]').focus(); }, 200);
			}
			return;
		}

		function addServerToModal(server) {
			var $serverListing = $modalTemplate.clone();
			$serverListing.data('server-num', server.serverNum);
			$serverListing.find('span').text(server.name);
			if (server.active) {
				$serverListing.find('.mia-toggle-activation').addClass('btn-warning').removeClass('btn-success').text('Deactivate');
			}
			$serverListing.appendTo($modalBody);
		}

		function regenKey($input) {
			socket.emit('plugins.MinecraftIntegration.getKey', { }, function (err, data) {
				$input.val(data.key).select();
			});
		}

		function makeButtons() {

			MinecraftIntegration.log("Adding buttons");

			$form.on('click', '.fa-times', function (e) {
				toggleServer($(e.target).closest('.panel').data('server-num'));
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
			}).on('click', '.mia-toggle-activation', function (e) {
				toggleServer($(e.target).closest('tr').data('server-num'));
			}).on('click', '.regen-key', function (e) {
				regenKey($(this).closest('.input-row').find('input'));

			// Avatars
			}).on('click', '.mi-btn-delete-avatar', function (e) {
				var	$this = $(this).closest('tr');

				socket.emit('admin.MinecraftIntegration.deleteAvatar', {name: $this.attr('data-player')}, function (err) {
					if (err) return MinecraftIntegration.log(err);
					$this.fadeOut(600, $this.remove);
				});
			}).on('click', '.mi-btn-refresh-avatar', function (e) {
				var $this = $(this),
					$avatar = $this.closest('tr').find('.mi-avatar');

				$avatar.fadeOut(600, function () {
					socket.emit('admin.MinecraftIntegration.refreshAvatar', {name: $this.closest('tr').attr('data-player')}, function (err, data) {
						$avatar.attr('src', 'data:image/png;base64,' + data.base64);
						$avatar.fadeIn(600);
					});
				});

			// Players
			}).on('click', '.mi-btn-delete-player', function (e) {
				var	$this = $(this).closest('tr');

				socket.emit('admin.MinecraftIntegration.deletePlayer', {id: $this.attr('data-uuid')}, function (err) {
					if (err) return MinecraftIntegration.log(err);
					$this.fadeOut(600, $this.remove);
				});
			}).on('click', '.mi-btn-refresh-player', function (e) {
				var	$this = $(this).closest('tr'),
					$name = $this.find('.name').first();

				// Retrieving the profile will refresh it if there's no risk of throttling.
				socket.emit('plugins.MinecraftIntegration.getPlayer', {id: $this.attr('data-uuid')}, function (err, profile) {
					if (err) return MinecraftIntegration.log(err);
					$name.fadeOut(600, function () {
						$name.text(profile.name);
						$name.fadeIn(600);
					});
				});
			}).on('click', '#mi-btn-reset-avatars', function (e) {
				bootbox.confirm("Are you sure?<br/><br/>This will remove all avatars from the database.", function (result) {
					if (result) {
						socket.emit('admin.MinecraftIntegration.resetCachedAvatars', { }, function () {
							app.alert({
								type: 'info',
								alert_id: 'mi-alert-avatars',
								title: 'Avatars Cleared'
							});
						});
					}
				});

			// Users
			}).on('click', '.mi-btn-delete-user', function (e) {
				var	$this = $(this).closest('tr');

				socket.emit('admin.MinecraftIntegration.deleteUser', {uid: $this.attr('data-uid')}, function (err) {
					if (err) return MinecraftIntegration.log(err);
					$this.fadeOut(600, $this.remove);
				});
			}).on('click', '.save', function (e) {
				e.preventDefault();
				if (!validateAll()) return;

				settings.cfg._.avatarCDN   = $('[name=avatarCDN]').val()   || "mojang";
				settings.cfg._.customCDN   = $('[name=custom-cdn]').val()  || "";
				settings.cfg._.avatarSize  = $('[name=avatarSize]').val()  || "40";
				settings.cfg._.avatarStyle = $('[name=avatarStyle]').val() || "flat";

				settings.helper.persistSettings('minecraft-integration', settings.cfg, true, function(){
					socket.emit('admin.settings.syncMinecraftIntegration');
				});
			});

			$('#mi-tab-servers').on('click', '#mia-add-server', function (e) {

				var sid = 0;

				$serverList.children().each(function (i,el) {
					if ($(el).data('server-num') === sid) sid++;
				});

				addServer(sid);

			}).on('click', '#mia-view-servers', function (e) {
				//$modalBody.empty();
				$modal.modal('show');
			}).on('click', '.save', function (e) {

				if (!validateAll()) return;

				var $server = $(this).closest('.panel');

				var config = {
					name        : $server.find('[name=name]').val(),
					address     : $server.find('[name=address]').val(),
					APIKey      : $server.find('[name=api-key]').val(),
					hidePlugins : $server.find('[name=hide-plugins]').is(':checked'),
					active      : true
				};

				socket.emit('admin.MinecraftIntegration.setServerConfig', {sid: $server.data('sid') + '', config: config}, function (err) {
					if (err) {
						app.alertError(err);
					}else{
						app.alertSuccess("Saved settings for " + config.name);
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
			}).on('input', '[name="name"]', function() {
				var $this = $(this), $server = $this.closest('.panel'), serverNum = $server.data('server-num');
				$server.find('a').first().text($this.val() || 'Unnamed Server (Will be removed if left unnamed.)');
				var $serverListing = $modalBody.children().filter(function () {
					return $(this).data('server-num') === serverNum;
				});
				if ($serverListing.length) {
					$serverListing.find('span').text($this.val());
				}
			}).submit(validateAll);

			$('[name=avatarCDN]').change(function(){
				 if ($('[name=avatarCDN]').val() !== 'custom') {
					 $('[name=custom-cdn]').closest('.row').css('display', 'none');
				 }else{
					 $('[name=custom-cdn]').closest('.row').css('display', 'block');
				 }
			});
		}

		socket.emit('admin.settings.get', { hash: 'minecraft-integration' }, function (err, values) {

			if (err) return MinecraftIntegration.log('Error getting settings:', err);

			MinecraftIntegration.log('Settings recieved');

			settings.helper.whenReady(function () {
				settings.helper.use(values);
				makeButtons();
				populateFields();
				setupInputs();

				if ($('[name=avatarCDN]').val() !== 'custom') $('[name=custom-cdn]').closest('.row').css('display', 'none');

				// Select hashed tab.
				window.onhashchange = function (e) {
					if (location.hash) {
						$('.nav-tabs a[href=#' + location.hash.slice(1) + ']').tab('show');
					}else{
						$('.nav-tabs a').first().tab('show');
					}
				};
				if (app.previousUrl.match('minecraft-integration#')) {
					var hash = app.previousUrl.split('#')[1] || '';
					$('.nav-tabs a[href=#' + hash + ']').tab('show');
					location.hash = '#' + hash;
				}
			});

		});

		socket.emit('admin.MinecraftIntegration.getServersConfig', function (err, servers) {

			if (err) return MinecraftIntegration.log('Error getting servers:', err);

			MinecraftIntegration.log('Servers recieved');
			MinecraftIntegration.log(servers);

			$.get(MinecraftIntegration.__MIDIR + '/templates/admin/plugins/server.tpl' + "?v=" + config['cache-buster'], function(template) {
				translator.translate(template, function (translatedTemplate) {
					$serverTemplate = $($.parseHTML(translatedTemplate));
					$modalTemplate = $($.parseHTML('<tr><td><span></span></td><td style="width:0px;text-align:right;"><button type="button" class="btn btn-success mia-toggle-activation pointer">Activate</button></td></tr>'));

					servers.forEach(function (server) {

						addServerToModal({serverNum: server.sid, name: server.config.name, active: server.config.active});

						if (server.config.active) addServer(server.sid, server.config);

					});

				});
			});

		});

		// Helpers
		function formatUuid(yuuid) {
			return yuuid.slice(0,8) + '-' + yuuid.slice(8, 12) + '-' + yuuid.slice(12, 16) + '-' + yuuid.slice(16, 20) + '-' + yuuid.slice(20, 32);
		}

		function parseTpl(tpl, data) {
			for (var prop in data) {
				if (data.hasOwnProperty(prop)) {
					tpl = tpl.replace('{'+prop+'}', data[prop]);
				}
			}
			return tpl;
		}

		// Populate tables.
		socket.emit('plugins.MinecraftIntegration.getRegisteredUsers', {fields: ['picture']}, function (err, data) {
			for (var i = 0; i < data.length; i++) {
				$elTableUsers.append(
					$('<tr data-uid="' + data[i].uid + '" data-uuid="' + data[i].yuuid + '"><td class="compact no-break"><a href="/user/' + data[i].username + '" target="_blank"><img class="userpic" src="' + data[i].picture + '" width="40px" height="40px">&nbsp;&nbsp;' + data[i].username + '</a></td><td class="compact no-break">'+ formatUuid(data[i].yuuid) + '</td><td><span class="name">' + data[i].name + '</span></td><td class="compact squish"><button type="button" class="btn btn-info mi-btn-refresh-player">Refresh</button></td><td class="compact"><button type="button" class="btn btn-danger mi-btn-delete-user">Delete</button></td></tr>')
				);
			}
		});

		socket.emit('plugins.MinecraftIntegration.getAvatars', { }, function (err, data) {
			for (var i = 0; i < data.length; i++) {
				$elTableAvatars.append(
					$('<tr data-player="' + data[i].name + '"><td class="compact"><img class="mi-avatar" src="data:image/png;base64,' + data[i]['base64'] + '" width="40px" height="40px"></td><td class="compact" style="vertical-align: middle;">' + data[i].name + '</td><td class="no-break">' + formatUuid(data[i].id) + '</td><td class="compact squish"><button type="button" class="btn btn-info mi-btn-refresh-avatar">Refresh</button></td><td class="compact"><button type="button" class="btn btn-danger mi-btn-delete-avatar">Delete</button></td></tr>')
				);
			}
		});

		socket.emit('plugins.MinecraftIntegration.getPlayers', { }, function (err, players) {
			players.forEach(function(player){
				player.idf = formatUuid(player.id);
				$elTablePlayers.append(parseTpl(tplTablePlayers, player));
			});
		});
	};

	return miACP;
});
