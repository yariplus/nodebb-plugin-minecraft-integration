import { addGetRoute, addWriteRoute, addSocketRoute } from './routes-helpers'
import { register, link, unlink, keygen } from '../controllers/controllers-integration'

export default function () {
  addGetRoute('link/:key', link)
  addWriteRoute('keygen', 'keygen', keygen)
  addSocketRoute('unlink', unlink)
}
