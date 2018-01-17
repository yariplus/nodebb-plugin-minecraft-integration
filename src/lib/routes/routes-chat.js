import { addAPIRoute, addPageRoute, addWriteRoute, addSocketRoute, } from './routes-helpers'

import { chat, web, playerChat } from '../controllers/controllers-chat'

export default function () {
  addPageRoute('server/:sid/chat', chat)
  addAPIRoute('server/:sid/chat/:chats', chat)
  addWriteRoute('server/:sid/chat', 'eventPlayerChat', playerChat)
  addSocketRoute('eventWebChat', web)
}
