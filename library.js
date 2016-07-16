'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = exports.Widgets = undefined;
exports.load = load;

var _nodebb = require('./lib/nodebb');

var _admin = require('./lib/admin');

var _admin2 = _interopRequireDefault(_admin);

var _backend = require('./lib/backend');

var _backend2 = _interopRequireDefault(_backend);

var _config = require('./lib/config');

var _config2 = _interopRequireDefault(_config);

var _utils = require('./lib/utils');

var _utils2 = _interopRequireDefault(_utils);

var _updater = require('./lib/updater');

var _updater2 = _interopRequireDefault(_updater);

var _views = require('./lib/views');

var _views2 = _interopRequireDefault(_views);

var _routes = require('./lib/routes');

var _routes2 = _interopRequireDefault(_routes);

var _widgets = require('./lib/widgets');

var _widgets2 = _interopRequireDefault(_widgets);

var _hooks = require('./lib/hooks');

var _hooks2 = _interopRequireDefault(_hooks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// preload?
// import './lib/analytics'

_nodebb.emitter.once('nodebb:ready', _views2.default.modifyTemplates);

exports.Widgets = _widgets2.default;
exports.Hooks = _hooks2.default;
function load(params, next) {

  params.app.set('json spaces', 4);

  (0, _routes2.default)(params.app, params.middleware, params.router);
  _views2.default.init(params.app, params.middleware, params.router);
  _admin2.default.init();
  _widgets2.default.init(params.app);

  // Add a default server.
  _nodebb.db.getObject('mi:server:0:config', function (err, config) {

    if (err) return next(new Error(err));

    config = config || {};
    config.name = config.name || "A Minecraft Server";
    config.address = config.address || require('nconf').get('url') + ':25565';
    config.APIKey = config.APIKey || _utils2.default.getKey();
    config.hidePlugins = config.hidePlugins || "0";

    _nodebb.db.setObject('mi:server:0:config', config);
    _nodebb.db.sortedSetAdd('mi:servers', Date.now(), '0');

    setTimeout(_config2.default.logSettings, 5000);
    setTimeout(_updater2.default.updateServers, 10000);

    next();
  });
}