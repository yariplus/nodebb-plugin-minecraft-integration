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
  writeServerStatus,
} from '../controllers/controllers-servers'

export default function () {
  addPageRoute('servers', list)

  addPageRoute('server/:sid', status)

  addPageRoute('server/:sid/pings', pings)
  addPageRoute('server/:sid/pings/:last', pings)

  addPageRoute('server/:sid/icon', icon)

  addPageRoute('server/:sid/plugins', plugins)

  addWriteRoute('server', 'eventStatus', writeServerStatus)
}
