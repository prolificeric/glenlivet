var fs = require('fs');
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

function PluginRegistry () {
    this._plugins = {};
}

util.inherits(PluginRegistry, EventEmitter);

PluginRegistry.prototype.register = function (name, plugin) {
    if (typeof name === 'object') {
        for (var k in name) if (name.hasOwnProperty(k)) {
            this.register(k, name[k]);
        }
    } else {
        this._plugins[name] = plugin;
        this.emit('plugin', plugin, name);
        this.emit('plugin:' + name, plugin);
    }

    return this;
};

PluginRegistry.prototype.get = function (name) {
    return this._plugins[name] || null;
};

PluginRegistry.prototype.loadFromDirectory = function (dir, whitelist) {
    var files = fs.readdirSync(dir);

    _.each(files, function (file) {
        var name = file.replace(/\.js$/, '');
        var plugin = require(path.resolve(dir, file));
        this.register(name, plugin);
    }, this);

    return this;
};

PluginRegistry.prototype.invokeFromObject = function (object, context) {
    _.each(object, function (pluginConfig, name) {
        //Ignore keys with underscores
        if (/^_/.test(name)) {
            return;
        }

        var plugin = this.get(name);

        if (plugin) {
            plugin.call(context, pluginConfig, context);
        } else {
            console.warn('Waiting for plugin to be registered: ' + name);

            this.on('plugin:' + name, function (plugin) {
                plugin.call(context, pluginConfig, context);
                console.log('Required plugin registered: ' + name);
            });
        }
    }, this);

    return this;
};

module.exports = PluginRegistry;
