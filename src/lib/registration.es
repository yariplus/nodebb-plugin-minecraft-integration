const Registration = module.exports = {}
import { getPlayerKeyUID, resetPlayerKey } from './api'
import NodeBB from './nodebb'
import Backend from './backend'
import Utils from './utils'
import async from 'async'

Registration.register = (data, next) => {

  // Assert parameters.
  if (!(data && data.id && data.name && data.pkey)) return next(new Error('FAILDATA'))

  // Local vars.
  const sid = data.sid, id = data.id, name = data.name, key = data.pkey

  console.log(`Got "/register" command from Minecraft server ${sid}.
Player ${data.name} is attempting to register with player key ${key}`)

  getPlayerKeyUID({key, name}, (err, uid) => {
    if (err || !uid) {
      return next(new Error('FAILKEY'))
    }

    async.parallel([
      // TODO: Create an account renaming option.

      // Link the accounts.
      async.apply(Backend.linkUuidtoUid, id, uid),

      // Change the register key.
      async.apply(resetPlayerKey, {uid})
    ], err => {
      if (err) {
        console.log(`Register err for UID ${uid}: ${err}`)
        next(new Error('FAILDB'))
      }else {
        console.log(`Set the Minecraft UUID for UID ${uid} to ${id}`)
        next(null, {result: 'REGISTER'})
      }
    })
  })
}

Registration.resetPlayerKey = (data, next) => {
  if (!(data && data.uid && data.sender)) return next(new Error('Bad data sent to Registration.resetPlayerKey()'))
  if (!(data.uid === data.sender)) return next(new Error("Can't reset others' player keys."))

  resetPlayerKey({uid: data.uid}, next)
}
