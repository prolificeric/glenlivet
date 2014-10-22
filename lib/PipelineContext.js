var util = require('util');
var EventEmitter = require('events').EventEmitter;

function PipelineContext (data) {
    EventEmitter.call(this);
    this.data = data || {};
    this._promises = {};
}

util.inherits(PipelineContext, EventEmitter);

PipelineContext.prototype.defer = function (name, constructor) {
    var deferred = Q.defer();
    this.promises[name] = deferred.promise;
    constructor.call(this, deferred);
    return this;
};

PipelineContext.prototype.when = function (name) {
    var promise = this._promises[name];

    if (!promise) {
        throw new Error('promise does not exist: ' + name);
    }

    return promise;
};

module.exports = PipelineContext;
