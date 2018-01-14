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

export function getPlayerKeyUID (data, cb) {
  if (!(data && data.key)) return cb(new Error('Bad data sent to Backend.getPlayerKeyUID.'))

  db.sortedSetScore('playerkey:uid', data.key, (err, uid) => {
    if (err || !uid) err = err || new Error('FAILKEY')

    return cb(err, uid)
  })
}
