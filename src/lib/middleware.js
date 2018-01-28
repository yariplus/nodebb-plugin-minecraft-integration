import { getSidUsingAPIKey, getSidFromSlug } from './servers'
import { db } from './nodebb'
import { trimUUID } from './utils'
import Logger from './logger'

export function writeAPI (req, res, next) {
  const { key } = req.body

  if (!key) return res.json(new Error('No API key.'))

  getSidUsingAPIKey(key, (err, sid) => {
    if (err) return res.json(new Error('Invalid API key.'))
    req.body.sid = sid
    next()
  })
}

export function writeSocket (socket, data, next) {
  if (!data) return next(new Error('No Data.'))

  const { key } = data

  if (!key) return next(new Error('No API key.'))

  Logger.debug(`Write API connection attempt from ${socket.handshake.address} with API key: ${key}`)

  getSidUsingAPIKey(key, (err, sid) => {
    if (err) return next(new Error('Invalid API key.'))
    data.sid = sid

    // If event has a player id, trim it to Mojang's format.
    if (data.id) data.id = trimUUID(data.id)

    // Set the socket.id so that we can send events back to the server.
    db.setObjectField(`mi:server:${data.sid}:config`, 'socketid', socket.id)

    // Detach key from data response.
    delete data.key

    this.method(data, next)
  })
}

export function sidFromSlug (req, res, next) {
  if (!req.params.slug) next()

  getSidFromSlug(req.params.slug, (err, sid) => {
    if (err) return next(err)
    if (!sid && sid !== 0) return next(new Error('Server not found.'))
    req.params.sid = sid
    next()
  })
}
