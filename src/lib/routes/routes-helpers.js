import { db, SocketPlugins } from '../nodebb'

import { trimUUID } from '../utils'

import Config from '../config'

import * as Middleware from '../middleware'

import admin from './routes-admin'
import avatars from './routes-avatars'
import chat from './routes-chat'
import integration from './routes-integration'
import players from './routes-players'
import servers from './routes-servers'
import users from './routes-users'

let app, middleware, router

// TODO: Settings for custom url prefixes.
let prefixes = [ 'm', 'mc', 'minecraft', 'minecraft-integration' ]

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
  integration()
  players()
  servers()
  users()
}

export function addAdminRoute (route, controller) {
  router.get(route, middleware.admin.buildHeader, controller)
  router.get(`/api${route}`, controller)
}

export function addGetRoute (route, controller) {
  prefixes.forEach(prefix => router.get(`/${prefix}/${route}`, middleware.buildHeader, controller))
}

export function addPageRoute (route, controller) {
  addGetRoute(route, controller)
  addAPIRoute(route, controller)
}

export function addReadRoute (route, name, controller) {
  addSocketRoute(name, controller)

  const _controller = (req, res) => {
    for (let param in req.params) req.body[param] = req.params[param]

    controller(req.body, (err, data) => res.json(err || data))
  }

  addAPIRoute(route, _controller)
}

export function addSocketRoute (name, controller) {
  SocketPlugins.MinecraftIntegration[name] = (socket, data, next) => controller({...data, socket}, next)
}

export function addAPIRoute (route, controller) {
  prefixes.forEach(prefix => router.get(`/api/${prefix}/${route}`, controller))
}

export function addProfileRoute (route, controller) {
    router.get(`/user/:userslug/${route}`, middleware.buildHeader, controller)
    router.get(`/api/user/:userslug/${route}`, controller)
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

  prefixes.forEach(prefix => router.post(`/api/${prefix}/${route}`, Middleware.writeAPI, _controller))
}

export function addWriteSocketRoute (name, method) {
  SocketPlugins.MinecraftIntegration[name] = function (socket, data, next) {
    Middleware.writeSocket.call({method}, socket, data, next)
  }
}
