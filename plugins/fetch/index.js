var _ = require('lodash');
var request = require('request');

function paramMiddleware (config, type, processVals) {
    return function (context, next, done) {
        var missingParams = [];
        var params = config.params[type];
        var vals = {};

        _.each(params, function (spec, name) {
            var val;

            //The data type of the spec determines its behavior
            switch (typeof spec) {

                //Function calculates the value
                case 'function':
                    val = spec(context);
                    break;

                //Boolean for whether or not it's required
                case 'boolean':
                    val = context.data[name];

                    if (!val && spec === true) {
                        missingParams.push(name);
                    }

                    break;

                //Any other type is assigned as the value
                default:
                    val = spec;
                    break;

            }

            vals[name] = context.data[name] = val;
        });

        processVals(vals, context);

        if (missingParams.length > 0) {
            done.error(new MissingParamsError(type, missingParams));
        } else {
            next();
        }
    };
}

function MissingParamsError (type, names) {
    return new Error(type + ' params missing: ' + names.join(', '));
}

module.exports = function (config) {
    this.appendTo({
            'setup': ['fetch'],
            'process': ['fetch'],
            'filter': ['fetch']
        })
        .appendTo({
            'setup:fetch': ['method', 'uri', 'qs', 'json', 'form', 'headers']
        })
        .middleware({
            'before setup:fetch': function (context) {
                context.fetch = {};
                context.fetch.requestOptions = _.cloneDeep(config.requestOptions || {});
            },
            'setup:fetch:method': function (context) {
                context.fetch.requestOptions.method = (config.method || 'GET').toLowerCase();
            },
            'setup:fetch:uri': paramMiddleware(config, 'uri', function (vals, context) {
                var uri = config.uri;

                _.each(vals, function (v, k) {
                    uri = uri.replace(new RegExp('\\{'+k+'\\}', 'g'), v);
                });

                context.fetch.requestOptions.uri = uri;
            }),
            'setup:fetch:qs': paramMiddleware(config, 'qs', function (vals, context) {
                context.fetch.requestOptions.qs = vals;
            }),
            'setup:fetch:json': function (context, next) {
                var json = config.params.json;

                if (!json) {
                    next();
                    return;
                }

                if (typeof json === 'function') {
                    json = json(context);
                }

                context.fetch.requestOptions.json = json;

                next.skip('setup:fetch:form');
            },
            'setup:fetch:form': paramMiddleware(config, 'form', function (vals, context) {
                context.fetch.requestOptions.form = vals;
            }),
            'setup:fetch:headers': paramMiddleware(config, 'headers', function (vals, context) {
                context.fetch.requestOptions.headers = vals;
            }),
            'process:fetch': function (context, next) {
                context.fetch.request = request(context.fetch.requestOptions, function (err, response, body) {
                    if (err) {
                        return done.error(err);
                    }

                    context.fetch.response = response;
                    next();
                });
            }
        });
};
