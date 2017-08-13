import { addToAPI } from './routes-helpers'

import * as Backend from '../backend'

import { getServerStatus } from '../api'

export default function () {
  addToAPI(Backend.getServers, 'getServers', 'servers')

  addToAPI(getServerStatus, 'getServerStatus', 'server/:sid')

  addToAPI(Backend.getRecentPings, 'getRecentPings', 'server/:sid/pings')
  addToAPI(Backend.getRecentPings, 'getRecentPings', 'server/:sid/pings/:last')

  addToAPI(Backend.getServerIcon, 'getServerIcon', 'server/:sid/icon', 'Buffer')

  addToAPI(Backend.getServerPlugins, 'getServerPlugins', 'server/:sid/plugins')
}
