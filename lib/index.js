var Bottle = require('./Bottle');
var Barrel = require('./Barrel');

module.exports = {
    Bottle: Bottle,
    Barrel: Barrel,
    createBarrel: function (config) {
        return new Barrel(config);
    }
};
