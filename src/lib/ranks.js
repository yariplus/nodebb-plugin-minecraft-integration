// Ranks Model

import db from './backend'
import Groups from './nodebb'

export function syncRankGroup (rankName) {
  db.getRankGroup(rankName, (err, groupName) => {
    if (err) return

    if (!groupName) {
      Groups.exists(rankName, (err, exists) => {
        if (err) return

        // If the group doesn't already exist
        if (!exists) {
          db.createRankGroup(rankName)
        } else {
        }
      })
    }
  })
}

export function getRanks (sid, callback) {
  db.getRanks(sid, (err, ranks) => {
    if (err) return callback(err)

    callback(err, ranks.map(rank => { return { name: rank } }))
  })
}

export function getRanksWithMembers (sid, callback) {
  db.getRanksWithMembers(sid, callback)
}

export function setRanks (sid, ranks, callback) {
  if (!(parseInt(sid, 10) >= 0)) callback(new Error('No sid.'))
  if (!ranks) return callback(new Error('No ranks were submitted.'))

  // TODO: assert params
  db.setRanks(sid, ranks, callback)
}

export function setRanksWithMembers (sid, ranks, callback) {
  if (!(parseInt(sid, 10) >= 0)) callback(new Error('No sid.'))
  if (!ranks) return callback(new Error('No ranks were submitted.'))

  // TODO: assert params
  db.setRanksWithMembers(sid, ranks, callback)
}
