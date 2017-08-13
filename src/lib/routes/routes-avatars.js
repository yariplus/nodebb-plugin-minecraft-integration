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

  addToAPI(getAvatar, 'getAvatar', 'avatar/:name', 'buffer')
  addToAPI(getAvatar, 'getAvatar', 'avatar/:name/:size', 'buffer')

  addToAPI(getHelmAvatar, 'getHelmAvatar', 'helmavatar/:name', 'buffer')
  addToAPI(getHelmAvatar, 'getHelmAvatar', 'helmavatar/:name/:size', 'buffer')

  addToAPI(getHead, 'getHead', 'helmavatar/:name', 'buffer')
  addToAPI(getHead, 'getHead', 'helmavatar/:name/:size', 'buffer')

  addToAPI(getPocketAvatar, 'getPocketAvatar', 'pocketavatar/:name')
  addToAPI(getPocketAvatar, 'getPocketAvatar', 'pocketavatar/:name/:size')
}
