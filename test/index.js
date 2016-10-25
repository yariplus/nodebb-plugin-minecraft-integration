import chai from 'chai'
import path from 'path'
import fs from 'fs'

const expect = chai.expect

// Find the NodeBB install dir.
const HOME = ( process.env.TRAVIS_BUILD_DIR ? process.env.TRAVIS_BUILD_DIR : process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] ) + '/nodebb/'

process.env.NODE_ENV = 'development'

// Load the config file to nconf.
require(path.join(HOME, 'node_modules/nconf')).file({ file: path.join(HOME, 'config.json') })

require.main.require = module => {
  switch (module) {
    case './src/settings': return () => {}
    case './src/pubsub': return {on: () => {}, publish: () => {}}
    case 'async': return require(path.join(HOME, 'node_modules', module))
    case 'winston': return {info: () => {}, warn: () => {}}
    case 'nconf': return require(path.join(HOME, 'node_modules', module))
  }
}

describe('The plugin loads', () => {
  it('should load nodebb', () => {
  })
})
