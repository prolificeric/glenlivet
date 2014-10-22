var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Bottle = require('./Bottle');
var PluginRegistry = require('./PluginRegistry');

function Barrel (config) {
    EventEmitter.call(this);

    var _this = this;

    this.config = config || {};
    this.bottles = {};
    this.plugins = new PluginRegistry();
    this.plugins.invokeFromObject(this.config, this);
}

util.inherits(Barrel, EventEmitter);

Barrel.prototype.bottle = function (name, config) {
    config._plugins = config._plugins || this.plugins;
    var bottle = this.bottles[name] = new Bottle(config);
    this.emit('bottle', bottle);
    return bottle;
};

Barrel.prototype.eachBottle = function (callback) {
    _.each(this.bottles, callback);
    this.on('bottle', callback);
    return this;
};

module.exports = Barrel;
