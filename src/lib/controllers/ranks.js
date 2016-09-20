// Ranks Controller

import { getRanks, getRanksWithMembers } from '../ranks'

export function renderRanks (req, res) {
  getRanksWithMembers(req.sid || '0', (err, ranks) => {
    res.render('minecraft-integration/ranks', {ranks: ranks})
  })
}
