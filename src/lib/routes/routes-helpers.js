import { db, SocketPlugins } from '../nodebb'

import { trimUUID } from '../utils'

import Backend from '../backend'
import Config from '../config'

import admin from './routes-admin'
import avatars from './routes-avatars'
import chat from './routes-chat'
import players from './routes-players'
import servers from './routes-servers'
import user from './routes-user'

let app, middleware, router

export function init (_app, _middleware, _router) {
  // Add local vars
  app = _app
  middleware = _middleware
  router = _router

  // Initialize socket namespace
  SocketPlugins.MinecraftIntegration = { }

  // Add routes
  admin()
  avatars()
  chat()
  players()
  servers()
  user()
}

// Define API Functions
function callHTTP (method, json, req, res) {
  // TODO
  if (!method) return console.log('No method for ' + req.url)

  method(req.params, (err, response) => {
    if (err) {
      console.log(err)
      return res.sendStatus(404)
    }

    if (json) return res.json(response || '{Success}')
    if (req.get('If-Modified-Since') === response.modified) return res.sendStatus(304)

    res.writeHead(200, {
      'Cache-Control': 'private',
      'Last-Modified': response.modified,
      'Content-Type': 'image/png'
    })
    res.end(response.buffer || new Buffer(response.base, 'base64'), 'binary')
  })
}

export function addAdminRoute (route, controller) {
  router.get(route, middleware.admin.buildHeader, controller)
  router.get(`/api${route}`, controller)
}

export function addUserRoute (route, controller) {
  router.get(route, middleware.buildHeader, controller)
  router.get(`/api${route}`, controller)
}

export function addToAPI (method, name, path, json = true) {
  router.get(`/api/minecraft-integration/${path}`, (req, res, next) => callHTTP(method, json, req, res, next))

  SocketPlugins.MinecraftIntegration[name] = (socket, data, next) => {
    data.sender = socket.uid
    method(data, next)
  }
}

export function addToWriteAPI (method, name, path, json = true) {
  // Write using HTTP.
  if (!!path) {
    router.put(`/api/minecraft-integration/${path}`, (req, res, next) => {
      const { key } = req.body

      if (!key) return res.json(new Error('No API key.'))

      Backend.getSidUsingAPIKey(key, (err, sid) => {
        if (err) return res.json({error: 'Invalid API key.'})

        req.params.sid = sid

        for (let param in req.body) req.params[param] = req.body[param]

        callHTTP(method, json, req, res)
      })
    })
  }

  // Write using sockets.
  SocketPlugins.MinecraftIntegration[name] = (socket, data, next) => {
    if (!(data && data.key)) return next(new Error('No API key.'))

    // TODO: Proper logger.
    // Log.info('Write API connection attempt with key ' + data.key)

    // Verify API key.
    Backend.getSidUsingAPIKey(data.key, (err, sid) => {
      if (err || !sid) {
        // TODO
        console.log(`Invalid API key for ${data.sid}`)
        return next('Invalid API key.', {})
      }

      data.sid = sid

      // If event has a player id, trim it to Mojang's format.
      if (data.id) data.id = trimUUID(data.id)

      // Set the socket.id so that we can send events back to the server.
      db.setObjectField(`mi:server:${data.sid}:config`, 'socketid', socket.id)

      // Detach key from data response.
      delete data.key

      method(data, next)
    })
  }
}