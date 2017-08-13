import { addUserRoute } from './routes-helpers'

import {
  renderMinecraftProfile,
  redirectRegister,
  renderRanks,
  renderServerChat,
} from '../controllers'

export default function () {
  addUserRoute('/user/:user/minecraft', renderMinecraftProfile)
  addUserRoute('/minecraft/register', redirectRegister)
  addUserRoute('/mc/register', redirectRegister)
  addUserRoute('/mc/ranks', renderRanks)
  addUserRoute('/mc/chat', renderServerChat)
}
