import { getScoreboards } from '../servers'

export function render (data, next) {
  let { sid, objective, show } = data

  show = parseInt(show)
  show = isNaN(show) ? 5 : show
  show = show > 20 ? 20 : show
  show = show < 3 ? 3 : show

  getScoreboards(sid, objective, show, (err, players) => {
    next(err, { ...data, players, show })
  })
}
