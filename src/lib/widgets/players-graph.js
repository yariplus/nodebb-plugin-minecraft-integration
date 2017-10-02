import { getServerPings } from '../servers'

export function render (widget, callback) {
  let { sid, last } = widget

  last = last || 20

  getServerPings(sid, last, (err, pings) => {
    if (err || !pings) pings = []

    widget.pings = JSON.stringify(pings)
    widget.chartColorFills = JSON.stringify([widget.chartColorFillMin, widget.chartColorFillMax])

    callback(null, widget)
  })
}
