import { addAPIRoute, addPageRoute, addWriteRoute } from './routes-helpers'

import { chat, playerChat } from '../controllers/controllers-chat'

export default function () {
  addPageRoute('server/:sid/chat', chat)
  addAPIRoute('server/:sid/chat/:chats', chat)
  addWriteRoute('server/:sid/chat', 'eventPlayerChat', playerChat)
}
