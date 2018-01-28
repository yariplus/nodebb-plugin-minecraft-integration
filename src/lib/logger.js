import { winston } from './nodebb'
import Config from './config'

// TODO: Parse translation strings in messages.
export default {
  error: message => { if (Config.getLogLevel() !== 0) winston.error(`[Minecraft Integration] ${message}`) },
  warn: message => { if (Config.getLogLevel() !== 0) winston.warn(`[Minecraft Integration] ${message}`) },
  info: message => { if (Config.getLogLevel() >= 3) winston.info(`[Minecraft Integration] ${message}`) },
  verbose: message => { if (Config.getLogLevel() >= 4) winston.info(`[Minecraft Integration] ${message}`) },
  debug: message => { if (Config.getLogLevel() >= 5) winston.info(`[Minecraft Integration] ${message}`) },
}
