// Global
MinecraftIntegration = {
	log: function (memo, object) {

		if (!(config.MinecraftIntegration && config.MinecraftIntegration.debug)) return;

		if (typeof memo === 'object') {
			console.dir(memo);
		}else{
			console.log("[Minecraft Integration] " + memo);
			if (object) console.dir(object);
		}
	},
	staticDir: "/plugins/nodebb-plugin-minecraft-integration/public/",
	templates: { }
};

define('admin/plugins/minecraft-integration', function () {
	MinecraftIntegration.init = function () {
		require([MinecraftIntegration.staticDir + 'js/acp.js'], function (miACP) {
			miACP.load();
		});
	};

	return MinecraftIntegration;
});

$(window).on('action:ajaxify.end', function (event, url) {

	url = url.url.split('?')[0].split('#')[0];

	switch (url) {
		case 'admin/extend/widgets':
			require([MinecraftIntegration.staticDir + 'js/acp-widgets.js'], function (module) {
				module.init();
			});
			break;
	}
});
