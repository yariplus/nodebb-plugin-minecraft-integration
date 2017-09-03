import { addToAPI } from './routes-helpers'

import {
  getAvatars,
  getAvatar,
  getHelmAvatar,
  getHead,
  getHelmHead,
  getPocketAvatar,
} from '../api'

export default function () {
  addToAPI(getAvatars, 'getAvatars', 'avatars')

  addToAPI(getAvatar, 'getAvatar', 'avatar/:name', false)
  addToAPI(getAvatar, 'getAvatar', 'avatar/:name/:size', false)

  addToAPI(getHelmAvatar, 'getHelmAvatar', 'helmavatar/:name', false)
  addToAPI(getHelmAvatar, 'getHelmAvatar', 'helmavatar/:name/:size', false)

  addToAPI(getHead, 'getHead', 'helmavatar/:name', false)
  addToAPI(getHead, 'getHead', 'helmavatar/:name/:size', false)

  addToAPI(getPocketAvatar, 'getPocketAvatar', 'pocketavatar/:name', false)
  addToAPI(getPocketAvatar, 'getPocketAvatar', 'pocketavatar/:name/:size', false)
}
