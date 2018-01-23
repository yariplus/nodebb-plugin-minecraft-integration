import {
  addPageRoute,
  addWriteRoute,
} from './routes-helpers'

import {
  list,
  status,
  pings,
  icon,
  plugins,
  join,
  quit,
  ping,
} from '../controllers/controllers-servers'

export default function () {
  addPageRoute('servers', list)

  addPageRoute('sid/:sid', status)
  addPageRoute('server/:serverslug', status)

  addPageRoute('sid/:sid/pings', pings)
  addPageRoute('sid/:sid/pings/:last', pings)
  addPageRoute('server/:serverslug/pings', pings)
  addPageRoute('server/:serverslug/pings/:last', pings)

  addPageRoute('sid/:sid/icon', icon)
  addPageRoute('server/:serverslug/icon', icon)

  addPageRoute('sid/:sid/plugins', plugins)
  addPageRoute('server/:serverslug/plugins', plugins)

  addWriteRoute('sid/join', 'join', join)
  addWriteRoute('sid/quit', 'quit', quit)
  addWriteRoute('server/join', 'join', join)
  addWriteRoute('server/quit', 'quit', quit)

  addWriteRoute('sid', 'ping', ping)
  addWriteRoute('server', 'ping', ping)
}
