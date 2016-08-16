import { User, db } from './nodebb'
import { getUserPrefix } from './api'
import Backend from './backend'
import Config from './config'
import Views from './views'
import async from 'async'

const Hooks = {
  filter: {
    scripts: {
      get(data, next) {
        next(null, data)
      }
    },
    admin: {
      header: {
        build: Views.buildAdminHeader
      }
    },
    config: {
      get(config, next) {
        config.MinecraftIntegration = Config.settings.get()
        next(null, config)
      }
    },
    widgets: {
      getWidgets: Views.getWidgets
    },
    post: {
      get(data, next) {
        // console.log("Post Data")
        // console.dir(data)
        next(null, data)
      },
      getPosts(data, next) {
        // {posts: posts, uid: uid}
        // console.log("Post Data")
        // console.dir(data)
        next(null, data)
      }
    },
    topic: {
      build(data, next) {
        if (!Config.settings.get('showPrefixes')) return next(null, data)

        // {req: req, res: res, templateData: data}
        if (!(data && data.templateData && data.templateData.posts && data.templateData.posts[0])) return next(null, data)

        data.templateData.prefixes = {}

        async.each(data.templateData.posts, (post, next) => {

          if (!(post && post.user && post.user.uid && data.templateData.prefixes[post.user.uid] === void 0)) return next()

          getUserPrefix(post.user.uid, (err, prefix) => {
            data.templateData.prefixes[post.user.uid] = prefix
            next()
          })
        }, err => {
          next(null, data)
        })
      }
    },
    user: {
      account(data, callback) {
        if (!Config.settings.get('showPrefixes')) return callback(null, data)
        getUserPrefix(data.userData.uid, (err, prefix) => {
          data.userData.prefix = prefix
          callback(null, data)
        })
      },
      create(userData, callback) {
        console.log(`Setting new user avatar for ${userData.username}`)
        // var picture = pic
        // userData['picture'] = picture
        // userData['uploadedpicture'] = picture
        callback(null, userData)
      },
      profileLinks(links, next) {
        links.push({
          id: 'minecraft',
          public: true,
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
      update(data, next) {
        next(null, data)
      }
    }
  },
  action: {
    user: {
      loggedIn(uid) {
        console.log(`User uid ${uid} logged in, checking avatar...`)
      // .setUserAvatar(uid)
      },
      set(data) {
        if (data.field === 'picture') {
          // .setUserAvatar(data.uid)
        }
      }
    },
    group: {
      destroy(group) {
      }
    }
  }
}

function setUserAvatar (uid) {
  User.getUserFields(uid, ['uuid', 'username', 'picture'], (err, fields) => {
    if (err) {
      console.log(`Tried to check the avatar of user uid ${uid}, but got an error:`, err)
    }else if (!fields.uuid) {
      console.log(`User uid ${uid} does not have a UUID assigned, adding to refresh queue.`)
    // TODO: Add a refresh queue. :P
    }else {
      const picture = Config.settings.get('avatarCDN').replace('{username}', fields.username)
      if (picture !== fields.picture) {
        console.log(`Changing avatar for user ${uid}`)
        User.setUserFields(uid, {picture, uploadedpicture: picture}, err => {
          if (err) {
            console.log(err)
          }
        })
      }else {
        console.log(`User uid ${uid} has the correct avatar!`)
      }
    }
  })
}

export default Hooks
