/* globals app, ajaxify, config, requirejs, socket, $ */
((() => {
  // Require vendor libs, copied from Mega.
  const rjsConfig = requirejs.s.contexts._.config
  const pluginPath = '../../plugins/nodebb-plugin-minecraft-integration/'
  const registerAMD = (name, path) => {
    if (!rjsConfig.paths[name]) rjsConfig.paths[name] = pluginPath + path
  }
  registerAMD('moment', 'vendor/moment')
  registerAMD('d3', 'vendor/d3.min')
  registerAMD('rickshaw', 'vendor/rickshaw.min')
})())

$(() => {
  console.log('Loading Minecraft Integration...')

  const servers = {}
  const staticDir = '/plugins/nodebb-plugin-minecraft-integration/public/'
  let charts = []

  function log (memo, object) {
    if (!(config.MinecraftIntegration && config.MinecraftIntegration.debug)) return

    if (typeof memo === 'object') return console.dir(memo)

    console.log(`[Minecraft Integration] ${memo}`)
    if (object) console.dir(object)
  }

  function prepareChat (widget) {
    const $chatwidget = widget.el
    const $chatbox = $chatwidget.find('.mi-chat-box')
    const $chatinput = $chatwidget.find('.mi-chat-input')
    const $chatsend = $chatwidget.find('.mi-chat-send')

    const sid = $chatwidget.attr('data-sid')
    const name = app.user.username

    $chatbox.scrollTop(100000)

    function sendChat () {
      if (app.user.uid === 0) return

      const message = $chatinput.val()

      const chatData = {sid, id: 'uuid', date: Date.now(), name, message}

      socket.emit('plugins.MinecraftIntegration.eventWebChat', chatData)

      $chatinput.val('')
    }

    $chatwidget.find('.mi-chat-send').click(sendChat)

    $chatwidget.find('input').keyup(e => {
      if (parseInt(e.keyCode, 10) === 13) sendChat()
    })
  }

  function prepareDirectory (widget) {
  }

  function prepareGallery (widget) {
  }

  function prepareMap (widget) {
  }

  function preparePingGraph (widget) {
  }

  function preparePlayersGraph (widget) {
    log('PREPARING PLAYERS GRAPH')

    socket.emit('plugins.MinecraftIntegration.getRecentPings', {sid: widget.sid}, (err, pings) => {
      let data = pings.map(ping => { return {x: ping.timestamp, y: ping.players.length} })
      let times = {}
      pings.forEach(ping => { times[ping.timestamp] = {players: ping.players} })

      require(['rickshaw'], Rickshaw => {
        widget.graph = new Rickshaw.Graph({
          element: widget.el[0],
          renderer: 'bar',
          min: 0,
          max: 10,
          gapSize: 0.05,
          series: [{
            data: data,
            color: 'steelblue'
          }]
        })
        widget.graph.render()
        let hoverDetail = new Rickshaw.Graph.HoverDetail({
          graph: widget.graph,
          formatter: function (series, x, y) {
            return times[x].players.length
          }
        })

        charts.push(widget.graph)
      })
    })
  }

  function preparePlayersGrid (widget) {
    widget.el.find('.mi-avatar').each((i, $avatar) => {
      $avatar = $($avatar)

      // Wrap avatar in profile link if user is registered.
      wrapAvatar($avatar)
      $avatar.tooltip()
    })
  }

  function prepareStatus (widget) {
    widget.el.find('.mi-avatar').each((i, $avatar) => {
      $avatar = $($avatar)

      // Wrap avatar in profile link if user is registered.
      wrapAvatar($avatar)
      $avatar.tooltip()
    })
  }

  function prepareTopGraph (widget) {
    log('PREPARING TOP GRAPH')
    socket.emit('plugins.MinecraftIntegration.getTopPlayersByPlaytimes', {sid: widget.sid, show: 10}, (err, players) => {
      if (err || !players) return log('Couldn\'t retrieve top players.')
      // charts.push(new miChart({
        // type: 'pie',
        // el: widget.el[0],
        // data: players,
        // getValueX: function (d){ return d.name },
        // getValueY: function (d){ return d.playtime }
      // }))
      // widget.el.find('.arc path').tooltip({
        // container: 'body',
        // html: true,
        // template: '<div class="tooltip michart" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
      // })
    })
  }

  function prepareTopList (widget) {
    widget.el.find('img').tooltip()
  }

  function prepareTPSGraph (widget) {
    log('PREPARING TPS GRAPH')
    socket.emit('plugins.MinecraftIntegration.getRecentPings', {sid: widget.sid}, (err, pings) => {
      if (err || !pings) return log('ping error')
      // charts.push(new miChart({
        // el: widget.el[0],
        // data: pings,
        // getValueY: function (d){ return d.tps },
        // minY: 15,
        // maxY: 20
      // }))
    })
  }

  function prepareVoteList (widget) {
  }

  const prepareWidget = {
    'mi-chat': prepareChat,
    'mi-directory': prepareDirectory,
    'mi-gallery': prepareGallery,
    'mi-map': prepareMap,
    'mi-ping-graph': preparePingGraph,
    'mi-players-graph': preparePlayersGraph,
    'mi-players-grid': preparePlayersGrid,
    'mi-status': prepareStatus,
    'mi-top-graph': prepareTopGraph,
    'mi-top-list': prepareTopList,
    'mi-tps-graph': prepareTPSGraph,
    'mi-vote-list': prepareVoteList
  }

  $(window).on('action:ajaxify.end', (event, data) => {
    // Minecraft profile page.
    if (data.url.match(/user\/[^\/]*\/minecraft/)) {
      const key = $('[name="player-key"]').html()

      $('.copyPlayerKey').attr('data-clipboard-text', key)

      require(['//cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.5/clipboard.min.js'], Clipboard => {
        const clipboard = new Clipboard('.copyPlayerKey')

        $('.copyPlayerKey').mouseout(function () {
          $(this).tooltip('destroy')
        })

        clipboard.on('success', e => {
          e.clearSelection()
          $(e.trigger).tooltip({
            title: 'Copied!',
            placement: 'bottom'
          })
          $(e.trigger).tooltip('show')
        })
      })

      $('.resetPlayerKey').click(() => {
        socket.emit('plugins.MinecraftIntegration.resetPlayerKey', {uid: app.user.uid}, (err, data) => {
          if (err) return log(err.message)
          if (!(data && data.key)) return log('Received invalid response to resetPlayerKey call.')

          $('[name="player-key"]').html(`key-${data.key}`)
          $('.copyPlayerKey').attr('data-clipboard-text', `key-${data.key}`)
        })
      })
    }
  })

  $(window).on('action:widgets.loaded', () => {
    // require(['/plugins/nodebb-plugin-minecraft-integration/public/js/vendor/michart.js'], function () {
    // Store widgets
    $('.mi-container').each(function () {
      const $this = $(this)
      const $parent = $this.parent()
      const wid = $this.attr('data-widget')
      const sid = $this.attr('data-sid')

      servers[sid] = servers[sid] || {}
      servers[sid][wid] = {
        el: $this,
        sid
      }
    })

    log('Preparing widgets...')
    charts = []

    for (const sid in servers) {
      for (const wid in servers[sid]) {
        log(`Preparing ${wid} for server ${sid}`)
        prepareWidget[wid](servers[sid][wid])
      }
    }

    resizeEnd()
  })

  socket.on('mi.PlayerJoin', onPlayerJoin)
  socket.on('mi.PlayerQuit', onPlayerQuit)
  socket.on('mi.status', onStatus)
  socket.on('mi.PlayerChat', onPlayerChat)
  socket.on('mi.PlayerVotes', onPlayerVotes)

  function onPlayerJoin (data) {
    addPlayer(data)
    // updateCharts(data)
  }

  function onPlayerQuit (data) {
    removePlayer(data)
    // updateCharts(data)
  }

  function onStatus (data) {
    log('Received Status Ping', data)

    setPlayers(data)

    const $widget = $(`[data-sid="${data.sid}"]`)

    if (data.isServerOnline) {
      $widget.find('.mc-statusicon')
      .addClass('fa-check-circle')
      .addClass('text-success')
      .removeClass('fa-exclamation-circle')
      .removeClass('text-danger')
      $widget.find('.mc-statustext')
      .addClass('text-success')
      .removeClass('text-danger')
      .text('Online')
      $widget.find('.mc-playercount').show()
    } else {
      $widget.find('.mc-statusicon')
      .removeClass('fa-check-circle')
      .removeClass('text-success')
      .addClass('fa-exclamation-circle')
      .addClass('text-danger')
      $widget.find('.mc-statustext')
      .removeClass('text-success')
      .addClass('text-danger')
      .text('Offline')
      $widget.find('.mc-playercount').hide()
    }
  }

  function onPlayerChat (data) {
    $(`[data-widget="mi-chat"][data-sid="${data.sid}"]`).each((i, $widget) => {
      $widget = $($widget)

      $widget.find('.mi-chat-box').append(`<span>${data.chat.name}: ${data.chat.message}</span><br>`)
      $widget.find('.mi-chat-box').scrollTop(100000)
    })
  }

  function onPlayerVotes (data) {
    log(data)
  }

  function setPlayers (data) {
    if (!(data && data.sid !== void 0 && Array.isArray(data.players))) {
      log('Received invalid status data.')
      log(data)
      return
    }

    require(['moment'], moment => {
      // Loop widgets with a current players display.
      // TODO: Don't select widgets that have avatars turned off.
      $(`[data-widget="mi-status"][data-sid="${data.sid}"], [data-widget="mi-players-grid"][data-sid="${data.sid}"]`).each((i, $widget) => {
        // Re-wrap
        $widget = $($widget)

        // Update Icon Time
        const updateTime = data.updateTime || Date.now()
        $widget.find('.mc-statusicon')
          .attr('data-original-title', moment(parseInt(updateTime, 10)).format('MMM Do h:mma'))
          .attr('data-title', moment(parseInt(updateTime, 10)).format('MMM Do h:mma'))

        // Loop avatars and remove players no longer on the server.
        $widget.find('.mi-avatar').each((ignored, el) => {
          // Re-wrap
          const $avatar = $(el)

          // If the player's online, return.
          for (var i in data.players) {
            if (data.players[i].id && data.players[i].name) {
              if ($avatar.attr('data-uuid') === data.players[i].id) return $avatar.show()
            }
          }

          $avatar.hide()
        })

        // Track number of players left to add.
        const pendingPlayers = data.players.length

        // Add players now on the server.
        data.players.forEach(player => {
          let found = false

          $widget.find('.mi-avatar').each(function () {
            const $avatar = $(this)

            if ($avatar.attr('data-uuid') === player.id) {
              found = $avatar
              log(`Found ${player.name}`)
            }
          })

          if (!found) {
            app.parseAndTranslate('partials/playerAvatars', {players: [player]}, $avatar => {
              $avatar.hide()
              $avatar.attr('data-uuid', player.id)

              $avatar.appendTo($widget.find('.mi-avatars'))

              // Wrap avatar in profile link if user is registered.
              wrapAvatar($avatar)

              $avatar.on('load', () => {
                $avatar.show()
              })

              $avatar.tooltip()
            })
          } else {
            found.show()
            // Set avatar borders if complete.
            // if (!--pendingPlayers) setAvatarBorders($widget)
          }
        })

        // Set player count text.
        $widget.find('.online-players').text(data.players.length)

        let $popover

        if ($widget.attr('data-widget') === 'mi-status') {
          $popover = $widget.find('a.fa-plug')
          if ($popover.length && Array.isArray(data.pluginList) && data.pluginList.length) {
            var html = '<table class="table table-plugin-list"><tbody>'

            for (let i in data.pluginList) {
              html += `<tr><td>${data.pluginList[i].name}</td></tr>`
            }

            html += '</tbody></table>'
            $popover.attr('data-content', html)
            $popover.popover({
              container: 'body',
              viewport: { selector: 'body', padding: 20 },
              template: '<div class="popover plugin-list"><div class="arrow"></div><div class="popover-inner"><h1 class="popover-title"></h1><div class="popover-content"><p></p></div></div></div>'
            })
          }

          $popover = $widget.find('a.fa-gavel')
          if ($popover.length && data.modList) {
            var html = '<table class="table table-mod-list"><tbody>'

            for (var i in data.modList) {
              html += `<tr><td>${data.modList[i].modid}</td></tr>`
            }

            html += '</tbody></table>'
            $popover.attr('data-content', html)
            $popover.popover({
              container: 'body',
              viewport: { selector: 'body', padding: 20 },
              template: '<div class="popover mod-list"><div class="arrow"></div><div class="popover-inner"><h1 class="popover-title"></h1><div class="popover-content"><p></p></div></div></div>'
            })
          }
        }
      })
    })
  }

  function addPlayer (data) {
    const player = data.player
    app.parseAndTranslate('partials/playerAvatars', {players: [player], pocket: ''}, $avatar => {
      // Loop widgets with a current players display.
      // TODO: Don't select widgets that have avatars turned off.
      $(`[data-widget="mi-status"][data-sid="${data.sid}"], [data-widget="mi-players-grid"][data-sid="${data.sid}"]`).each((i, $widget) => {
        var $widget = $($widget)

        // Add the player only if they are not already listed.
        const $found = $widget.find(`.mi-avatar[data-uuid="${player.id}"]`)

        if ($found.length) {
          $found.css('display', 'inline-block')
        } else {
          $avatar.appendTo($widget.find('.mi-avatars'))
        }

        $widget.find('.online-players').text(parseInt($widget.find('.online-players').text(), 10) + 1)

        // Wrap avatar in profile link if user is registered.
        wrapAvatar($avatar)

        $avatar.tooltip()
      })
    })
  }

  // Remove a single player from widgets.
  function removePlayer (data) {
    // TODO: Better selectors.
    $(`[data-sid="${data.sid}"]`).each((i, el) => {
      const $widget = $(el)

      switch ($widget.attr('data-widget')) {
        case 'mi-status':
        case 'mi-players-grid':
          // Remove the player who is no longer on the server.
          const $avatar = $widget.find(`.mi-avatar[data-uuid="${data.player.id}"]`)

          if ($avatar.length && $avatar.css('display') === 'inline-block') {
            $avatar.css('display', 'none')
            $widget.find('.online-players').text(parseInt($widget.find('.online-players').text(), 10) - 1)
          }

          // Don't leave tooltips behind.
          // TODO: Only remove MI tooltips.
          $('.tooltip').remove()
          break
      }
    })
  }

  // When avatars change, render new effects.
  function setAvatarBorders ($widget) {
    const $avatars = $widget.find('.mi-avatar'), $scores = $widget.find('.score')

    if ($avatars.length === 0) return
    if ($widget.is(':not([data-colors="on"])')) return

    const rainbow = getRainbow($widget, $avatars.length > 1 ? $avatars.length - 1 : $avatars.length)

    if (!rainbow) return

    $avatars.each((i, el) => {
      $(el).css('border-style', $widget.attr('data-border') || 'none')
      $(el).css('border-color', `#${rainbow.colourAt(i)}`)
    })

    $scores.each((i, el) => {
      $(el).css('color', `#${rainbow.colourAt(i)}`)
    })
  }

  function getAvatarUrl (name) {
    return `${config.relative_path}/api/minecraft-integration/avatar/${name}/64`
  }

  // Wrap avatar in profile link if user is registered.
  function wrapAvatar ($avatar) {
    if (!$avatar.parent().is('a')) {
      socket.emit('plugins.MinecraftIntegration.getUser', {id: $avatar.attr('data-uuid')}, (err, userData) => {
        if (!err && userData && userData.userslug) {
          $avatar.wrap(`<a href="/user/${userData.userslug}"></a>`)
        } else {
          $avatar.wrap('<a></a>')
        }
        $avatar.parent().click(() => {
          $('.tooltip').remove()
        })
      })
    }
  }

  // Delay window resize response based on delta delay.
  ((() => {
    const delta = 10
    let rtime = new Date()
    let timeout = false
    $(window).resize(() => {
      rtime = new Date()
      if (timeout === false) {
        timeout = true
        setTimeout(resizeend, delta)
      }
    })
    function resizeend () {
      if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta)
      } else {
        timeout = false
        // Do thing.
        resizeEnd()
      }
    }
  })())

  function resizeEnd () {
    console.log('resizing')
    require(['rickshaw'], Rickshaw => {
      for (let sid in servers) {
        for (let wid in servers[sid]) {
          let widget = servers[sid][wid]
          const h = widget.el.data('height-ratio')
          if (h) widget.el.height(widget.el.width() * parseFloat(widget.el.data('height-ratio')))

          if (widget.graph) {
            widget.graph.configure({
              width: widget.el.width(),
              height: widget.el.height()
            })
            widget.graph.render()
          }
        }
      }
    })
  }

  // Vault Prefixes
  if (config.MinecraftIntegration.showPrefixes) {
    $(window).on('action:posts.loaded', addPrefixes)
    $(window).on('action:ajaxify.end', addPrefixes)
    addPrefixes()
  }
  function addPrefix ($el, prefix) {
    $el.find('.username>a').prepend(`<span class="prefix">${prefix}</span><br>`)
    $el.find('[itemprop="author"]').prepend(`<span class="prefix">${prefix}</span>&nbsp&nbsp`)
  }
  function addPrefixes (event, data) {
    if (ajaxify.data && ajaxify.data.prefixes) {
      $('[data-pid]:not([data-prefix])').each(function () {
        const $el = $(this), prefix = ajaxify.data.prefixes[$el.attr('data-uid')]

        $el.attr('data-prefix', 'true')

        if (prefix) return addPrefix($el, prefix)
        if (prefix === null) return

        socket.emit('plugins.MinecraftIntegration.getUserPrefix', {
          uid: $el.attr('data-uid')
        }, (err, data) => {
          if (data.prefix) addPrefix($el, data.prefix)
        })
      })
    }
  }

  require(['//cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.5/clipboard.min.js'], Clipboard => {
    const clipboard = new Clipboard('.mi-serveraddresscopy')
    $('.mi-serveraddresscopy')
      .mouseout(function () {
        $(this).tooltip('destroy')
        $(this).removeClass('mi-highlight')
        $(this).prev().removeClass('mi-highlight')
      })
      .mouseenter(function () {
        $(this).addClass('mi-highlight')
        $(this).prev().addClass('mi-highlight')
      })
      .removeClass('hide')
    clipboard.on('success', e => {
      e.clearSelection()
      $(e.trigger).tooltip({
        title: 'Copied!',
        placement: 'bottom'
      })
      $(e.trigger).tooltip('show')
    })
  })

  function getRainbow ($widget, range, cb) {
    require([`${staticDir}js/vendor/rainbowvis.js`], Rainbow => {
      const rainbow = new Rainbow()
      let colorStart = $widget.attr('data-color-start') || 'white', colorEnd = $widget.attr('data-color-end') || 'white'

      colorStart = colorStart.slice(0, 1) === '#' ? colorStart.slice(1) : colorStart
      colorEnd = colorEnd.slice(0, 1) === '#' ? colorEnd.slice(1) : colorStart

      rainbow.setNumberRange(0, range)
      rainbow.setSpectrum(colorStart, colorEnd)

      cb(rainbow)
    })
  }
})
