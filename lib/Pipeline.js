var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Node = require('./Node');
var PipelineContext = require('./PipelineContext');

function Pipeline (steps) {
    EventEmitter.call(this);

    this._middleware = {};
    this.root = new Node();

    if (steps) {
        _.each(steps, function (stepName) {
            this.root.appendChild(new Node({
                name: stepName
            }))
        }, this);
    }
}

util.inherits(Pipeline, EventEmitter);

Pipeline.prototype.middleware = function (path, callback) {
    if (typeof path === 'object') {
        for (k in path) if (path.hasOwnProperty(k)) {
            this.middleware(k, path[k]);
        }
    } else {
        var middleware = this._middleware;
        (middleware[path] = middleware[path] || []).push(callback);
    }

    return this;
};

Pipeline.prototype.before = function (path, name) {
    return this._addStepOrdinally('before', false, path, name);
};

Pipeline.prototype.after = function (path, name) {
    return this._addStepOrdinally('after', false, path, name);
};

Pipeline.prototype.prependTo = function (path, names) {
    return this._addStepOrdinally('before', true, path, names);
};

Pipeline.prototype.appendTo = function (path, names) {
    return this._addStepOrdinally('after', true, path, names);
};

Pipeline.prototype._addStepOrdinally = function (beforeOrAfter, doInsertWithin, path, names) {
    if (typeof path === 'object') {
        for (var k in path) if (path.hasOwnProperty(k)) {
            this._addStepOrdinally(beforeOrAfter, doInsertWithin, k, path[k]);
        }

        return this;
    }

    var step = this.root.findByPath(path);

    if (step) {
        if (typeof names === 'string') {
            names = [names];
        }

        _.each(names, function (name) {
            var child = new Node({
                name: name
            });

            if (doInsertWithin) {
                step[beforeOrAfter === 'before'? 'prependChild': 'appendChild'](child);
            } else {
                step[beforeOrAfter](child);
            }
        });
    } else {
        throw new Error('step does not exist: ' + path);
    }

    return this;
};

Pipeline.prototype.exec = function (data, _done) {
    var context = new PipelineContext(data);
    var middleware = this._middleware;
    var root = this.root;
    var cursor = root;
    var shouldSkip = {};

    if (!this.root.hasChildren()) {
        done();
        return this;
    }

    function done () {
        if (_done) {
            process.nextTick(function () {
                _done(null, context);
            });
        }
    }

    done.error = function (err) {
        if (_done) {
            process.nextTick(function () {
                _done(err, context);
            });
        }
    };

    function nextStep () {
        if (cursor.hasChildren()) {
            traverseChildren();
        } else {
            traverseSiblings();
        }
    }

    function traverseChildren () {
        cursor = cursor.children[0];
        runCurrentStep();
    }

    function runCurrentStep () {
        var path = cursor.getPath();

        hook('before ' + path, function () {
            hook(path, nextStep);
        });
    }

    function traverseSiblings () {
        hook('after ' + cursor.getPath(), function () {
            var sibling = cursor.nextSibling();

            if (sibling === null) {
                traverseUp();
            } else {
                cursor = sibling;
                runCurrentStep();
            }
        });
    }

    function traverseUp () {
        cursor = cursor.parent;

        if (!cursor || cursor.is(root)) {
            done();
        } else {
            traverseSiblings();
        }
    }

    function hook (stepName, callback) {
        if (shouldSkip[stepName]) {
            callback(context);
            return;
        }

        var stack = middleware[stepName];

        if (stack) {
            runCallbackStack(stack.slice(0), callback);
        } else {
            callback(context);
        }
    }

    function runCallbackStack (stack, didRunStack) {
        function nextCallback () {
            var callback = stack.shift();

            if (callback) {
                if (callback.length > 1) {
                    callback(context, nextCallback, done, didRunStack);
                } else {
                    if (callback(context) === false) {
                        done();
                    } else {
                        process.nextTick(nextCallback);
                    }
                }
            } else {
                process.nextTick(didRunStack);
            }
        }

        nextCallback.skip = function (steps) {
            //Normalize steps argument to array
            if (typeof steps === 'string') {
                steps = [steps];
            }

            _.each(steps, function (step) {
                shouldSkip[step] = true;
            });

            nextCallback();
        };

        nextCallback();
    }

    nextStep();

    return this;
};

module.exports = Pipeline;
