var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Node (options) {
    EventEmitter.call(this);

    options = options || {};

    this.children = [];
    this.parent = options.parent || null;
    this.attributes = options.attributes || {};
    this.id = options.id || Node.generateId();
    this.name = options.name || this.id;
}

util.inherits(Node, EventEmitter);

Node.NAME_SEPARATOR = ':';

Node.generateId = function () {
    return Date.now() + Math.random().toString().replace('.', '');
};

Node.prototype.attr = function (key, value) {
    if (!value) {
        return this.getAttribute(key);
    } else {
        return this.setAttribute(key, value);
    }
};

Node.prototype.getAttribute = function (key) {
    return this.attributes[key];
};

Node.prototype.setAttribute = function (key, value) {
    this.attributes[key] = value;
    return this;
};

Node.prototype.is = function (node) {
    return this.id === node.id;
};

Node.prototype.appendChild = function (node) {
    this.removeChild(node);
    this.children.push(node);
    node.parent = this;
    return this;
};

Node.prototype.prependChild = function (node) {
    this.removeChild(node);
    this.children.unshift(node);
    node.parent = this;
    return this;
};

Node.prototype.removeChild = function (node) {
    var index = node.getIndex();

    if (index > -1) {
        this.children.splice(index, 1);
        node.parent = null;
    }

    return this;
};

Node.prototype.getIndex = function () {
    var parentChildren = this.hasParent() && this.parent.children;

    if (parentChildren) {
        for (var i = 0; i < parentChildren.length; i += 1) {
            if (parentChildren[i].is(this)) {
                return i;
            }
        }
    }

    return -1;
};

Node.prototype.remove = function () {
    if (this.parent) {
        this.parent.removeChild(this);
    }

    return this;
};

Node.prototype.replaceWith = function (node) {
    var index = this.getIndex();

    if (index > -1) {
        node.remove();
        this.parent.children.splice(index, 1, node);
        node.parent = this.parent;
        this.parent = null;
    }

    return this;
};

Node.prototype.replace = function (node) {
    node.replaceWith(this);
    return this;
};

Node.prototype.before = function (node) {
    var index = this.getIndex();

    if (index > -1) {
        node.remove();
        this.parent.children.splice(index, 0, node);
        node.parent = this.parent;
    }

    return this;
};

Node.prototype.after = function (node) {
    var index = this.getIndex();

    if (index > -1) {
        node.hasParent() && node.parent.removeChild(node);
        this.parent.children.splice(index + 1, 0, node);
        node.parent = this.parent;
    }

    return this;
};

Node.prototype.hasChildren = function () {
    return this.children.length > 0;
};

Node.prototype.hasParent = function () {
    return !!this.parent;
};

Node.prototype.nextSibling = function () {
    return this.parent.children[this.getIndex() + 1] || null;
};

Node.prototype.previousSibling = function () {
    return this.parent.children[this.getIndex() + 1] || null;
};

Node.prototype.flattenDescendants = function () {
    var nodes = [];
    var child;

    for (var i = 0; i < this.children.length; i += 1) {
        child = this.children[i];
        nodes.push(child);
        nodes = nodes.concat(child.flattenDescendants);
    }

    return nodes;
};

Node.prototype.getPath = function () {
    var parts = [];
    var node = this;

    while (node && node.hasParent()) {
        parts.unshift(node.name);
        node = node.parent;
    }

    return parts.join(Node.NAME_SEPARATOR);
};

Node.prototype.findByPath = function (path) {
    var node = this;
    var names = path.split(Node.NAME_SEPARATOR);
    var name;
    var child;
    var matched;
    var i;

    while (node && names.length > 0) {
        name = names.shift();

        for (i = 0; i < node.children.length; i += 1) {
            child = node.children[i];
            matched = child.name === name;

            if (matched) {
                node = child;
                break;
            }
        }

        if (!matched) {
            return null;
        }
    }

    return node;
};

module.exports = Node;
