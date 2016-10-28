import Backend from '../backend'

export function render (widget, callback) {
  Backend.getRecentPings({sid: widget.sid, last: 20}, (err, pings) => {
    if (err || !pings) pings = []

    widget.pings = JSON.stringify(pings)
    widget.chartColorFills = JSON.stringify([widget.chartColorFillMin, widget.chartColorFillMax])

    callback(null, widget)
  })
}
