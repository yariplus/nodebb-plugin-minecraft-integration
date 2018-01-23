import { getAvatar } from '../avatars'
import { getScoreboards } from '../servers'

import async from 'async'

export function render (data, next) {
  let { sid, objective, show, useColors, colorStart, colorEnd, } = data

  show = parseInt(show)
  show = isNaN(show) ? 5 : show
  show = show > 20 ? 20 : show
  show = show < 3 ? 3 : show

  // TODO: Custom colors.
  useColors = useColors || 'a'
  colorStart = colorStart || 'white'
  colorEnd = colorEnd || 'white'

  getScoreboards(sid, objective, show, (err, players) => {
    next(err, {...data, players, useColors, colorStart, colorEnd, })
  })
}
