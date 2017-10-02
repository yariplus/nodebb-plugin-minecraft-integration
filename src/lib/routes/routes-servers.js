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
  writeServerStatus,
} from '../controllers/controllers-servers'

export default function () {
  addPageRoute('servers', list)

  addPageRoute('server/:sid', status)

  addPageRoute('server/:sid/pings', pings)
  addPageRoute('server/:sid/pings/:last', pings)

  addPageRoute('server/:sid/icon', icon)

  addPageRoute('server/:sid/plugins', plugins)

  addWriteRoute('server/join', 'eventPlayerJoin', join)
  addWriteRoute('server/quit', 'eventPlayerQuit', quit)

  addWriteRoute('server', 'eventStatus', writeServerStatus)
}
