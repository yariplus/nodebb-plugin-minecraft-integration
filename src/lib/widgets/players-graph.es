import Backend from '../backend'
import miChart from '../../public/js/vendor/michart.js'

export const document = require('jsdom').jsdom()

export function render (widget, callback) {
  Backend.getRecentPings({sid: widget.sid, last: 20}, (err, pings) => {
    if (err || !pings) pings = []

    widget.pings = JSON.stringify(pings)
    widget.chartColorFills = JSON.stringify([widget.chartColorFillMin, widget.chartColorFillMax])

    const chart = new miChart({
      type: 'bar',
      data: pings,
      getValueY(d) { return d.players.length; },
      minY: 0,
      bufferY: 2,
      maxY: 33
    })

    widget.svg = chart.el.node().outerHTML

    callback(null, widget)
  })
}
