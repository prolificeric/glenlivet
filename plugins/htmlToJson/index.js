var cheerio = require('cheerio');
var _ = require('lodash');

function htmlToJson (config) {
    this.middleware({
        'setup': function (context) {
            context.htmlToJson = {};
        },
        'filter:fetch': function (context) {
            var $ = cheerio.load(context.fetch.response.body);

            context.htmlToJson.json = new ParseContext({
                $: $,
                $el: $.root(),
                structure: config
            }).parse();
        }
    });
}

function ParseContext (data) {
    _.defaults(this, data, {
        $el: null,
        $: null,
        structure: {}
    });
}

ParseContext.prototype.parse = function () {
    var data;

    if (this.structure instanceof Array) {
        data = this.map(this.structure[0], this.structure[1]);
    } else {
        data = {};

        _.each(this.structure, function (filter, key) {
            var handler = typeHandlers[typeof filter];
            data[key] = handler? handler(filter, this): filter;
        }, this);
    }

    return data;
};

ParseContext.prototype.map = function (selector, structure) {
    var parseContext = this;
    var $ = parseContext.$;
    var results = [];

    this.$el.find(selector).each(function () {
        var result = new ParseContext({
            $: $,
            $el: $(this),
            structure: structure
        }).parse();

        results.push(result);
    });

    return results;
};

var typeHandlers = {
    'string': function (filter, parseContext) {
        var ops = filter.split(/ ?-> ?/);
        var selector = ops.shift();

        if (selector === '') {
            result = parseContext.$el;
        } else {
            result = parseContext.$el.find(selector).eq(0);
        }

        if (ops.length > 0) {
            _.each(ops, function (op) {
                result = eval('result.' + op);
            });

            return result;
        } else {
            return result.text();
        }
    },
    'object': function (filter, parseContext) {
        var subparse = new ParseContext(parseContext);
        subparse.structure = filter;
        return subparse.parse();
    },
    'function': function (filter, parseContext) {
        return filter.call(
            parseContext,
            parseContext.$el,
            parseContext.$
        );
    }
};

module.exports = _.extend(htmlToJson, {
    ParseContext: ParseContext,
    extend: function (name, method) {
        ParseContext.prototype[name] = method;
        return this;
    }
});
