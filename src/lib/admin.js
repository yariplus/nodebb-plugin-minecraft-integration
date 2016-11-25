import { deleteUser, refreshUser, resetUsers } from './api'
import { SocketAdmin } from './nodebb'
import Backend from './backend'
import Utils from './utils'
import Config from './config'
import winston from 'winston'

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

  addAdminSocket('setServerConfig', Backend.setServerConfig)
  addAdminSocket('getServersConfig', Backend.getServersConfig)
  addAdminSocket('deleteUser', deleteUser)
  addAdminSocket('refreshUser', refreshUser)
  addAdminSocket('resetUsers', resetUsers)
  addAdminSocket('deleteAvatar', Backend.deleteAvatar)
  addAdminSocket('refreshAvatar', Backend.refreshAvatar)
  addAdminSocket('resetAvatars', Backend.resetAvatars)
  addAdminSocket('deletePlayer', Backend.deletePlayer)
  // Uses fetchPlayer instead. addAdminSocket('refreshPlayer', Backend.refreshPlayer)
  // Doesn't exist. addAdminSocket('resetPlayers', Backend.resetPlayers)
  addAdminSocket('deleteServer', Backend.deleteServer)
  addAdminSocket('getAvatarCDN', Config.getAvatarCDN)
}

export function buildAdminHeader (custom_header, next) {
  custom_header.plugins.push({
    'route': '/plugins/minecraft-integration',
    'icon': 'fa-cube',
    'name': 'Minecraft Integration'
  })

  return next(null, custom_header)
}
