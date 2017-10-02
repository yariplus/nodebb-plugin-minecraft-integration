import {
  getPocketAvatarBase,
  getAvatarBase,
  getAvatarList,
} from '../avatars'

// ACP list
function getAvatars (req, res) {
  getAvatarList((err, avatarList) => {
    if (err) res.json(err)

    const avatars = []

    // TODO: This needs to be a multi-key operation.
    async.each(avatarList, (name, next) => {
      getAvatar(name, (err, base64) => {
        if (err || !base64) return next()

        Backend.getUuidFromName(name, (err, uuid) => {
          if (err || !uuid) return next()

          avatars.push({name, base64, id: uuid})
          next()
        })
      })
    }, err => {
      if (err) res.json(err)

      res.json(avatars)
    })
  })
}

// avatar/:size
function getAvatar (req, res) {
  let { name, size } = req.params

  size = parseInt(size, 10) || 64

  // TODO
  console.log(`API.getAvatar of ${name}`)

  getAvatarBase(name, (err, avatar) => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': avatar.buffer.length,
    })
     res.end(avatar.buffer)
  })
}

function getHelmAvatar (req, res) {
  res.status(404).end()
}

function getHead (req, res) {
  res.status(404).end()
}

function getHelmHead (req, res) {
  res.status(404).end()
}

function getPocketAvatar (req, res) {
  let { name, size } = req.params

  size = parseInt(size, 10) || 64

  getPocketAvatarBase(name, (err, avatar) => {
    // TODO
    res.json(err ? err : avatar)
  })
}

export {
  getAvatars,
  getAvatar,
  getHelmAvatar,
  getHead,
  getHelmHead,
  getPocketAvatar,
}
