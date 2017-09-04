import { addToAPI } from './routes-helpers'

import { getChat } from '../chat'

export default function () {
  addToAPI(getChat, 'getChat', 'server/:sid/chat')
  addToAPI(getChat, 'getChat', 'server/:sid/chat/:chats')
  addToAPI(getChat, 'getChat', 'server/:sid/chat/:chats/:max')
}
