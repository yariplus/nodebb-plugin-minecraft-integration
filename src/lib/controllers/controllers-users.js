// Users controllers

import { async, db, User } from '../nodebb'

import Config from '../config'
import Updater from '../updater'
import Utils from '../utils'

import {
  getUsers,
  getUser,
} from '../users'

function users () {
  // (uid, (err, players) => {
    // if (err) return res.status(404).end()

    res.render('mi/data', {data: ''})
  // })
}

function user () {
  // (uid, (err, players) => {
    // if (err) return res.status(404).end()

    res.render('mi/data', {data: ''})
  // })
}

function profile () {
  // (uid, (err, players) => {
    // if (err) return res.status(404).end()

    res.render('mi/data', {data: ''})
  // })
}

function register () {
  // (uid, (err, players) => {
    // if (err) return res.status(404).end()

    res.render('mi/data', {data: ''})
  // })
}

function ranks () {
  // (uid, (err, players) => {
    // if (err) return res.status(404).end()

    res.render('mi/data', {data: ''})
  // })
}

function chat () {
  // (uid, (err, players) => {
    // if (err) return res.status(404).end()

    res.render('mi/data', {data: ''})
  // })
}

// export function deleteUser (data, next) {
  // if (!data || !data.uid) return next(new Error('No uid'))

  // const uid = parseInt(data.uid, 10)

  // Backend.sortedSetRemove()
  // Backend.getUuidsFromUid( uid, function (yuuids, next) {
  // async.each(yuuids, function (yuuid, next) {
  // Backend.getUidsFromUuid(yuuid, function (err, uids) {
  // Backend.getPrimaryUid(yuuid, function (err, primaryuid) {
  // if (!err && primaryuid && parseInt(primaryuid, 10) === uid) {
  // db.getSortedSetRange('yuuid:' + yuuid  + ':uids', 0, -1, function (err, uids) {
  // })
  // }
  // })
  // })
  // })
  // })

  // async.parallel([
  // Get all uuids, get primary uids, reset primary uid to something else if equal, remove from set.

// // async.apply(db.deleteObjectField, 'yuuid:' + id,  'uid'),
// async.apply(db.sortedSetRemove,   'yuuids:linked', id),
// function (next) {
// db.getSortedSetRange('yuuid:' + id  + ':uids', 0, -1, function (err, uids) {
// async.each(uids, function (uid, next) {
// async.parallel([
// async.apply(db.sortedSetRemove, 'yuuid:' + id  + ':uids',   uid),
// async.apply(db.sortedSetRemove, 'uid:'   + uid + ':yuuids', id)
// ], next)
// }, next)
// })
// }
// ], next)
// }

export {
  users,
  user,
  profile,
  register,
  ranks,
  chat,
}
