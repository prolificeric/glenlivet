var express = require('express');
var _ = require('lodash');
var glenlivet = require('../../lib');

function api (config) {
    if (this instanceof glenlivet.Bottle) {
        var bottle = this;

        this.controller = function (req, resp) {
            var vals = {};

            _.each(config.params, function (compute, key) {
                vals[key] = compute(req);
            });

            bottle.serve(vals, function (err, context) {
                if (err) {
                    return resp.status(500).send({
                        error: err.message
                    });
                }

                var val = context;

                _.each(config.returnPath.split('.'), function (part) {
                    val = val[part]
                });

                resp.send(val);
            });
        }
    } else if (this instanceof glenlivet.Barrel) {
        this.api = function () {
            var router = express.Router();

            this.eachBottle(function (bottle) {
                var endpoint = bottle.config.api;

                if (!endpoint) return;

                router[(endpoint.method || 'GET').toLowerCase()](endpoint.route, bottle.controller);
            });

            return router;
        };
    }
}

module.exports = api;
