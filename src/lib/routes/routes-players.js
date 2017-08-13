import { addToAPI } from './routes-helpers'

import * as API from '../api'

export default function () {
  addToAPI(API.getPlayers, 'getPlayers', 'players')
  addToAPI(API.getPlayer, 'getPlayer', 'players/name/:name')
  addToAPI(API.getPlayer, 'getPlayer', 'players/uuid/:id')
  addToAPI(API.getPlayer, 'getUserPlayers', 'players/uid/:uid')
}
