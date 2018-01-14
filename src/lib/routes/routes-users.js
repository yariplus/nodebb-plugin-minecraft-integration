import { async, db, User } from '../nodebb'

import Config from '../config'
import Updater from '../updater'
import Utils from '../utils'

import {
  addPageRoute,
  addProfileRoute,
  addWriteRoute,
} from './routes-helpers'

import {
  users,
  user,
  profile,
  ranks,
  chat,
} from '../controllers/controllers-users'

import { register } from '../users'

export default function () {
  addProfileRoute('minecraft', profile)

  addPageRoute('ranks', ranks)
  addPageRoute('chat', chat)

  addPageRoute('users', users)
  addPageRoute('users/uuid/:id', user)
  addPageRoute('users/name/:name', user)
}
