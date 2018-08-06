import { winston } from './nodebb'
import Config from './config'

// TODO: Parse translation strings in messages.

function createLevel (levelname, minlevel) {
  return message => {
    if (Config.getLogLevel() >= minlevel) {
      winston[levelname](`[Minecraft Integration] ${message}`)
    }
  }
}

export default {
  error: createLevel('error', 1),
  warn: createLevel('warn', 2),
  info: createLevel('info', 3),
  verbose: createLevel('info', 4),
  debug: createLevel('info', 5),
}
