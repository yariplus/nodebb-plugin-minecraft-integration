/**
 * Database Mock - wrapper for database.js, makes system use separate test db, instead of production
 * ATTENTION: testing db is flushed before every use!
 */

(function (module) {
	'use strict'
	/*global require, before, __dirname*/

	var async = require('async')
	var winston = require('winston')
	var path  = require('path')
	var nconf = require('nconf')
	var url = require('url')
	var errorText

  nconf.env()

	nconf.file({ file: path.join(__dirname, '../../node_modules/nodebb/config.json') })

	nconf.defaults({
		base_dir: path.join(__dirname,'../..'),
		themes_path: path.join(__dirname, '../../node_modules'),
		upload_url: path.join(path.sep, '../../uploads', path.sep),
		views_dir: path.join(__dirname, '../../public/templates'),
		relative_path: ''
	})

	if (!nconf.get('isCluster')) {
		nconf.set('isPrimary', 'true')
		nconf.set('isCluster', 'false')
	}

	var dbType = nconf.get('DB')

  console.log(dbType)

	var testDbConfig = {
    "host": "127.0.0.1",
    "port": 27017,
    "database": "8"
  }

	nconf.set(dbType, testDbConfig)

	var db = require('../../node_modules/nodebb/src/database')

	before(function (done) {
		this.timeout(30000)
		async.waterfall([
			function (next) {
				db.init(next)
			},
			function (next) {
        next()
			}
		], done)
	})

	module.exports = db

}(module))
