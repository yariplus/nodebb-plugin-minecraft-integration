import { link as linkPlayer, unlink as unlinkPlayer } from '../players'
import { getKey } from '../utils'
import { db, User } from '../nodebb'

export function keygen (data, next) {
  const {id} = data
  const key = getKey()

  db.setObject(`mi:playerkey:${key}`, {id}, err => {
    db.expire(`mi:playerkey:${key}`, 60 * 10) // TODO: Expire config maybe?
    next(err, {key})
  })
}

export function link (req, res) {
  let uid = req.uid
  let key = req.params.key

  if (!uid) return res.redirect('/')

  db.getObject(`mi:playerkey:${key}`, (err, obj) => {
    if (err || !obj || !obj.id) return res.redirect('/') // TODO

    let id = obj.id

    User.getUserField(uid, 'userslug', (err, userslug) => {
      if (err) return res.redirect('/') // TODO

      linkPlayer(id, uid, err => {
        if (err) return res.redirect('/') // TODO

        res.redirect('/user/${userslug}/minecraft?new=${id}')
      })
    })
  })
}

export function unlink (data, next) {
  let uid = data.socket.uid
  let id = data.id

  if (!id || !uid) return next(new Error(`Invalid parameters to unlink event: ${id}, ${uid}`))

  unlinkPlayer(id, uid, next)
}

// TODO: Create a new forum user from MC server.
export function register (data) {
}
