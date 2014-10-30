var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Pipeline = require('./Pipeline');
var PluginRegistry = require('./PluginRegistry');

function Bottle (config, steps) {
    Pipeline.call(this, steps || Bottle.defaultSteps);

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

Bottle.prototype.configure = function (configChanges) {
    _.every(configChanges, function (extension, path) {
        var obj = this.config;
        var parts = path.split('.');
        var lastPart = parts.pop();
        var abort = false;

        _.every(parts, function (part) {
            var isOptional = /\?$/.test(part);

            part = part.replace(/\?$/, '');

            if (!obj[part]) {
                if (isOptional) {
                    abort = true;
                    return false;
                } else {
                    obj = obj[part] = {};
                }
            } else {
                obj = obj[part];
            }

            return true;
        });

        if (abort) {
            return false;
        }

        if (typeof extension === 'object') {
            _.extend(obj[lastPart] = obj[lastPart] || {}, extension);
        } else {
            obj[lastPart] = extension;
        }

        return true;
    }, this);

    return this;
};

Bottle.prototype.callback = function (name, context) {
    var callback = this.config._callbacks[name];

    if (callback) {
        callback.call(this, context);
    }

    return this;
};

Bottle.prototype.serve = Pipeline.prototype.exec;

module.exports = Bottle;
