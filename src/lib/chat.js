import { async, db } from './nodebb'

import { sendPlayerChatToUsers } from './sockets'

export function getChats (sid, amount, next) {
  // Gets the highest (most recent) chats.
  db.getSortedSetRevRange(`mi:server:${sid}:chat`, 0, amount, (err, dates) => {
    if (err) return console.log(err)

    async.map(dates, (date, next) => {
      next(null, `mi:server:${sid}:chat:${date}`)
    }, (err, keys) => {
      keys.reverse()

      db.getObjects(keys || [], (err, chats) => {
        next(null, {sid, chats})
      })
    })
  })
}

export const getChat = getChats

export function createPlayerChat (sid, id, name, message, date, next) {
  async.waterfall([
    async.apply(db.sortedSetAdd, `mi:server:${sid}:chat`, date, date),
    async.apply(db.setObject, `mi:server:${sid}:chat:${date}`, {id, name, message, date}),
  ], err => {
    if (err) return next(err)

    sendPlayerChatToUsers({sid, chat: {name, message}})

    next(err)
  })
}
