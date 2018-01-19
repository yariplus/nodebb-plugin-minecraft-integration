import { getAvatar } from '../avatars'
import { getScoreboard } from '../servers'

import async from 'async'

export function render (data, next) {
  data.show = parseInt(data.show)
  data.show = isNaN(data.show) ? 5 : data.show
  data.show = data.show > 20 ? 20 : data.show
  data.show = data.show < 3 ? 3 : data.show

  data.statname = ''

  // TODO: Custom colors.
  data.useColors = data.useColors || 'a'
  data.colorStart = data.colorStart || 'white'
  data.colorEnd = data.colorEnd || 'white'

  getScoreboard({show: 10}, (err, players) => {
    if (err) return next(err)

    data.players = players

    next(null, data)
  })
}
