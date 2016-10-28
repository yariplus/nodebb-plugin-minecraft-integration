import { SocketIO } from './nodebb'
import Config from './config'
import Backend from './backend'
import async from 'async'

// Gets the socket of the passed in Server ID if it is connected.
export function getMinecraftSocket (data, next) {
  const { sid } = data

  sid = parseInt(sid, 10)

  if (!sid) return next(new Error('Data with no SID was sent to getMinecraftSocket()'))

  Backend.getServerConfig({sid}, (err, config) => {
    if (err) return next(err)

    const { socketid } = config

    if (!socketid) return next(new Error(`getMinecraftSocket(): Server ID ${sid} does not have a socket connection`))

    next(null, SocketIO.in(socketid))
  })
}

export function sendPingToUsers (ping, next) {
  SocketIO.in('online_users').emit('mi.ping', ping)
}

export function sendStatusToUsers = (status, next) {
  SocketIO.in('online_users').emit('mi.status', status)
}

export function sendPlayerJoinToUsers (player, next) {
  SocketIO.in('online_users').emit('mi.PlayerJoin', player)
}

export function sendPlayerQuitToUsers (player, next) {
  SocketIO.in('online_users').emit('mi.PlayerQuit', player)
}

export function sendPlayerChatToUsers (chat, next) {
  SocketIO.in('online_users').emit('mi.PlayerChat', chat)
}

export function sendTimeToUsers (timeData, next) {
  SocketIO.in('online_users').emit('mi.time', timeData)
}

export function sendWebChatToServer (data, next) {
  const { chat } = data

  getMinecraftSocket(data, (err, socket) => {
    if (err) return next(err)

    socket.emit('eventWebChat', chat)
  })
}

export function sendRewardToServer (rewardData, next) {
  // TODO: Send a Reward object to the server.
}

export function eventGetPlayerVotes (socket, data, next) {
  getMinecraftSocket(data, (err, socket) => {
    if (err) return next(err)

    socket.emit('eventGetPlayerVotes', data)
  })
}

export function PlayerVotes (data, next) {
  console.log('Got PlayerVotes')
  console.dir(data)
  // Assert parameters.
  if (!(data && data.name && data.votes)) return next()

  next = next || () => {}

  const name = data.name, votes = data.votes, sid = data.sid

  Backend.getUser({name}, (err, user) => {
    if (err) console.log(err)
    if (user) {
      console.log('Got user')
      console.dir(user)
      SocketIO.in(`uid_${user.uid}`).emit('mi.PlayerVotes', votes)
    }
  })
}
