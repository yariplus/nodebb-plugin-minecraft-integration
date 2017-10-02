import {
  getPlayerByName,
  getPlayerByUuid,
  getPlayersByUid,
} from '../players'

// Single UUID or Name
function player (req, res) {
  let { id, name } = req.params

  let method = id ? getPlayerByUuid : getPlayerByName
  let data = id ? id : name

  method(data, (err, player) => {
    if (err) return res.status(404).end()

    res.render('mi/data', {data: player})
  })
}

// All players linked to user UID
function user (req, res) {
  let uid = req.params.uid

  getPlayersByUid(uid, (err, players) => {
    if (err) return res.status(404).end()

    res.render('mi/data', {data: players})
  })
}

// Players on a server.
function server (req, res) {
  res.status(404).end()
}

// Linked players.
function linked (req, res) {
  res.status(404).end()
}

// Seen players.
function seen (req, res) {
  res.status(404).end()
}

function profile (req, res) {
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

// The player clicked on a register link within Minecraft.
function register (req, res) {
  let { uid } = req.uid

  // TODO: Register forum user.
  if (!uid) return res.redirect('/register')

  // Redirect to their profile page.
  User.getUserField(req.uid, 'userslug', (err, slug) => {
    if (err) {
      console.log(err)
      return res.redirect('/register')
    }

    res.redirect(`/user/${slug}/minecraft`)
  })
}

export {
  player,
  user,
  server,
  linked,
  seen,
  profile,
  register,
}
