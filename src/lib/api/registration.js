import { db } from './nodebb'
import Backend from './backend'
import Utils from './utils'
import async from 'async'

export function register (data, next) {
  if (!(data && data.id && data.name && data.pkey)) return next(new Error('FAILDATA'))

  // Local vars.
  const { sid, id, name, pkey } = data
  const prefix = data.prefix || ''

  console.log(`Got "/register" command from Minecraft server ${sid}.\nPlayer ${data.name} is attempting to register with player key ${pkey}`)

  getPlayerKeyUID({key: pkey, name}, (err, uid) => {
    if (err || !uid) {
      return next(new Error('FAILKEY'))
    }

    async.parallel([
      // TODO: Create an account renaming option.

      // Link the accounts.
      async.apply(Backend.linkUuidtoUid, id, uid),

      // Change the player key.
      async.apply(resetKey, {uid}),

      // Set prefix
      async.apply(db.setObjectField, `yuuid:${id}`, 'prefix', prefix)
    ], err => {
      if (err) {
        console.log(`Register err for UID ${uid}: ${err}`)
        next(new Error('FAILDB'))
      } else {
        console.log(`Set the Minecraft UUID for UID ${uid} to ${id}`)
        next(null, {result: 'REGISTER'})
      }
    })
  })
}

export function getPlayerKeyUID (data, cb) {
  if (!(data && data.key)) return cb(new Error('Bad data sent to Backend.getPlayerKeyUID.'))

  db.sortedSetScore('playerkey:uid', data.key, (err, uid) => {
    if (err || !uid) err = err || new Error('FAILKEY')

    return cb(err, uid)
  })
}

export function resetPlayerKey (data, next) {
  if (!(data && data.uid && data.sender)) return next(new Error('Bad data sent to Registration.resetPlayerKey()'))

  const { uid, sender } = data

  if (uid !== sender) return next(new Error(`Can't reset others' player keys.`))

  // Reset all keys with uid.
  db.sortedSetsRemoveRangeByScore(['playerkey:uid'], uid, uid, err => {
    return next(err)

    getPlayerKey(data, next)
  })
}

// Gets and/or creates the player key.
export function getPlayerKey (data, cb) {
  cb = cb || (() => {
  })

  if (!(data && data.uid)) return cb(new Error('Bad data sent to API.getPlayerKey.'))

  const uid = data.uid

  db.getSortedSetRangeByScore('playerkey:uid', 0, 1, uid, uid, (err, key) => {
    if (err || !key || !key.length) {
      key = Utils.getKey()
      db.sortedSetAdd('playerkey:uid', uid, key)
    } else {
      key = key[0]
    }
    return cb(err, {key})
  })
}
