import async from 'async'
import request from 'request'

import { db } from './nodebb'

import Backend from './backend'
import Config from './config'

// Get the avatar base64 from the database.
export function getAvatar (name, callback) {
  // Database keys used.
  const keyBase = `mi:avatar:${name}`
  const keySorted = 'mi:avatars'

  // Store a fetched avatar binary as base64 and update fetch time.
  function storeAvatar (avatar, next) {
    // Convert buffer to a base64.
    avatar = avatar.toString('base64')

    // Update the avatar fetch time.
    db.sortedSetAdd(keySorted, Date.now(), name)

    // Set base64.
    db.set(keyBase, avatar, err => next(err, avatar))
  }

  // Get fetch time.
  // If old or null, Fetch avatar and update fetch time.
  // If different, Set modified.
  async.parallel({
    base: async.apply(db.get, keyBase),
    modified: async.apply(db.sortedSetScore, keySorted, name),
  }, (err, results) => {
    if (err) return callback(err)

    let { base, modified } = results
    let buffer

    if (!base && pocket) return next(new Error(`Pocketmine didn't send avatar data.`))

    async.waterfall([
      next => {
        if (!base || !modified || Date.now() - modified > 1000 * 60 * 10) return fetchAvatar(name, next)
        next(null, false)
      },
      (_buffer, next) => {
        if (_buffer) {
          buffer = _buffer || new Buffer(base, 'base64')
          storeAvatar(buffer, next)
        } else {
          next(null, base)
        }
      },
      (_base, next) => {
        base = _base
        modified = modified ? new Date(modified).toUTCString() : new Date().toUTCString()
        next()
      }
    ], err => {
      console.dir({err, data: {
        buffer,
        base,
        modified,
      }})
      callback(err, {
        buffer,
        base,
        modified,
      })
    })
  })
}

export function getPocketAvatar (name, callback) {
  // Database keys used.
  const keyBase = `mi:pocketavatar:${name}`
  const keySorted = 'mi:pocketavatars'

  async.parallel({
    base: async.apply(db.get, keyBase),
    modified: async.apply(db.sortedSetScore, keySorted, name),
  }, (err, results) => {
    if (err) return callback(err)

    const { base } = results

    callback(base ? null : new Error(`Pocketmine didn't send avatar data.`), results)
  })
}

// Gets the avatar from the configured cdn.
function fetchAvatar (name, next) {
  async.parallel({
    url: async.apply(Config.getAvatarUrl, {name}), // The full url for the avatar.
    id: async.apply(Backend.getUuidFromName, name) // We need this for cdns that use uuids.
  }, (err, payload) => {
    if (err) return next(err)

    const url = payload.url.replace('{uuid}', payload.id)

    console.log(`Fetching avatar from CDN: ${url}`)

    async.waterfall([
      async.apply(request, {url, encoding: null}),
      async.apply(transform)
    ], (err, avatar) => {
      if (err) {
        console.log(`Could not retrieve skin using the cdn: ${Config.settings.get('avatarCDN')}`)
        if (Config.settings.get('avatarCDN') === 'mojang') return next(null, Config.steveBuffer)
        console.log('Defaulting to Mojang skin.')
        console.log(`Fetching avatar from CDN: http://skins.minecraft.net/MinecraftSkins/${name}.png`)

        // Try Mojang
        async.waterfall([
          async.apply(request, {url: `http://skins.minecraft.net/MinecraftSkins/${name}.png`, encoding: null}),
          (response, body, next) => {
            Config.cdns['mojang'].transform(body, 32, next)
          }
        ], (err, avatar) => {
          if (err) {
            console.log("Couldn't connect to Mojang skin server.")

            return next(null, Config.steveBuffer)
          } else {
            next(null, new Buffer(avatar))
          }
        })
      } else {
        next(null, new Buffer(avatar))
      }
    })
  })
}

function transform (response, body, next) {
  const cdn = Config.settings.get('avatarCDN')

  if (Config.cdns[cdn] && Config.cdns[cdn].transform) {
    Config.cdns[cdn].transform(body, Config.settings.get('avatarVariables.size') || 32, next)
  } else {
    next(null, body)
  }
}
