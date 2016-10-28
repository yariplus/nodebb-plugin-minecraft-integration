import { SocketIO } from './nodebb'
import Config from './config'
import Backend from './backend'
import async from 'async'
const Controller = module.exports = { }

// Socket event received from a user. Find the server config and socket.
function getServer (data, next) {
  if (data.sid === void 0) return next(new Error('Data with no SID was sent to the socket controller.'))

  Backend.getServerConfig({sid: data.sid}, (err, config) => next(err, {server: config, socket: config.socketid ? SocketIO.in(config.socketid) : null}))
}

Controller.sendPingToUsers = (ping, callback) => {
  SocketIO.in('online_users').emit('mi.ping', ping)
}

Controller.sendStatusToUsers = (status, callback) => {
  callback = callback || (() => {
  })
  SocketIO.in('online_users').emit('mi.status', status)
  callback()
}

Controller.sendPlayerJoinToUsers = (player, callback) => {
  SocketIO.in('online_users').emit('mi.PlayerJoin', player)
}

Controller.sendPlayerQuitToUsers = (player, callback) => {
  SocketIO.in('online_users').emit('mi.PlayerQuit', player)
}

Controller.sendPlayerChatToUsers = (chat, callback) => {
  SocketIO.in('online_users').emit('mi.PlayerChat', chat)
}

Controller.sendTimeToUsers = (timeData, callback) => {
  SocketIO.in('online_users').emit('mi.time', timeData)
}

Controller.sendWebChatToServer = (data, callback) => {
  getServer(data, (err, serverData) => {
    if (err) return console.log(err)
    if (!serverData || !serverData.socket) return console.log(new Error('Invalid response from controller getServer()'))

    serverData.socket.emit('eventWebChat', data.chat)
  })
}

Controller.sendRewardToServer = (rewardData, callback) => {
  // TODO: Send a Reward object to the server.
}

Controller.eventGetPlayerVotes = (socket, data, callback) => {
  console.dir(data)
  getServer(data, (err, serverData) => {
    if (err) return console.log(err)
    if (!serverData || !serverData.socket) return console.log(new Error('Invalid response from controller getServer()'))

    callback()
    serverData.socket.emit('eventGetPlayerVotes', data)
  })
}

Controller.PlayerVotes = (data, callback) => {
  console.log('Got PlayerVotes')
  console.dir(data)
  // Assert parameters.
  if (!(data && data.name && data.votes)) return callback()
  callback = callback || (() => {
  })

  const name = data.name, votes = data.votes, sid = data.sid

  Backend.getUser({name}, (err, user) => {
    if (err) console.log(err)
    if (user) {
      console.log('Got user')
      console.dir(user)
      SocketIO.in(`uid_${user.uid}`).emit('mi.PlayerVotes', votes)
    }
  })

  callback()
}
