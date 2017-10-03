import { db, SocketPlugins } from '../nodebb'

import { trimUUID } from '../utils'

import Config from '../config'

import * as Middleware from '../middleware'

import admin from './routes-admin'
import avatars from './routes-avatars'
import chat from './routes-chat'
import players from './routes-players'
import servers from './routes-servers'
import users from './routes-users'

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
  users()
}

// if (req.get('If-Modified-Since') === response.modified) return res.sendStatus(304)
// res.writeHead(200, {
  // 'Cache-Control': 'private',
  // 'Last-Modified': response.modified,
  // 'Content-Type': 'image/png'
// })
// res.end(response.buffer || new Buffer(response.base, 'base64'), 'binary')

export function addAdminRoute (route, controller) {
  router.get(route, middleware.admin.buildHeader, controller)
  router.get(`/api${route}`, controller)
}

export function addPageRoute (route, controller) {
  router.get(`/minecraft-integration/${route}`, middleware.buildHeader, controller)
  router.get(`/m/${route}`, middleware.buildHeader, controller)
  router.get(`/mc/${route}`, middleware.buildHeader, controller)

  addAPIRoute(route, controller)
}

export function addReadRoute (route, name, controller) {
  addSocketRoute(name, controller)

  const _controller = (req, res) => {
    for (let param in req.params) req.body[param] = req.params[param]

    controller(req.body, (err, data) => {
      res.json(err || data)
    })
  }

  addAPIRoute(route, _controller)
}

export function addSocketRoute (name, controller) {
  SocketPlugins.MinecraftIntegration[name] = (socket, data, next) => controller(data, next)
}

export function addAPIRoute (route, controller) {
  router.get(`/api/minecraft-integration/${route}`, controller)
  router.get(`/api/m/${route}`, controller)
  router.get(`/api/mc/${route}`, controller)
}

export function addProfileRoute (route, controller) {
  router.get(`/user/:user/minecraft${route}`, middleware.buildHeader, controller)
  router.get(`/user/:user/mc${route}`, middleware.buildHeader, controller)
  router.get(`/user/:user/m${route}`, middleware.buildHeader, controller)

  router.get(`/api/user/:user/minecraft${route}`, controller)
  router.get(`/api/user/:user/mc${route}`, controller)
  router.get(`/api/user/:user/m${route}`, controller)
}

export function addWriteRoute (route, name, controller) {
  addWriteAPIRoute(route, controller)
  addWriteSocketRoute(name, controller)
}

export function addWriteAPIRoute (route, controller) {
  let _controller = (req, res) => {
    for (let param in req.params) req.body[param] = req.params[param]

    controller(req.body, (err, data) => {
      res.json(err || data)
    })
  }

  router.post(`/api/minecraft-integration/${route}`, Middleware.writeAPI, _controller)
  router.post(`/api/mc/${route}`, Middleware.writeAPI, _controller)
  router.post(`/api/m/${route}`, Middleware.writeAPI, _controller)
}

export function addWriteSocketRoute (name, method) {
  SocketPlugins.MinecraftIntegration[name] = function (socket, data, next) {
    Middleware.writeSocket.call({method}, socket, data, next)
  }
}
