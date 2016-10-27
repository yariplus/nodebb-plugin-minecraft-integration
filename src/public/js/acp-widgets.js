(() => {
  $(window).on('action:ajaxify.end', function (event, data) {
    url = data.url.split('?')[0].split('#')[0]

    if (url === 'admin/extend/widgets') {
      // ID for tracking widgets.
      var	wid = 0

      // ID for colorpickers.
      var	cid = 0

      // Do widget pre-init for existing widgets.
      // TEMP:
      // Since the loading is asynchronous, I poll for 5 seconds.
      var	tries = 0
      var	preinit = function () {
        $('.widget-area >:not([data-mi-wid])').each(load)
        if (++tries < 50) setTimeout(preinit, 100)
      }
      preinit()

      // Assign an id to each widget, and call init if it's a Minecraft Integration widget.
      function load (i, el) {
        var	$el = $(el)

        switch ($el.data('widget')) {
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
            $el.attr('data-mi-wid', ++wid)
            initPanel($el)
            break
          default:
            $el.attr('data-mi-wid', 0)
            break
        }
      }

      function formatTitle ($panel) {
        var $title = $panel.find('>.panel-heading strong'),
          title = $panel.find('>.panel-body [name="title"]').val()

        if (!title) {
          $title.html($title.text().split(' - ')[0])
          return
        }

        if ($panel.data('motd') === void 0) {
          $.get('/api/minecraft-integration/server/' + $panel.find('[name="sid"]').val() + '?v=' + config['cache-buster'], function (server) {
            if (server && server.motd && server.name) {
              $panel.data('motd', server.motd)
              $panel.data('name', server.name)
            } else {
              $panel.data('motd', '')
              $panel.data('name', '')
            }
            formatTitle($panel)
          })
        }

        title = title.replace(/\{\{motd\}\}/g, $panel.data('motd') || $panel.find('[name="sid"]').val())
        title = title.replace(/\{\{name\}\}/g, $panel.data('name'))
        title = title.replace(/(\\u00A7|[§&])[0123456789abcdefklmnorABCDEFKLMNOR]/g, '')

        $title.html($title.text().split(' - ')[0] + ' - ' + title)
      }

      function initPanel ($panel) {
        var	$heading = $panel.find('>.panel-heading'),
          $body = $heading.next(),
          $server = $body.find('[name="sid"]'),
          sid = $server.val($server.val() || '0').val()

        $.get('/api/minecraft-integration/server/' + sid + '?v=' + config['cache-buster'], function (server) {
          if (server && server.motd && server.name) {
            $panel.data('motd', server.motd)
            $panel.data('name', server.name)
          } else {
            $panel.data('motd', '')
            $panel.data('name', '')
          }
          formatTitle($panel)
        })

        $body.find('[name="title"]').on('input', function (e) {
          formatTitle($panel)
        })

        $body.find('input.ajaxInputColorPicker').each(function () {
          var $picker = $(this)

          // Local copy of cid.
          var _cid = ++cid

          var id = 'mi-cp-' + _cid

          $picker.attr('id', id)
          if ($picker.val() === '') $picker.val('#000000')

          $picker.ColorPicker({
            color: $picker.val(),
            onChange: function (hsb, hex) {
              $picker.val('#' + hex)
              $picker.css('color', '#' + hex)
            },
            onShow: function (colpkr) {
              $(colpkr).css('z-index', 1051)
            }
          }).css('color', $picker.val()).bind('keyup', function () {
            $picker.ColorPickerSetColor($picker.val())
            $picker.css('color', $picker.val())
          })
        })
      }

      // Init widget panels on drop.
      $('.widget-area').on('mouseup', '> .panel > .panel-heading', function (e) {
        var	$heading = $(this),
          $panel = $heading.parent(),
          widget = $panel.data('widget')

        // Don't init the widget if delete was pressed.
        if ($heading.parent().is('.ui-sortable-helper') || $(e.target).closest('.delete-widget').length) return

        // Only init Minecraft Integration widgets.
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
            initPanel($panel)
            break
        }
      })
    }
  })
})()
