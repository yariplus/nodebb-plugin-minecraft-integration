;((Utils => {
  const NodeBB = require('./nodebb')

  const async = require('async')
  const path = require('path')
  const fs = require('fs')
  const request = require('request')
  const crypto = require('crypto')
  const humanize = require('humanize-duration')

  const styleResets = 'display:inline-block; font-style: normal; text-decoration: none; font-weight: normal;'
  Utils.parseMCFormatCodes = Utils.parseFormatCodes = text => {
    if (!text) return ''
    const spancount = text.split(/[§&]|\\u00A7/g).length - 1
    text = text.replace(/(?:[§&]|\\u00A7)0/g, `<span style="${styleResets} color:#333333;">`)
    text = text.replace(/(?:[§&]|\\u00A7)1/g, `<span style="${styleResets} color:#0000AA;">`)
    text = text.replace(/(?:[§&]|\\u00A7)2/g, `<span style="${styleResets} color:#00AA00;">`)
    text = text.replace(/(?:[§&]|\\u00A7)3/g, `<span style="${styleResets} color:#00AAAA;">`)
    text = text.replace(/(?:[§&]|\\u00A7)4/g, `<span style="${styleResets} color:#AA0000;">`)
    text = text.replace(/(?:[§&]|\\u00A7)5/g, `<span style="${styleResets} color:#AA00AA;">`)
    text = text.replace(/(?:[§&]|\\u00A7)6/g, `<span style="${styleResets} color:#FFAA00;">`)
    text = text.replace(/(?:[§&]|\\u00A7)7/g, `<span style="${styleResets} color:#AAAAAA;">`)
    text = text.replace(/(?:[§&]|\\u00A7)8/g, `<span style="${styleResets} color:#555555;">`)
    text = text.replace(/(?:[§&]|\\u00A7)9/g, `<span style="${styleResets} color:#5555FF;">`)
    text = text.replace(/(?:[§&]|\\u00A7)a/g, `<span style="${styleResets} color:#55FF55;">`)
    text = text.replace(/(?:[§&]|\\u00A7)b/g, `<span style="${styleResets} color:#55FFFF;">`)
    text = text.replace(/(?:[§&]|\\u00A7)c/g, `<span style="${styleResets} color:#FF5555;">`)
    text = text.replace(/(?:[§&]|\\u00A7)d/g, `<span style="${styleResets} color:#FF55FF;">`)
    text = text.replace(/(?:[§&]|\\u00A7)e/g, `<span style="${styleResets} color:#FFFF55;">`)
    text = text.replace(/(?:[§&]|\\u00A7)f/g, `<span style="${styleResets} color:#FFFFFF;">`)
    text = text.replace(/(?:[§&]|\\u00A7)k/g, '<span>'); // TODO: Magic character.
    text = text.replace(/(?:[§&]|\\u00A7)l/g, '<span style="font-weight: bold;">')
    text = text.replace(/(?:[§&]|\\u00A7)m/g, '<span style="text-decoration: line-through;">')
    text = text.replace(/(?:[§&]|\\u00A7)n/g, '<span style="text-decoration: underline;">')
    text = text.replace(/(?:[§&]|\\u00A7)o/g, '<span style="font-style: italic;">')
    text = text.replace(/(?:[§&]|\\u00A7)r/g, `<span style="${styleResets} color:unset;">`)
    text = text.replace(/(?:[§&]|\\u00A7)/g, '<span>')
    for ( let i = 0; i < spancount; i++) text = `${text}</span>`
    return text
  }

  Utils.parseVersion = version => {
    if (version) {
      const parsed = /\(MC:[^\d]*(\d+\.\d+(\.\d+)?)[^\d]*\)/.exec(version)
      if (parsed && parsed[1]) {
        version = parsed[1]
      }
    }else {
      version = 'unknown'
    }
    return version
  }

  Utils.formatAddress = server => {
    const hostarray = server.address.split(/:/g)
    if (hostarray.length > 1) {
      if (hostarray.length === 2) {
        server.host = hostarray[0]
        server.port = hostarray[1]
      }else {
        console.log(`Configuration error: Invalid host (${server.address}). Too many ":", using default "0.0.0.0". `)
        server.host = '0.0.0.0'
      }
    }
    return server
  }

  // TODO: Make sure it's really an IP.
  Utils.isIP = string => !isNaN(parseInt(string.substring(0, 1)))

  Utils.verifyAddress = (server, next) => {
    server.host = '0.0.0.0'
    server.port = '25565'
    next(null, server)
  }

  Utils.getPingStampsByRecency = (minutes, trim, next) => {
    const stamps = []
    const now = Math.round(Date.now() / 60000) * 60000
    let minute
    for (minute = 0; minute < minutes; minute++) {
      stamps.push(now - (minute * 60000))
    }
    next(null, stamps)
  }

  Utils.getPingStampsByRange = (start, stop, trim, next) => {
    next()
  }

  Utils.getUUID = (name, next) => {
    console.log(`Fetching UUID for ${name}`)
    request({url: `https://api.mojang.com/users/profiles/minecraft/${name}`, json: true}, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        next(null, body.id)
      }else {
        next(err || new Error(`Bad Request: https://api.mojang.com/users/profiles/minecraft/${name}`))
      }
    })
  }

  Utils.getName = (id, next) => {
    console.log(`Fetching Name for ${id}`)
    request({url: `https://sessionserver.mojang.com/session/minecraft/profile/${id}`, json: true}, (err, response, body) => {
      if (err) return next(err)
      if (response.statusCode == 200) {
        // Temp
        if (!body[body.length - 1]) {
          console.log('Recieved unexpected response from Mojang session server:')
          console.dir(body)
        }
        next(null, body[body.length - 1] ? body[body.length - 1].name : 'unknown')
      }
    })
  }

  Utils.trimUUID = uuid => uuid.replace(/-/g, '')

  Utils.untrimUUID = uuid => {
    if (uuid.match('-')) return uuid
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20, 32)}`
  }

  Utils.getKey = (data, next) => {
    if (next) {
      crypto.randomBytes(48, (err, buf) => {
        next(null, {key: buf.toString('base64').replace(/\//g, '=')})
      })
    } else {
      return crypto.randomBytes(48).toString('base64').replace(/\//g, '=')
    }
  }

  Utils.voteServices = [
    { service: 'minecraftservers_org',      name: 'MinecraftServers.org' },
    { service: 'minecraft-server-list_com', name: 'Minecraft-Server-List.com' },
    { service: 'planetminecraft_com',       name: 'PlanetMinecraft.com' }
  ]

  Utils.parseMinutesDuration = (minutes, locale) => humanize(minutes * 60 * 1000, { language: locale || 'en', units: ['d', 'h', 'm']})

  Utils.getHumanTime = stamp => humanTime(stamp)

  function humanTime (stamp) {
    const date = new Date(parseInt(stamp, 10)), hours = date.getHours() < 13 ? (date.getHours() === 0 ? 12 : date.getHours()) : date.getHours() - 12, minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(), meridiem = date.getHours() < 12 ? 'AM' : 'PM'

    return `${hours}:${minutes} ${meridiem}`
  }
})(exports))
