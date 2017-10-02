import { SocketPlugins } from './nodebb'
import { getKey } from './utils'

import {
  init,
  addAdminRoute,
  addPageRoute,
  addRoute,
  addAPIRoute,
  addSocketRoute,
  addProfileRoute,
  addWriteAPIRoute,
  addWriteSocketRoute,
} from './routes/routes-helpers'

import * as Controllers from './controllers'
import * as Config from './config'

import {
  eventGetPlayerVotes,
  PlayerVotes,
} from './sockets'

export default function (app, middleware, router) {
  init(app, middleware, router)

  //addSocketRoute('getSettings', Controllers.getSettings)

  // addToAPI(API.getUserPrefix, 'getUserPrefix', 'users/uid/:uid/prefix')

  // addToAPI(Config.getAvatarUrl, 'getAvatarUrl', 'avatar')

  // addToAPI(getKey, 'getKey', 'key')

  // addToAPI(Backend.getPlaytimes, 'getPlaytimes', 'playtimes')
  // addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top')
  // addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top/:show')

  // addToWriteAPI(Controllers.eventPlayerChat, 'eventPlayerChat', 'chat/:id/:name/:message')
  // addToWriteAPI(Controllers.eventPlayerJoin, 'eventPlayerJoin', 'join/:id/:name')
  // addToWriteAPI(Controllers.eventPlayerQuit, 'eventPlayerQuit', 'quit/:id/:name')
  // addToWriteAPI(Controllers.writeOfflinePlayers, 'writeOfflinePlayers', 'offlineplayers')
  // addToWriteAPI(Controllers.writeRanks, 'writeRanks', 'ranks')
  // addToWriteAPI(Controllers.writeRanksWithMembers, 'writeRanksWithMembers', 'ranks-with-members')

  // addToWriteAPI(API.register, 'commandRegister')

  // addToWriteAPI(PlayerVotes, 'PlayerVotes')

  // Request API
  // SocketPlugins.MinecraftIntegration.eventWebChat = API.eventWebChat
  // SocketPlugins.MinecraftIntegration.eventGetPlayerVotes = eventGetPlayerVotes
}
