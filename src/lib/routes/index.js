import { db, SocketPlugins } from '../nodebb'

import * as API from '../api'
import Backend from '../backend'
import Config from '../config'
import {
  eventGetPlayerVotes,
  PlayerVotes
} from '../sockets'
import * as Controllers from '../controllers'
import { getKey, trimUUID } from '../utils'
import Chat from '../chat'
import { resetPlayerKey, register } from '../registration'

export default function (app, middleware, router) {
  // TODO: Add slugs
  // db.sortedSetScore('mi:servers:slugs')

  router.get('/mc/chat', middleware.buildHeader, (req, res) => {
    res.render('mc/chat', {sid: 0})
  })

  router.get('/mc/ranks', middleware.buildHeader, Controllers.renderRanks)
  router.get('/api/mc/ranks', Controllers.renderRanks)

  function render (req, res, next) {
    const variables = Config.cdns[Config.settings.get('avatarCDN')] && Config.cdns[Config.settings.get('avatarCDN')].variables ? Config.cdns[Config.settings.get('avatarCDN')].variables : []
    res.render('admin/plugins/minecraft-integration', { avatar: { variables } })
  }

  router.get('/admin/plugins/minecraft-integration', middleware.admin.buildHeader, render)
  router.get('/api/admin/plugins/minecraft-integration', render)
  router.get('/minecraft-integration/config', (req, res) => {
    res.status(200)
  })

  // Initialize socket namespace
  SocketPlugins.MinecraftIntegration = { }

  // Define API Functions

  function callHTTP (method, respondWith, req, res, next) {
    const data = { }

    for (const param in req.params) {
      data[param] = req.params[param]
    }

    method(data, (err, response) => {
      if (err) {
        console.log(err)
        return res.sendStatus(404)
      }
      switch (respondWith) {
        default:
        case 'JSON':
          res.json(response)
          break
        case 'Buffer':
          if (req.get('If-Modified-Since') === response.modified) {
            res.sendStatus(304)
          } else {
            res.writeHead(200, {
              'Cache-Control': 'private',
              'Last-Modified': response.modified,
              'Content-Type': 'image/png'
            })
            res.end(response.buffer || new Buffer(response.base, 'base64'), 'binary')
          }
          break
        case 'String':
          res.writeHead(200, {
            'Content-Type': 'text/plain'
          })
          res.end(response.base || response, 'binary')
          break
      }
    })
  }

  function addToAPI (method, name, path, respondWith = 'JSON') {
    router.get(`/api/minecraft-integration/${path}`, (req, res, next) => {
      callHTTP(method, respondWith, req, res, next) })

    SocketPlugins.MinecraftIntegration[name] = (socket, data, next) => {
      data.sender = socket.uid
      method(data, next)
    }
  }

  function addToWriteAPI (method, name, path, respondWith = 'JSON') {
    // Write using HTTP.
    if (!!path) {
      // TODO: Should be a PUT request.
      router.get(`/api/minecraft-integration/write/:key/${path}`, (req, res, next) => {
        if (!(req.params && req.params.key)) return res.json(new Error('No API key.'))

        Backend.getSidUsingAPIKey(req.params.key, (err, sid) => {
          if (err) return res.json({error: 'Invalid API key.'})
          if (!sid) return res.json({error: 'Invalid API key.'})

          req.params.sid = sid

          callHTTP(method, respondWith, req, res, next)
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

  // Read API

  addToAPI(Backend.getServers, 'getServers', 'servers')

  addToAPI(API.getServerStatus, 'getServerStatus', 'server/:sid')
  addToAPI(Backend.getRecentPings, 'getRecentPings', 'server/:sid/pings')
  addToAPI(Backend.getRecentPings, 'getRecentPings', 'server/:sid/pings/:last')
  addToAPI(Backend.getServerIcon, 'getServerIcon', 'server/:sid/icon', 'Buffer')
  addToAPI(Backend.getServerPlugins, 'getServerPlugins', 'server/:sid/plugins')

  addToAPI(Chat.getChat, 'getChat', 'server/:sid/chat')
  addToAPI(Chat.getChat, 'getChat', 'server/:sid/chat/:chats')
  addToAPI(Chat.getChat, 'getChat', 'server/:sid/chat/:chats/:max')

  addToAPI(Backend.getAvatars, 'getAvatars', 'avatars')
  addToAPI(Backend.getAvatar, 'getAvatar', 'avatar/:name', 'String')
  addToAPI(Backend.getAvatar, 'getAvatar', 'avatar/:name/:size', 'Buffer')

  // Tracked player objects.
  addToAPI(API.getPlayers, 'getPlayers', 'players')
  addToAPI(API.getPlayer, 'getPlayer', 'players/name/:name')
  addToAPI(API.getPlayer, 'getPlayer', 'players/uuid/:id')
  addToAPI(API.getPlayer, 'getUserPlayers', 'players/uid/:uid')

  addToAPI(API.getUsers, 'getUsers', 'users')
  addToAPI(API.getUser, 'getUser', 'users/uuid/:id')
  addToAPI(API.getUser, 'getUser', 'users/name/:name')

  addToAPI(API.resetPlayerKey, 'resetPlayerKey', 'users/reset/:uid')

  addToAPI(Config.getSettings, 'getSettings', 'settings')
  addToAPI(Config.getSettings, 'getSettings', 'settings/:key')

  addToAPI(API.getPlayerPrefix, 'getPlayerPrefix', 'players/name/:name/prefix')
  addToAPI(API.getUserPrefix, 'getUserPrefix', 'users/uid/:uid/prefix')

  addToAPI(Config.getAvatarUrl, 'getAvatarUrl', 'avatar')

  addToAPI(getKey, 'getKey', 'key')

  addToAPI(Backend.getPlaytimes, 'getPlaytimes', 'playtimes')
  addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top')
  addToAPI(Backend.getTopPlayersByPlaytimes, 'getTopPlayersByPlaytimes', 'playtimes/top/:show')

  // Write API

  addToWriteAPI(API.updateServerStatus, 'eventStatus')

  addToWriteAPI(API.eventPlayerChat, 'eventPlayerChat', 'chat/:id/:name/:message')
  addToWriteAPI(API.eventPlayerJoin, 'eventPlayerJoin', 'join/:id/:name')
  addToWriteAPI(API.eventPlayerQuit, 'eventPlayerQuit', 'quit/:id/:name')
  addToWriteAPI(API.writeOfflinePlayers, 'writeOfflinePlayers', 'offlineplayers')
  addToWriteAPI(API.writeRanks, 'writeRanks', 'ranks')
  addToWriteAPI(API.writeRanksWithMembers, 'writeRanksWithMembers', 'ranks-with-members')

  addToWriteAPI(API.register, 'commandRegister')

  addToWriteAPI(PlayerVotes, 'PlayerVotes')

  // Request API
  SocketPlugins.MinecraftIntegration.eventWebChat = API.eventWebChat
  SocketPlugins.MinecraftIntegration.eventGetPlayerVotes = eventGetPlayerVotes
}
