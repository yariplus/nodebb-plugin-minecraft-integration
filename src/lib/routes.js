import { SocketPlugins } from './nodebb'
import { getKey } from './utils'

import {
  init,
  addToAPI,
  addToWriteAPI,
} from './routes/routes-helpers'

import * as API from './api'
import * as Backend from './backend'
import * as Config from './config'

import {
  eventGetPlayerVotes,
  PlayerVotes
} from './sockets'

export default function (app, middleware, router) {
  init(app, middleware, router)

  addToAPI(API.getUsers, 'getUsers', 'users')
  addToAPI(API.getUser, 'getUser', 'users/uuid/:id')
  addToAPI(API.getUser, 'getUser', 'users/name/:name')

  addToAPI(API.resetPlayerKey, 'resetPlayerKey', 'users/reset/:uid')

  addToAPI(Config.getSettings, 'getSettings', 'settings')
  addToAPI(Config.getSettings, 'getSettings', 'settings/:key')

  addToAPI(API.getPlayerPrefix, 'getPlayerPrefix', 'players/name/:name/prefix')
  addToAPI(API.getUserPrefix, 'getUserPrefix', 'users/uid/:uid/prefix')

  addToAPI(Config.getAvatarUrl, 'getAvatarUrl', 'avatar')

  addToAPI(getKey, 'getKey', 'key')

  addToAPI(Backend.getPlaytimes, 'getPlaytimes', 'playtimes')
  addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top')
  addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top/:show')

  // Write API
  addToWriteAPI(API.updateServerStatus, 'eventStatus', 'status')

  addToWriteAPI(API.eventPlayerChat, 'eventPlayerChat', 'chat/:id/:name/:message')
  addToWriteAPI(API.eventPlayerJoin, 'eventPlayerJoin', 'join/:id/:name')
  addToWriteAPI(API.eventPlayerQuit, 'eventPlayerQuit', 'quit/:id/:name')
  addToWriteAPI(API.writeOfflinePlayers, 'writeOfflinePlayers', 'offlineplayers')
  addToWriteAPI(API.writeRanks, 'writeRanks', 'ranks')
  addToWriteAPI(API.writeRanksWithMembers, 'writeRanksWithMembers', 'ranks-with-members')

  addToWriteAPI(API.register, 'commandRegister')

  addToWriteAPI(PlayerVotes, 'PlayerVotes')

  // Request API
  SocketPlugins.MinecraftIntegration.eventWebChat = API.eventWebChat
  SocketPlugins.MinecraftIntegration.eventGetPlayerVotes = eventGetPlayerVotes
}
