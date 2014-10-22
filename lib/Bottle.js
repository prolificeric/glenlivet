var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Pipeline = require('./Pipeline');
var PluginRegistry = require('./PluginRegistry');

function Bottle (config) {
    Pipeline.call(this, Bottle.defaultSteps);

    this.config = _.defaults(config, {
        _callbacks: {
            always: function () {}
        }
    });

    (config._plugins || Bottle.defaultPlugins).invokeFromObject(config, this);
}

util.inherits(Bottle, Pipeline);

Bottle.defaultPlugins = new PluginRegistry();

Bottle.defaultSteps = [
    'setup',
    'process',
    'filter',
    'persist'
];

Bottle.prototype.callback = function (name, context) {
    var callback = this.config._callbacks[name];

    if (callback) {
        callback.call(this, context);
    }

    return this;
};

Bottle.prototype.serve = Pipeline.prototype.exec;

module.exports = Bottle;
