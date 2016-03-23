var NodeBB = require('../nodebb');
var db = require('../nodebb');

module.exports = function() {
	// TODO: Add slugs
	// db.sortedSetScore('mi:servers:slugs')

	NodeBB.router.get('/mc/chat', NodeBB.middleware.buildHeader, function (req, res) {
		res.render('mc/chat', {sid: 0});
	});
};
