module.exports = function(router, middleware) {

	// TODO: Default to first server.
	// router.get('/mc/chat/')

	// TODO: Add slugs
	// db.sortedSetScore('mi:servers:slugs')
	router.get('/mc/chat', middleware.busyCheck, middleware.buildHeader, middlewares, controller);
};
