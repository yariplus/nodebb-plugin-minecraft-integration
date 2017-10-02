import { User, db } from './nodebb'
import { buildAdminHeader } from './admin'

import { getPrefixByUid, getPlayersByUid } from './players'

import Config from './config'
import { getWidgets } from './widgets'
import async from 'async'

const Hooks = {
  filter: {
    scripts: {
      get (data, next) {
        next(null, data)
      }
    },
    admin: {
      header: {
        build: buildAdminHeader
      }
    },
    config: {
      get (config, next) {
        config.MinecraftIntegration = Config.settings.get()
        next(null, config)
      }
    },
    widgets: {
      getWidgets: getWidgets
    },
    post: {
      get (data, next) {
        // console.log("Post Data")
        // console.dir(data)
        next(null, data)
      },
      getPosts (data, next) {
        // {posts: posts, uid: uid}
        // console.log("Post Data")
        // console.dir(data)
        next(null, data)
      }
    },
    topic: {
      build (data, next) {
        if (!Config.settings.get('showPrefixes')) return next(null, data)

        // {req: req, res: res, templateData: data}
        if (!(data && data.templateData && data.templateData.posts && data.templateData.posts[0])) return next(null, data)

        data.templateData.prefixes = {}

        async.each(data.templateData.posts, (post, next) => {
          if (!(post && post.user && post.user.uid && data.templateData.prefixes[post.user.uid] === void 0)) return next()

          getPrefixByUid(post.user.uid, (err, prefix) => {
            data.templateData.prefixes[post.user.uid] = prefix
            next()
          })
        }, err => {
          next(null, data)
        })
      }
    },
    user: {
      account (data, callback) {
        if (!Config.settings.get('showPrefixes')) return callback(null, data)
        getPrefixByUid(data.userData.uid, (err, prefix) => {
          data.userData.prefix = prefix
          callback(null, data)
        })
      },
      create (userData, callback) {
        // TODO: User creation, check for linked MC name and disallow.
        callback(null, userData)
      },
      profileLinks (links, next) {
        links.push({
          id: 'minecraft',
          route: 'minecraft',
          icon: 'fa-cube',
          name: 'Minecraft'
        })
        next(null, links)
      }
    },
    users: {
    },
    group: {
      update (data, next) {
        next(null, data)
      }
    },
    middleware: {
      renderHeader (data, next) {
        getPlayersByUid(data.templateValues.user.uid, (err, players) => {
          if (!err && players) {
            data.templateValues.user.players = players

            players.forEach(player => data.templateValues.user.player = player.isPrimary ? player : data.templateValues.user.player)

            data.templateValues.userJSON = JSON.stringify(data.templateValues.user)
          } else {
            data.templateValues.user.players = []
            JSON.stringify(data.templateValues.user)
          }

          next(err, data)
        })
      },
    },
  },
  action: {
    user: {
      loggedIn (uid) {
        console.log(`User uid ${uid} logged in, checking avatar...`)
      // .setUserAvatar(uid)
      },
      set (data) {
        if (data.field === 'picture') {
          // .setUserAvatar(data.uid)
        }
      }
    },
    group: {
      destroy (group) {
      }
    }
  }
}

function setUserAvatar (uid) {
  User.getUserFields(uid, ['uuid', 'username', 'picture'], (err, fields) => {
    if (err) {
      console.log(`Tried to check the avatar of user uid ${uid}, but got an error:`, err)
    } else if (!fields.uuid) {
      console.log(`User uid ${uid} does not have a UUID assigned, adding to refresh queue.`)
    // TODO: Add a refresh queue. :P
    } else {
      const picture = Config.settings.get('avatarCDN').replace('{username}', fields.username)
      if (picture !== fields.picture) {
        console.log(`Changing avatar for user ${uid}`)
        User.setUserFields(uid, {picture, uploadedpicture: picture}, err => {
          if (err) {
            console.log(err)
          }
        })
      } else {
        console.log(`User uid ${uid} has the correct avatar!`)
      }
    }
  })
}

export default Hooks
