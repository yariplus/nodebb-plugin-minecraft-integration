import { getAvatar } from '../avatars'

import async from 'async'

export function render (data, callback) {
  data.show = parseInt(data.show)
  data.show = isNaN(data.show) ? 5 : data.show
  data.show = data.show > 20 ? 20 : data.show
  data.show = data.show < 3 ? 3 : data.show

  data.statname = ''

  // Defaults
  data.useColors = data.useColors || 'a'
  data.colorStart = data.colorStart || 'white'
  data.colorEnd = data.colorEnd || 'white'

  async.waterfall([
    async.apply(Backend.getTopPlayersByPlaytimes, {show: data.show}),
    (players, next) => {
      async.map(players, (player, next) => {
        // TODO: Different scoring methods.
        player.score = player.playtimeHuman

        getAvatar({base64: true, name: player.name}, (err, avatar) => {
          player.avatar = avatar
          next(null, player)
        })
      }, next)
    }
  ], (err, players) => {
    data.players = players
    callback(null, data)
  })
}
