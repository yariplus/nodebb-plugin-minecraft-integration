// Ranks Controller

import { getRanks, getRanksWithMembers } from '../ranks'

export function renderRanks (req, res) {
  getRanksWithMembers(req.sid || '0', (err, ranks) => {
    res.render('minecraft-integration/ranks', {ranks: ranks})
  })
}


export function writeRanks (data, callback) {
  setRanks(data.sid, data.ranks, err => {
    if (err) console.log(err)
    callback(err)
  })
}

export function writeRanksWithMembers (data, callback) {
  console.log('Got writeRanksWithMembers()')
  console.log(data)
  setRanksWithMembers(data.sid, data.ranks, err => {
    if (err) console.log(err)
    callback(err)
  })
}
