import chai from 'chai'
import path from 'path'
import fs from 'fs'

const expect = chai.expect

// Find the NodeBB install dir.
if (process.env.TRAVIS_BUILD_DIR) {
  process.env.NODEBB_HOME = process.env.TRAVIS_BUILD_DIR + '/node_modules/nodebb/'
} else {
  process.env.NODEBB_HOME = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] + '/nodebb/'
}

process.env.NODE_ENV = 'development'

// Load the config file to nconf.
require('nconf').file({ file: path.join(process.env.NODEBB_HOME, 'config.json') })

require.main.require = module => {
  if (module.match(/src/) && !module.match(/node_modules/)) {
    return require(path.join(process.env.NODEBB_HOME, module))
  } else {
    return require(module)
  }
}

let db = require('./mocks/databasemock')
let mi = require(path.join(__dirname, '../library'))

describe('The plugin loads', () => {
  it('should load MinecraftIntegration', () => {
    expect(() => {
      mi = require(path.join(__dirname, '../library'))
    }).to.not.throw
  })
})
