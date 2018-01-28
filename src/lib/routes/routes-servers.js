import {
  addPageRoute,
  addServerPageRoute,
  addWriteRoute,
} from './routes-helpers'

import {
  list,
  status,
  getstatus,
  pings,
  icon,
  plugins,
  join,
  quit,
  ping,
} from '../controllers/controllers-servers'

export default function () {
  addServerPageRoute('servers', list)

  addServerPageRoute('', getstatus)
  addServerPageRoute('status', getstatus)
  addServerPageRoute('pings', pings)
  addServerPageRoute('pings/:last', pings)
  addServerPageRoute('icon', icon)
  addServerPageRoute('plugins', plugins)

  addWriteRoute('sid/join', 'join', join)
  addWriteRoute('sid/quit', 'quit', quit)
  addWriteRoute('sid/ping', 'ping', ping)
  addWriteRoute('sid/status', 'status', status)
}
