// Ranks API

import { setRanks, setRanksWithMembers } from '../ranks'

export function writeRanks (data, callback) {
  setRanks(data.sid, data.ranks, callback)
}

export function writeRanksWithMembers (data, callback) {
  setRanksWithMembers(data.sid, data.ranks, callback)
}
