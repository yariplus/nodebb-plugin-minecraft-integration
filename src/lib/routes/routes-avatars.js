import { addAPIRoute } from './routes-helpers'

import {
  getAvatars,
  getAvatar,
  getHelmAvatar,
  getHead,
  getHelmHead,
  getPocketAvatar,
} from '../controllers/controllers-avatars'

export default function () {
  addAPIRoute('avatars', getAvatars)

  addAPIRoute('avatar/:name', getAvatar)
  addAPIRoute('avatar/:name/:size', getAvatar)

  addAPIRoute('helmavatar/:name', getHelmAvatar)
  addAPIRoute('helmavatar/:name/:size', getHelmAvatar)

  addAPIRoute('head/:name', getHead)
  addAPIRoute('head/:name/:size', getHead)

  addAPIRoute('helmhead/:name', getHelmHead)
  addAPIRoute('helmhead/:name/:size', getHelmHead)

  addAPIRoute('pocketavatar/:name', getPocketAvatar)
  addAPIRoute('pocketavatar/:name/:size', getPocketAvatar)
}
