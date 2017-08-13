import { addToAPI } from './routes-helpers'

import Chat from '../chat'

export default function () {
  addToAPI(Chat.getChat, 'getChat', 'server/:sid/chat')
  addToAPI(Chat.getChat, 'getChat', 'server/:sid/chat/:chats')
  addToAPI(Chat.getChat, 'getChat', 'server/:sid/chat/:chats/:max')
}
