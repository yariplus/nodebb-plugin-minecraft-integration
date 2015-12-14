define(['settings', 'translator', MinecraftIntegration.__MIDIR + "js/vendor/validator.min.js"], function (settings, translator, validator) {

	"use strict";

	var miACP = { }, $form, $serverList, $serverTemplate;

	miACP.load = function () {

		MinecraftIntegration.log("Loading admin data...");

		$form = $('#minecraft-integration');
		$serverList = $('#server-list');

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

		function getNextSid() {

			var nextSid = 0;

			$.map($serverList.children(), function ($server) {
				return parseInt($($server).attr('data-sid'), 10);
			}).sort().forEach(function (sid) {
				if (nextSid === sid) nextSid++;
			});

			return nextSid;

		}

		function collapse(e) {
			$(e.delegateTarget).find('.panel-body').collapse('toggle');
		}

		// Add a server to the list.
		function addServer(server) {

			MinecraftIntegration.log("Adding " + (server ? "" : "new ") + "server.", server ? server : null);

			var	sid     = server ? server.sid : getNextSid(),
				$server = $serverTemplate.clone();

			$server.attr('data-sid', sid);
			$server.on('click', '[data-toggle="collapse"]', collapse);

			// Select the API key when clicked.
			$server.on('click', '[name="api-key"]', function (e) {
				if (!$(this).val()) {
					regenKey($(this));
				}else{
					this.select();
				}
			});

			$server.find('a').text(server ? server.config.name : 'A Minecraft Server ' + sid);

			$server.find('[name="name"]').val(server    ? server.config.name    : 'A Minecraft Server ' + sid);
			$server.find('[name="address"]').val(server ? server.config.address : '');
			$server.find('[name="api-key"]').val(server ? server.config.APIKey  : regenKey($server.find('[name="api-key"]'), true));

			$server.find('[name="hide-plugins"]').prop("checked", server ? parseInt(server.config.hidePlugins, 10) : false);

			if (!server) {
				$server.find('.panel-body').collapse('toggle');
				setTimeout(function () { $server.find('[name="name"]').select(); }, 400);
			}

			$server.appendTo($serverList);

		}

		function regenKey($input, noSelect) {
			socket.emit('plugins.MinecraftIntegration.getKey', { }, function (err, data) {
				$input.val(data.key);
				if (noSelect) return;
				$input.select();
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
				addServer();
			}).on('click', '.save', function (e) {

				if (!validateAll()) return;

				var $server = $(this).closest('.panel');

				var config = {
					name        : $server.find('[name=name]').val(),
					address     : $server.find('[name=address]').val(),
					APIKey      : $server.find('[name=api-key]').val(),
					hidePlugins : $server.find('[name=hide-plugins]').is(':checked') ? 1 : 0
				};

				socket.emit('admin.MinecraftIntegration.setServerConfig', {sid: $server.attr('data-sid'), config: config}, function (err) {
					if (err) {
						app.alertError(err);
					}else{
						app.alertSuccess("Saved settings for " + config.name);
						MinecraftIntegration.log("Save settings", config);
					}
				});

			}).on('focus', '.form-control', function() {
				var parent = $(this).closest('.input-row');

				$('.input-row.active').removeClass('active');
				parent.addClass('active').removeClass('error');

				var help = parent.find('.help-text');
				help.html(help.attr('data-help'));
			}).on('blur change', '[name]', function() {
				//activate($(this).attr('name'), $(this));
			}).on('input', '[name="name"]', function() {
				var $this = $(this), $server = $this.closest('.panel'), serverNum = $server.data('server-num');
				$server.find('a').first().text($this.val() || 'A Minecraft Server ' + sid);
			});
		}

		function setupInputs() {
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
					servers.forEach(addServer);
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
				player.idf    = formatUuid(player.id);
				player.prefix = player.prefix || "No Prefix"
				$elTablePlayers.append(parseTpl(tplTablePlayers, player));
			});
		});
	};

	return miACP;
});
