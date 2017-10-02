import { addAPIRoute, addPageRoute } from './routes-helpers'

import { chat } from '../controllers/controllers-chat'

export default function () {
  addPageRoute('server/:sid/chat', chat)
  addAPIRoute('server/:sid/chat/:chats', chat)
}
