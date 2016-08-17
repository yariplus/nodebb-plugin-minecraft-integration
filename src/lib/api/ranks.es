// Ranks API

import { setRanks, setRanksWithMembers } from '../ranks'

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
