import { addPageRoute, addSocketRoute } from './routes-helpers'

import {
  player,
  seen,
  user,
} from '../controllers/controllers-players'

export default function () {
  addPageRoute('players/seen/:time', seen)
  addPageRoute('players/name/:name', player)
  addPageRoute('players/uuid/:id', player)
  addPageRoute('players/uid/:uid', user)

  //addSocketRoute(API.getPlayerPrefix, 'getPlayerPrefix', 'players/name/:name/prefix')
}
