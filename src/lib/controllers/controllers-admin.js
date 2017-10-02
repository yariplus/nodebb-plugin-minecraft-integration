import Config from '../config'

export function renderAdminPage (req, res) {
  const variables = Config.cdns[Config.settings.get('avatarCDN')] && Config.cdns[Config.settings.get('avatarCDN')].variables ? Config.cdns[Config.settings.get('avatarCDN')].variables : []
  res.render('admin/plugins/minecraft-integration', { avatar: { variables } })
}

export function renderServerEditor (req, res) {
  res.render('admin/plugins/mi-servereditor', {})
}
