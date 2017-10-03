import {
  db,
} from '../nodebb'

import Config from '../config'

export function renderAdminPage (req, res) {
  const variables = Config.cdns[Config.settings.get('avatarCDN')] && Config.cdns[Config.settings.get('avatarCDN')].variables ? Config.cdns[Config.settings.get('avatarCDN')].variables : []
  res.render('admin/plugins/minecraft-integration', { avatar: { variables } })
}

export function renderServerEditor (req, res) {
  res.render('admin/plugins/mi-servereditor', {})
}

export function setServerConfig (data, next) {
  let { sid, config } = data

  // TODO: Score is used for sorting server list.
  db.sortedSetAdd(`mi:servers`, Date.now(), sid)

  db.delete(`mi:server:${sid}:config`, () => {
    db.setObject(`mi:server:${sid}:config`, config, next)
  })
}
