var express = require('express');
var _ = require('lodash');
var glenlivet = require('../../lib');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var debugMode = process.env.DEBUG == '1';

function api (config) {
    if (this instanceof glenlivet.Bottle) {
        var bottle = this;

        this.controller = function (req, resp) {
            var vals = {};

            _.each(config.params, function (compute, key) {
                if (typeof compute === 'string') {
                    var val = req;
                    var parts = compute.split('.');
                    var part;

                    while ((part = parts.shift()) && val) {
                        val = val[part];
                    }

                    vals[key] = val;
                } else {
                    vals[key] = compute(req);
                }

            });

            bottle.serve(vals, function (err, context) {
                if (err) {
                    return resp.status(500).send({
                        error: err.message
                    });
                }

                var val = context;
                var path = (debugMode && req.query._return)?
                        req.query._return:
                        config.returnPath;

                _.every(path.split('.'), function (part) {
                    val = val[part];
                    return !!val;
                });

                if (context.returnHeaders) {
                    resp.set(context.returnHeaders);
                }

                resp.send(val);
            });
        }
    } else if (this instanceof glenlivet.Barrel) {
        this.eachBottle(function (bottle) {
            if (bottle.config.api) {
                _.defaults(bottle.config.api, {
                    returnPath: config.returnPath
                });
            }
        });

        this.api = function () {
            var router = express.Router();

            router.use(cookieParser());
            router.use(bodyParser.urlencoded({ extended: true }));
            router.use(bodyParser.json());

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
