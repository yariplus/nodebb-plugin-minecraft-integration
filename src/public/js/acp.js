/* globals app, ajaxify, config, requirejs, socket, $ */

define('admin/plugins/minecraft-integration', ['settings', 'translator'], function (settings, translator) {
  var miACP = {}
  var $form
  var $tabServers
  var $tabSettings
  var $tabUsers
  var $tabAvatars
  var $tabPlayers
  var $tabMaintenance
  var $serverList
  var $serverTemplate

  function log (memo, object) {
    if (!(config.MinecraftIntegration && config.MinecraftIntegration.debug)) return

    if (typeof memo === 'object') {
      console.dir(memo)
    } else {
      console.log('[Minecraft Integration] ' + memo)
      if (object) console.dir(object)
    }
  }

  miACP.init = function () {
    log('Loading admin data...')

    $form = $('#minecraft-integration')
    $tabServers = $('#mi-tab-servers')
    $tabSettings = $('#mi-tab-settings')
    $tabUsers = $('#mi-tab-users')
    $tabAvatars = $('#mi-tab-avatars')
    $tabPlayers = $('#mi-tab-players')
    $tabMaintenance = $('#mi-tab-maintenance')
    $serverList = $('#server-list')

    // Tables
    var $elTableUsers = $('#miTableUsers'),
      $elTableAvatars = $('#miTableAvatars'),
      $elTablePlayers = $('#miTablePlayers'),
      tplTablePlayers = '<tr data-uuid="{id}"><td class="compact no-break">{idf}</td><td><span class="name">{name}</span></td><td><span class="prefix">{prefix}</span></td><td>{playtime}</td><td>{lastonline}</td><td class="compact squish"><button type="button" class="btn btn-info mi-btn-refresh-player">Refresh</button></td><td class="compact"><button type="button" class="btn btn-danger mi-btn-delete-player">Delete</button></td></tr>'

    function populateFields () {
      $('[name=avatarCDN]').val(settings.cfg._.avatarCDN)
      $('[name=custom-cdn]').val(settings.cfg._.customCDN)
      $('[name=avatarSize]').val(settings.cfg._.avatarSize)
      $('[name=avatarStyle]').val(settings.cfg._.avatarStyle)
      $('[name=showPrefixes]').prop('checked', parseInt(settings.cfg._.showPrefixes, 10))
      $('[name=usePrimaryPrefixOnly]').prop('checked', parseInt(settings.cfg._.usePrimaryPrefixOnly, 10))
      $('[name=debug]').prop('checked', parseInt(settings.cfg._.debug, 10))
    }

    function validateAll (e) {
      activate($('[name=api-key]'))
      activate($('[name=avatarCDN]'))
      activate($('[name=custom-cdn]'))
      activate($('[name=avatarSize]'))
      activate($('[name=avatarStyle]'))

      $serverList.children().each(function (i, el) {
        var $el = $(el), serverNum = $el.data('server-num')

        $el.find('input[name]').each(function (i, el) {
          activate($(el))
        })

        if ($el.find('.error').length) $el.find('.panel-body').collapse('show')
      })

      if ($form.find('.error').length) {
        $('html, body').animate({'scrollTop': '0px'}, 400)
        return false
      } else {
        return true
      }
    }

    function activate ($el) {
      var value = $el.val(),
        parent = $el.parents('.input-row'),
        help = parent.children('.help-text'),
        key = $el.attr('name')

      function validateName () {
        // TODO
        parent.removeClass('error')
      }

      switch (key) {
        case 'name':
          return validateName()
        default:
          return
      }
    }

    function getNextSid () {
      var nextSid = 0

      $.map($serverList.children(), function ($server) {
        return parseInt($($server).attr('data-sid'), 10)
      }).sort().forEach(function (sid) {
        if (nextSid === sid) nextSid++
      })

      return nextSid
    }

    function collapse (e) {
      $(e.delegateTarget).find('.panel-body').collapse('toggle')
    }

    // Add a server config to the list.
    function addServer (server) {
      log('Adding ' + (server ? 'existing' : 'new ') + 'server config.', server ? server : null)

      var sid = server ? server.sid : getNextSid(),
        $server = $serverTemplate.clone()

      $server.attr('data-sid', sid)
      $server.on('click', '[data-toggle="collapse"]', collapse)

      // Select the API key when clicked.
      $server.on('click', '[name="api-key"]', function (e) {
        if (!$(this).val()) {
          regenKey($(this))
        } else {
          this.select()
        }
      })

      $server.find('a').text(server ? server.name : 'A Minecraft Server ' + sid)

      $server.find('[name="name"]').val(server ? server.name : 'A Minecraft Server ' + sid)
      $server.find('[name="address"]').val(server ? server.address : '')
      $server.find('[name="api-key"]').val(server ? server.APIKey : regenKey($server.find('[name="api-key"]'), true))

      $server.find('[name="hide-plugins"]').prop('checked', server ? parseInt(server.hidePlugins, 10) : false)

      if (!server) {
        $server.find('.panel-body').collapse('toggle')
        setTimeout(function () { $server.find('[name="name"]').select() }, 400)
      }

      $server.appendTo($serverList)
    }

    function regenKey ($input, noSelect) {
      socket.emit('plugins.MinecraftIntegration.getKey', { }, function (err, data) {
        $input.val(data.key)
        if (noSelect) return
        $input.select()
      })
    }

    function makeButtons () {
      log('Adding buttons')

      // Servers
      $tabServers.on('click', '#mia-add-server', function (e) {
        addServer()
      }).on('click', '.save', function (e) {
        if (!validateAll()) return

        var $server = $(this).closest('.panel')

        var config = {
          name: $server.find('[name=name]').val(),
          address: $server.find('[name=address]').val(),
          APIKey: $server.find('[name=api-key]').val(),
          hidePlugins: $server.find('[name=hide-plugins]').is(':checked') ? 1 : 0
        }

        socket.emit('admin.MinecraftIntegration.setServerConfig', {sid: $server.attr('data-sid'), config: config}, function (err) {
          if (err) {
            app.alertError(err)
          } else {
            app.alertSuccess('Saved settings for ' + config.name)
            log('Save settings', config)
          }
        })
      }).on('focus', '.form-control', function () {
        var parent = $(this).closest('.input-row')

        $('.input-row.active').removeClass('active')
        parent.addClass('active').removeClass('error')

        var help = parent.find('.help-text')
        help.html(help.attr('data-help'))
      }).on('blur change', '[name]', function () {
        // activate($(this).attr('name'), $(this))
      }).on('input', '[name="name"]', function () {
        var $this = $(this), $server = $this.closest('.panel'), serverNum = $server.data('server-num')
        $server.find('a').first().text($this.val() || 'A Minecraft Server ' + sid)
      }).on('click', '.regen-key', function (e) {
        regenKey($(this).closest('.input-row').find('input'))
      }).on('click', '.fa-times', function (e) {
        var $this = $(this), $server = $this.closest('.panel'), sid = $server.attr('data-sid'), name = $server.find('[name="name"]').val()
        bootbox.confirm('<p>Are you sure?</p><p class="strong">This will delete all data from ' + name + ' (SID:' + sid + ').</p><p class="text-danger strong">This cannot be undone.</p>', function (result) {
          if (result) {
            socket.emit('admin.MinecraftIntegration.deleteServer', {sid: sid}, function (err) {
              if (!err) $server.remove()
            })
          }
        })
      })

      // Settings
      $tabSettings.on('click', '.save', function (e) {
        e.preventDefault()
        if (!validateAll()) return

        settings.cfg._.avatarCDN = $('[name=avatarCDN]').val() || 'mojang'
        settings.cfg._.customCDN = $('[name=custom-cdn]').val() || ''
        settings.cfg._.avatarSize = $('[name=avatarSize]').val() || '40'
        settings.cfg._.avatarStyle = $('[name=avatarStyle]').val() || 'flat'
        settings.cfg._.showPrefixes = $('[name=showPrefixes]').prop('checked') ? 1 : 0
        settings.cfg._.usePrimaryPrefixOnly = $('[name=usePrimaryPrefixOnly]').prop('checked') ? 1 : 0
        settings.cfg._.debug = $('[name=debug]').prop('checked') ? 1 : 0

        settings.helper.persistSettings('minecraft-integration', settings.cfg, true, function () {
          socket.emit('admin.settings.syncMinecraftIntegration')
        })
      }).on('focus', '.form-control', function () {
        var parent = $(this).closest('.input-row')

        $('.input-row.active').removeClass('active')
        parent.addClass('active').removeClass('error')

        var help = parent.find('.help-text')
        help.html(help.attr('data-help'))
      }).on('blur change', '[name]', function () {
        // activate($(this).attr('name'), $(this))
      }).on('click', '#mia-delete', function (e) {
        bootbox.confirm('Are you sure?<p class="text-danger strong">This will delete all data from all Minecraft servers.</p>', function (result) {
          if (result) {
            socket.emit('admin.settings.resetMinecraftIntegration')
          }
        })
      }).on('click', '.mia-toggle-activation', function (e) {
        toggleServer($(e.target).closest('tr').data('server-num'))
      })

      // Avatars
      $tabAvatars.on('click', '.mi-btn-delete-avatar', function (e) {
        var $this = $(this).closest('tr')

        socket.emit('admin.MinecraftIntegration.deleteAvatar', {name: $this.attr('data-player')}, function (err) {
          if (err) return log(err)
          $this.fadeOut(600, $this.remove)
        })
      }).on('click', '.mi-btn-refresh-avatar', function (e) {
        var $this = $(this),
          $avatar = $this.closest('tr').find('.mi-avatar')

        $avatar.fadeOut(600, function () {
          socket.emit('admin.MinecraftIntegration.refreshAvatar', {name: $this.closest('tr').attr('data-player')}, function (err, data) {
            $avatar.attr('src', 'data:image/pngbase64,' + data.base64)
            $avatar.fadeIn(600)
          })
        })
      })

      // Players
      $tabPlayers.on('click', '.mi-btn-delete-player', function (e) {
        var $this = $(this).closest('tr')

        socket.emit('admin.MinecraftIntegration.deletePlayer', {id: $this.attr('data-uuid')}, function (err) {
          if (err) return log(err)
          $this.fadeOut(600, $this.remove)
        })
      }).on('click', '.mi-btn-refresh-player', function (e) {
        var $this = $(this).closest('tr'),
          $name = $this.find('.name').first()

        // Retrieving the profile will refresh it if there's no risk of throttling.
        socket.emit('plugins.MinecraftIntegration.getPlayer', {id: $this.attr('data-uuid')}, function (err, profile) {
          if (err) return log(err)
          $name.fadeOut(600, function () {
            $name.text(profile.name)
            $name.fadeIn(600)
          })
        })
      })

      // Users
      $tabUsers.on('click', '.mi-btn-delete-user', function (e) {
        var $this = $(this).closest('tr')

        socket.emit('admin.MinecraftIntegration.deleteUser', {uid: $this.attr('data-uid')}, function (err) {
          if (err) return log(err)
          $this.fadeOut(600, $this.remove)
        })
      })

      // Maintenance
      $tabMaintenance.on('click', '#mi-btn-reset-avatars', function (e) {
        bootbox.confirm('Are you sure?<br/><br/>This will remove all avatars from the database.', function (result) {
          if (result) {
            socket.emit('admin.MinecraftIntegration.resetCachedAvatars', { }, function () {
              app.alert({
                type: 'info',
                alert_id: 'mi-alert-avatars',
                title: 'Avatars Cleared'
              })
            })
          }
        })
      })
    }

    function setupInputs () {
      $('[name=avatarCDN]').change(function () {
        if ($('[name=avatarCDN]').val() !== 'custom') {
          $('[name=custom-cdn]').closest('.row').css('display', 'none')
        } else {
          $('[name=custom-cdn]').closest('.row').css('display', 'block')
        }
      })
    }

    socket.emit('admin.settings.get', { hash: 'minecraft-integration' }, function (err, values) {
      if (err) return log('Error getting settings:', err)

      log('Settings recieved')

      settings.helper.whenReady(function () {
        settings.helper.use(values)
        makeButtons()
        populateFields()
        setupInputs()

        if ($('[name=avatarCDN]').val() !== 'custom') $('[name=custom-cdn]').closest('.row').css('display', 'none')

        // Select hashed tab.
        window.onhashchange = function (e) {
          if (location.hash) {
            $('.nav-tabs a[href="#' + location.hash.slice(1) + '"]').tab('show')
          } else {
            $('.nav-tabs a').first().tab('show')
          }
        }
        if (app.previousUrl && app.previousUrl.match('minecraft-integration#')) {
          var hash = app.previousUrl.split('#')[1] || ''
          $('.nav-tabs a[href="#' + hash + '"]').tab('show')
          location.hash = '#' + hash
        }
      })
    })

    socket.emit('admin.MinecraftIntegration.getServersConfig', {}, function (err, servers) {
      if (err) return log('Error getting servers:', err)

      log('Got server configurations.')
      log(servers)

      // Make this parse the template properly.
      templates.parse('admin/plugins/server', {}, template => {
        translator.translate(template, translatedTemplate => {
          $serverTemplate = $($.parseHTML(translatedTemplate))
          servers.forEach(addServer)
        })
      })
    })

    // Helpers
    function formatUuid (yuuid) {
      if (!yuuid) return null
      return yuuid.slice(0, 8) + '-' + yuuid.slice(8, 12) + '-' + yuuid.slice(12, 16) + '-' + yuuid.slice(16, 20) + '-' + yuuid.slice(20, 32)
    }

    function parseTpl (tpl, data) {
      for (var prop in data) {
        if (data.hasOwnProperty(prop)) {
          tpl = tpl.replace('{' + prop + '}', data[prop])
        }
      }
      return tpl
    }

    // Populate tables.
    socket.emit('plugins.MinecraftIntegration.getUsers', {fields: ['picture']}, function (err, users) {
      users.forEach(user => {
        var playersEl = ''
        if (Array.isArray(user.players)) {
          user.players.forEach(player => {
            playersEl += '<tr><td class="compact">' + (player.isPrimary ? '<i class="fa fa-star"></i>' : '') + '</td><td>' + player.name + '</td><td>' + formatUuid(player.id) + '</td></tr>'
          })
        }
        if (playersEl !== '') playersEl = '<table class="table table-striped table-bordered" style="margin:0"><tr><th></th><th>Name</th><th>UUID</th></tr>' + playersEl + '</table>'
        $elTableUsers.append(
          $('<tr data-uid="' + user.uid + '" data-uuid="' + user.yuuid + '"><td class="compact no-break"><a href="/user/' + user.username + '" target="_blank"><img class="userpic" src="' + user.picture + '" width="40px" height="40px">&nbsp&nbsp' + user.username + '</a></td><td>' + playersEl + '</td></tr>')
        )
      })
    })

    socket.emit('plugins.MinecraftIntegration.getAvatars', { }, function (err, avatars) {
      avatars.forEach(avatar => {
        $elTableAvatars.append(
          $('<tr data-player="' + avatar.name + '"><td class="compact"><img class="mi-avatar" src="/api/minecraft-integration/avatar/' + avatar.name + '/64" width="40px" height="40px"></td><td class="compact" style="vertical-align: middle">' + avatar.name + '</td><td class="no-break">' + formatUuid(avatar.id) + '</td><td class="compact squish"><button type="button" class="btn btn-info mi-btn-refresh-avatar">Refresh</button></td><td class="compact"><button type="button" class="btn btn-danger mi-btn-delete-avatar">Delete</button></td></tr>')
        )
      })
    })

    socket.emit('plugins.MinecraftIntegration.getPlayers', { }, function (err, players) {
      players.forEach(function (player) {
        player.idf = formatUuid(player.id)
        player.prefix = player.prefix || 'No Prefix'
        $elTablePlayers.append(parseTpl(tplTablePlayers, player))
      })
    })
  }

  return miACP
})
