import async from 'async'
import { db } from '../nodebb'
import Controller from '../controller'

export function eventWebChat (socket, data, next) {
  if (!(data && data.sid && data.name && data.message)) return next()

  const name = data.name, message = data.message, sid = data.sid

  db.increment(`mi:server:${sid}:cid`, (err, cid) => {
    db.sortedSetAdd(`mi:server:${sid}:cid:time`, Date.now(), cid, err => {
      // TODO: Remove '[WEB]', add variable check.
      db.setObject(`mi:server:${sid}:chat:${cid}`, {name: `[WEB] ${name}`, message}, err => {
        Controller.sendPlayerChatToUsers({sid, chat: {name: `[WEB] ${name}`, message}})
        Controller.sendWebChatToServer({sid, chat: {name, message}})
        next()
      })
    })
  })
}

export function eventPlayerChat (data, next) {
  // Assert parameters.
  if (!(data && data.id && data.name && data.message)) return next()

  const name = data.name, id = data.id, message = data.message, sid = data.sid

  db.increment(`mi:server:${sid}:cid`, (err, cid) => {
    db.sortedSetAdd(`mi:server:${sid}:cid:time`, Date.now(), cid, err => {
      db.setObject(`mi:server:${sid}:chat:${cid}`, {name, message}, err => {
        Controller.sendPlayerChatToUsers({sid, chat: {name, message}})
        next()
      })
    })
  })
}
