import {
  getPocketAvatarBase,
  getAvatarBase,
} from '../avatars'

// avatar/:size
export function getAvatar (data, callback) {
  // Assert parameters
  if (!(data && data.name && typeof data.name === 'string')) return callback(new Error(`Invalid Data passed to getAvatar: ${data}`))

  let { name, size } = data

  size = parseInt(size, 10) || 64
console.log(`API.getAvatar of ${name}`)
  getAvatarBase(name, callback)
}

export function getPocketAvatar (data, callback) {
  // Assert parameters
  if (!(data && data.name && typeof data.name === 'string')) return callback(new Error(`Invalid Data passed to getPocketAvatar: ${data}`))

  let { name, size } = data

  size = parseInt(size, 10) || 64

  getPocketAvatarBase(name, callback)
}
