import * as Avatars from '../avatars'

// avatar/:size
export function getAvatar (data, callback) {
  // Assert parameters
  if (!(data && data.name && typeof data.name === 'string')) return callback(new Error(`Invalid Data passed to getAvatar: ${data}`))

  let { name, size } = data

  size = parseInt(size, 10) || 64

  // Is it a pocket name?
  const pocket = !!name.match(/^pocket:/)
  if (pocket) {
    name = name.split(':')[1]
    Avatars.getPocketAvatar(name, callback)
  } else {
    Avatars.getAvatar(name, callback)
  }
}
