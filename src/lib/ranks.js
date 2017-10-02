// Ranks Model

// TODO: Move to servers

import { Groups, db } from './nodebb'

export function getServerRanks (sid, next) {
  db.getSortedSetRange(`mi:server:${sid}:ranks`, 0, -1, (err, ranks) => {
    if (err) return next(err)

    next(err, ranks.map(rank => { return { name: rank } }))
  })
}

export function getRankMembers (sid, rank, page, count, callback) {
  const key = `mi:server:${sid}:rank:${rank}:members`

  if (typeof page === 'function') {
    callback = page
    page = 0
    count = 10000000
  }

  db.getSortedSetRangeByLex(key, '-', '+', page * count, count, callback)
}

// Set all ranks on a server.
export function setRanks (sid, ranks, callback) {
  if (!(parseInt(sid, 10) >= 0)) callback(new Error('No sid.'))
  if (!ranks) return callback(new Error('No ranks were submitted.'))

  const key = `mi:server:${sid}:ranks`

  async.waterfall([
    async.apply(db.delete, key),
    async.apply(async.each, ranks, (rank, next) => {
      db.sortedSetAdd(key, rank.rank || 0, rank.name, next)
    })
  ], (err) => {
    callback(err)
  })
}

export function setRank (rid, rank, callback) {
  // db.setObject(`mi:rank:${rid}`, rank, callback)
}

export function setServerRank (sid, rankObj, callback) {
  if (!rankObj.name) return callback(new Error('setServerRank(): Invalid Server Rank name.'))
  async.parallel([
    async.apply(db.setAdd, `mi:server:${sid}:ranks`, rankObj.name),
    async.apply(db.setObject, `mi:server:${sid}:rank:${rankObj.name}`, rankObj)
  ], callback)
}

export function getServerRank (sid, rankName, callback) {
  db.getObject(`mi:server:${sid}:rank:${rankName}`, callback)
}

export function getServerRankPrefix (sid, rankName, callback) {
  db.getObjectField(`mi:server:${sid}:rank:${rankName}`, 'prefix', callback)
}

export function getServerRankRank (sid, rankName, callback) {
  db.getObjectField(`mi:server:${sid}:rank:${rankName}`, 'prefix', callback)
}

export function addRankGroup (callback) {
  db.getSortedSetRange('mi:groups:rank', 0, -1, callback)
}

export function setRankGroup (group, callback) {
  // db.getSortedSetRange(`group:${group}`)
  // db.setObjectField(`mi:rank:${rid}`, 'group', group, callback)
  callback()
}

export function deleteRankGroup (group, callback) {
  callback()
}

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

export function getRanksWithMembers (sid, callback) {
  const key = `mi:server:${sid}:ranks`

  if (typeof page === 'function') {
    callback = page
    page = 0
    count = 10000000
  }

  let data = []

  async.waterfall([
    async.apply(getRanks, sid),
    (ranks, next) => {
      async.each(ranks, (rank, next) => {
        getRankMembers(sid, rank, page, count, (err, members) => {
          if (err) return next(err)
          data.push({
            name: rank,
            members: members.map(member => { return { id: member } })
          })
          next()
        })
      }, next)
    }
  ], (err) => {
    callback(err, data)
  })
}

export function setRanksWithMembers (sid, ranks, callback) {
  if (!(parseInt(sid, 10) >= 0)) callback(new Error('No sid.'))
  if (!ranks) return callback(new Error('No ranks were submitted.'))

  // TODO: assert params
  async.waterfall([
    async.apply(setRanks, sid, ranks),
    async.apply(async.each, ranks, (rank, next) => {
      const key = `mi:server:${sid}:rank:${rank.name}:members`

      db.delete(key, () => {
        async.each(rank.members, (member, next) => {
          db.sortedSetAdd(key, 0, `${member.id}:${member.name}`, next)
        }, next)
      })
    })
  ], callback)
}
