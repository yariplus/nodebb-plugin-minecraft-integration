import { User } from '../nodebb'
import { getPlayerKey, getUserLinkedPlayers } from '../api'
import { parseFormatCodes } from '../utils'
import async from 'async'

export function renderPlayers (req, res) {
  res.render('minecraft-integration/players', {})
}

export function renderMinecraftProfile (req, res) {
  let payload = {}

  async.waterfall([
    async.apply(User.getUidByUserslug, req.params.user),
    async.apply(User.getUserData),
    (userData, next) => {
      if (!userData) return res.redirect('/')

      payload = userData

      if (req.uid !== parseInt(userData.uid, 10)) {
        payload.isSelf = false

        next(null, userData.uid)
      } else {
        payload.isSelf = true

        getPlayerKey({uid: req.uid}, (err, result) => {
          if (err) return next(err)
          payload.playerKey = result.key
          next(err, userData.uid)
        })
      }
    },
    (uid, next) => {
      getUserLinkedPlayers(uid, (err, players) => {
        if (err || !players || !players.length) {
          payload.hasPlayers = false
        } else {
          players = players.map(player => {
            player.prefix = parseFormatCodes(player.prefix)
            return player
          })

          payload.hasPlayers = true
          payload.players = players
        }
        next()
      })
    }
  ], err => {
    if (err) {
      console.log(err)
      return res.redirect('/')
    }

    payload.title = req.params.user

    res.render('account/minecraft', payload)
  })
}

export function redirectRegister (req, res) {
  if (!req.uid) {
    res.redirect('/register')
  } else {
    User.getUserField(req.uid, 'userslug', (err, slug) => {
      res.redirect(`/user/${slug}/minecraft`)
    })
  }
}
