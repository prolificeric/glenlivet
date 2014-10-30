var path = require('path');
var Bottle = require('./Bottle');
var Barrel = require('./Barrel');
var dir = __dirname;

module.exports = {
    Bottle: Bottle,
    Barrel: Barrel,
    createBarrel: function (config) {
        var barrel = new Barrel(config);
        barrel.plugins.loadFromDirectory(path.resolve(dir, '../plugins'));
        return barrel;
    }
};
