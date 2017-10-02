// TODO: Move to controllers.

import {
  deleteUser,
  refreshUser,
  resetUsers,
} from './users'

import {
  deleteAvatar,
  refreshAvatar,
  resetAvatars,
} from './avatars'

import {
  deleteServer,
  setServerConfig,
  getServersConfig,
} from './servers'

import {
  deletePlayer,
} from './players'

import {
  winston,
  SocketAdmin
} from './nodebb'

import {
  getAvatarCDN,
} from './config'

export default function () {
  // Settings
  SocketAdmin.settings.syncMinecraftIntegration = () => {
    Config.settings.sync(() => {
      Config.logSettings()
    })
  }

  SocketAdmin.settings.resetMinecraftIntegration = () => {
    Config.settings.reset(Config.logSettings)
  }

  // ACP
  SocketAdmin.MinecraftIntegration = { }

  function addAdminSocket (name, func) {
    SocketAdmin.MinecraftIntegration[name] = (socket, data, next) => {
      func(data, (err, data) => {
        if (err) winston.error(err)
        next(err, data)
      })
    }
  }

  addAdminSocket('setServerConfig', setServerConfig)
  addAdminSocket('getServersConfig', getServersConfig)
  addAdminSocket('deleteUser', deleteUser)
  addAdminSocket('refreshUser', refreshUser)
  addAdminSocket('resetUsers', resetUsers)
  addAdminSocket('deleteAvatar', deleteAvatar)
  addAdminSocket('refreshAvatar', refreshAvatar)
  addAdminSocket('resetAvatars', resetAvatars)
  addAdminSocket('deletePlayer', deletePlayer)
  // Uses fetchPlayer instead. addAdminSocket('refreshPlayer', Backend.refreshPlayer)
  // Doesn't exist. addAdminSocket('resetPlayers', Backend.resetPlayers)
  addAdminSocket('deleteServer', deleteServer)
  addAdminSocket('getAvatarCDN', getAvatarCDN)
}

export function buildAdminHeader (custom_header, next) {
  custom_header.plugins.push({
    'route': '/plugins/minecraft-integration',
    'icon': 'fa-cube',
    'name': 'Minecraft Integration'
  })

  return next(null, custom_header)
}
