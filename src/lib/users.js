// Users Modal
// Methods related to forum users.

import {
  db,
} from './nodebb'

import {
  getUuidFromName,
  getUuidsFromUid,
} from './players'

// Get all users with a linked player.
export function getLinkedUsers (options, next) {
  const fields = ['uid', 'username', 'yuuid', 'picture']

  if (options.fields && Array.isArray(options.fields)) {
    for (let i = 0; i < options.fields.length; i++) {
      if (typeof options.fields[i] === 'string') fields.push(options.fields[i])
    }
  }

  db.getSortedSetRevRange('mi:uid:linked', 0, -1, (err, uids) => {
    User.getUsersFields(uids, fields, (err, usersData) => {
      async.map(usersData, (userData, next) => {
        getUuidsFromUid(userData.uid, (err, uuids) => {
          if (err || !uuids) return next(null, userData) // TODO: Remove from sortedset if links are missing from db.
          Backend.getPlayersFromUuids(uuids, (err, players) => {
            userData.players = players.map(player => {
              if (player.id === userData.yuuid) player.isPrimary = true
              return player
            })
            next(null, userData)
          })
        })
      }, next)
    })
  })
}

export function getUsersFromName (name, next) {
  getUuidFromName(name, (err, uuid) => {
    
  })
}

export function getUsersFromUuid () {
}

// Get the primary linked user from uid, yuuid, or name.
export function getUserFromName (name, next) {
  // Convert name to uuid if needed.
  if (options.id) {
    getUserFromUuid(options.id, options.extraFields, next)
  } else if (options.name) {
    Backend.getPlayerFromName(options.name, (err, profile) => {
      if (err || !profile) return next(err, profile)
      getUserFromUuid(profile.id, options.extraFields, next)
    })
  }
}

// Get the primary user of the UUID.
function getUserFromUuid (id, extraFields, next) {
  // Get primary user.
  db.getObjectField(`yuuid:${id}`, 'uid', (err, uid) => {
    if (err || !uid) return next(err)
    User.getUserData(uid, (err, userData) => {
      if (err || !userData) return next(err)
      // Backend.getPlayerFromUuid(id, function (err, player) {
      // if (err || !player) return next(err)

      // TEMP
      // player.user = undefined
      // userData.player = player
      // next(null, userData)
      // })
      next(null, userData)
    })
  })
}

// Remove all links to this user.
export function resetUserLinks (data, next) {
  if (!data || !data.uid) return next(new Error('No uid'))

  const uid = parseInt(data.uid, 10)

  // TODO
}

// Get the prefix from the a user's primary linked player.
export function getUserPrefix (data, next) {
  if (!(data && data.uid)) return next(new Error('Invalid params sent to API.getUserPrefix'))
  Backend.getPrimaryUuid(data.uid, (err, uuid) => {
    if (err || !uuid) return next(err)
    Backend.getPlayerPrefix(uuid, next)
  })
}

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
      async.apply(resetPlayerKey, {uid, sender: uid}),

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
    if (err) return next(err)

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
      key = getKey()
      db.sortedSetAdd('playerkey:uid', uid, key)
    } else {
      key = key[0]
    }
    return cb(err, {key})
  })
}
