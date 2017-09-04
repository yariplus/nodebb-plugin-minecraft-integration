import { getChat } from '../chat'

export function render (data, next) {
  let { sid, amount } = data

  getChat(sid, amount || 15, next)
}
