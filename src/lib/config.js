// TODO: This module sucks.

import { Settings } from './nodebb'

// Nearest-neighbour algorithm.
function resize (image, width, height, next) {
  const result = new jimp(width, height)
  const _width = image.bitmap.width
  const _height = image.bitmap.height
  const x_ratio = _width / width
  const y_ratio = _height / height
  const pixels = []
  let px, py

  image.scan(0, 0, _width, _height, (x, y, idx) => {
    pixels.push(image.getPixelColor(x, y))
  })

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      px = Math.floor(j * x_ratio)
      py = Math.floor(i * y_ratio)
      result.setPixelColor(pixels[Math.floor((py * _height) + px)], j, i)
    }
  }

  next(null, result)
}

const Config = module.exports = {
  cdns: {
    mojang: {
      url: 'http://skins.minecraft.net/MinecraftSkins/{name}.png',
      variables: {
        size: { name: "Size", number: true, default: 32 },
        style: { name: "Style", select: true, values: {
          avatar: { name: "Flat Head", default: true }
        }}
      },
      transform (buffer, size, next) {
        jimp.read(buffer, (err, image) => {
          if (err) return next(err)
          image.crop(8, 8, 8, 8, (err, image) => {
            resize(image, size, size, (err, image) => {
              image.getBuffer(jimp.MIME_PNG, next)
            })
          })
        })
      }
    },
    brony: {
      url: 'http://minelpskins.voxelmodpack.com/skins/{uuid}.png',
      variables: {
        size: { name: "Size", number: true, default: 32 },
        style: { name: "Style", select: true, values: {
          avatar: { name: "Flat Head", default: true }
        }}
      },
      transform (buffer, size, next) {
        jimp.read(buffer, (err, image) => {
          if (err) return next(err)

          const scale = image.bitmap.width / 8

          const face = image.clone().crop(scale, scale, scale, scale)
          const hair = image.crop(scale * 5, scale, scale, scale)

          face.composite(hair, 0, 0)

          resize(face, size, size, (err, face) => {
            face.getBuffer(jimp.MIME_PNG, next)
          })
        })
      }
    },
    cravatar: {
      url: 'http://cravatar.eu/{style}/{name}/{size}',
      variables: {
        size: { name: "Size", number: true, default: 32 },
        style: { name: "Style", select: true, values: {
          avatar: { name: "Flat Head" },
          helmavatar: { name: "Flat Head with Helm", default: true },
          head: { name: "Perspective Head" },
          helmhead: { name: "Perspective Head with Helm" }
        }}
      }
    },
    minotar: {
      url: 'http://minotar.net/avatar/{name}/{size}',
      variables: {
        size: { name: "Size", number: true, default: 32 }
      }
    }
  },
  steve: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90KBgcJNY+Ri8MAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAABgklEQVRo3u2aPUvDUBSGkyZpquLHZB0E3R3UvXQUP0bdHQo6+BNEV0VxcRHEydEiDjp06tBZB1eF+kFRO5RCqZa0SeMfeDIEjCK8Z3zuzb15wuGcXBJzdnrYoPD7iA3bTCH3Ap/X8QPkqRSv49gW8jDk++FV/lFIQAISkMDfhh1V76PCD/mCoUwa+WjaRB4YXO8bbY/nh4FSSAISkIAEEugDUQOHW+vIXYfr/UBmBHnns8UbWPzsmh9vyPevSkohCUhAAhL4+TAvdjZwYNB1kX95/L5uWTy/2Woin8qOI395flAKSUACEpDAL54Hour9yvYx8tX8AfJCvhqr3p/cZJFfVo6QF3c3lUISkIAEJJDAeeCssIAD2YlJbhzuGPLrcjnWxmuLOeS110fk1XpDKSQBCUhAAgmcB9o9/v7arfH7fbFyi3xpZj7Wxnun58iXc3PcsAxHKSQBCUhAAgn0gaf3Og70+/F+JCrd3yG3HDvWOu0O9yWv11UKSUACEpDAz8c3YzNWaIbjJFkAAAAASUVORK5CYII='
}

import NodeBB from './nodebb'
import Utils from './utils'
import jimp from 'jimp'
import util from 'util'
import request from 'request'

const defaultSettings = {
  'avatarCDN': 'mojang',
  'avatarExpiry': 60,
  'pingExpiry': 365,
  'showDisplayName': 0,
  'debug': 0
}

Config.init = () => {
  // Sync get settings.
  Config.settings = new Settings('minecraft-integration', '0.6.0', defaultSettings)
  Config.steveBuffer = new Buffer(Config.steve, 'base64')
}

// Async get settings.
Config.getSettings = (data, next) => {
  data = data || {}
  next(null, Config.settings.get(data.key))
}

Config.logSettings = () => {
  console.log(util.inspect(Config.settings.get(), { showHidden: true, depth: null }))
}

Config.getAvatarExpiry = () => 60 * 60

Config.getPingExpiry = () => Config.settings.get('pingExpiry') ? (Config.settings.get('pingExpiry') * 24 * 60 * 60) : (365 * 24 * 60 * 60)

Config.getPlayerExpiry = () => 1000 * 60 * 60 * 24

Config.getAvatarUrl = (data, callback) => {
  const { name, size, style } = data
  const cdn = Config.settings.get('avatarCDN')
  const vars = Config.settings.get('avatarVariables')

  let url
  if (!cdn || !Config.cdns[cdn]) {
    url = Config.cdns.mojang.url
  } else {
    url = Config.cdns[cdn].url
  }
  url = url.replace('{name}', name)

  if (vars) {
    for (let prop in vars) {
      url = url.replace(`{${prop}}`, vars[prop])
    }
  }

  callback(null, url)
}

Config.getAvatarCDN = (data, next) => {
  if (!(data && data.cdn && Config.cdns[data.cdn] && Config.cdns[data.cdn].variables)) return next()

  const { url, variables } = Config.cdns[data.cdn]

  next(null, { url, variables })
}
