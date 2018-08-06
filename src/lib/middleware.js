import { getSidUsingAPIKey, getSidFromSlug } from './servers'
import { db } from './nodebb'
import { trimUUID } from './utils'
import Logger from './logger'

// TODO: Need to add more debug/verbose messages.

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

  Logger.debug(`Socket API connection attempt from ${socket.handshake.address} with API key: ${key}`)

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
  const slug = req.params.slug

  Logger.verbose(`Attempt to get server using slug from ${req.ip} to ${req.url}`)

  if (!slug) return next()
  if (parseInt(slug, 10) == slug) {
    req.params.sid = slug
    return next()
  }

  getSidFromSlug(slug, (err, sid) => {
    if (err) return next(err)

    if (!sid && sid !== 0) {
      return next(new Error('Server not found.'))
    }

    req.params.sid = sid
    next()
  })
}
