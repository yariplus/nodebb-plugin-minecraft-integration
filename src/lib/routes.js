import { SocketPlugins } from './nodebb'
import { getKey } from './utils'

import {
  init,
  addReadRoute,
} from './routes/routes-helpers'

import * as Controllers from './controllers'
import * as Config from './config'

import {
  eventGetPlayerVotes,
  PlayerVotes,
} from './sockets'

export default function (app, middleware, router) {
  init(app, middleware, router)

  // addReadRoute('server/:sid/settings', 'getSettings', getSettings)
  // addReadRoute('users/uid/:uid/prefix', 'getUserPrefix', getUserPrefix)

  addReadRoute('key', 'getKey', getKey)

  // addToAPI(Backend.getPlaytimes, 'getPlaytimes', 'playtimes')
  // addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top')
  // addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top/:show')

  // addToWriteAPI(Controllers.writeOfflinePlayers, 'writeOfflinePlayers', 'offlineplayers')
  // addToWriteAPI(Controllers.writeRanks, 'writeRanks', 'ranks')
  // addToWriteAPI(Controllers.writeRanksWithMembers, 'writeRanksWithMembers', 'ranks-with-members')

  // addToWriteAPI(API.register, 'commandRegister')

  // addToWriteAPI(PlayerVotes, 'PlayerVotes')

  // Request API
  // SocketPlugins.MinecraftIntegration.eventWebChat = API.eventWebChat
  // SocketPlugins.MinecraftIntegration.eventGetPlayerVotes = eventGetPlayerVotes
}
