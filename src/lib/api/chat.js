import { async, db } from '../nodebb'

import { sendWebChatToServer } from '../sockets'
import { createPlayerChat } from '../chat'

// TODO: This is essentially the same as the below, but it should send the chat to the server and get a callback before sending to users.
export function eventWebChat (socket, data, next) {
  // Assert parameters.
  if (!(data && data.sid && data.id && data.name && data.message)) return next()

  let { sid, id, name, message, date } = data

  date = date || Date.now()

  sendWebChatToServer({sid, chat: {name, message}})

  createPlayerChat(sid, 'uuid', name, message, date, next)
}

export function eventPlayerChat (data, next) {
  // Assert parameters.
  if (!(data && data.sid && data.id && data.name && data.message)) return next()

  let { sid, id, name, message, date } = data

  // TODO: Need to get the date added to the minecraft plugin.
  date = date || Date.now()

  // TODO: Need to set the DisplayName for chat messages.

  createPlayerChat(sid, id, name, message, date, next)
}
