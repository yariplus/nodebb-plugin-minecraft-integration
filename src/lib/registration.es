import { getPlayerKeyUID, resetPlayerKey as resetKey } from './api'
import { db } from './nodebb'
import Backend from './backend'
import Utils from './utils'
import async from 'async'

export function register (data, next) {

  // Assert parameters.
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
      async.apply(db.setObjectField, `yuuid:${id}`, 'prefix', prefix),
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

export function resetPlayerKey (data, next) {
  if (!(data && data.uid && data.sender)) return next(new Error('Bad data sent to Registration.resetPlayerKey()'))

  const { uid, sender } = data

  if (uid !== sender) return next(new Error(`Can't reset others' player keys.`))

  resetKey({uid}, next)
}
