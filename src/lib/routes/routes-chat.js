import { addAPIRoute, addPageRoute, addWriteRoute, addSocketRoute, } from './routes-helpers'

import { chat, web, playerChat } from '../controllers/controllers-chat'

export default function () {
  addPageRoute('sid/:sid/chat', chat)
  addPageRoute('server/:serverslug/chat', chat)

  addAPIRoute('sid/:sid/chat/:chats', chat)
  addAPIRoute('server/:serverslug/chat/:chats', chat)

  addWriteRoute('sid/:sid/chat', 'eventPlayerChat', playerChat)
  addWriteRoute('server/:serverslug/chat', 'eventPlayerChat', playerChat)

  addSocketRoute('eventWebChat', web)
}
