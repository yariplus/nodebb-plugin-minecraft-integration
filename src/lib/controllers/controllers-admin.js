import {
  db,
  async,
} from '../nodebb'

import { setSlug, isValidSlug, } from '../servers'

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

  async.waterfall([
    next => isValidSlug(sid, config.slug, next),
    next => db.delete(`mi:server:${sid}:config`, (err) => next(err)),
    next => db.setObject(`mi:server:${sid}:config`, config, (err) => next(err)),
    next => setSlug(sid, config.slug, (err) => next(err)),
    next => db.sortedSetAdd(`mi:servers`, Date.now(), sid, next),
  ], next)
}
