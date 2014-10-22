Node = require '../lib/Node'

describe 'Node object', ->
    root = new Node
    foo = new Node
        name: 'foo'
    bar = new Node
        name: 'bar'
    biz = new Node
        name: 'biz'
    baz = new Node
        name: 'baz'

    root.appendChild foo
    foo.appendChild bar
    foo.appendChild biz
    bar.appendChild baz

    describe 'getPath', ->
        it 'returns node names joined by :', ->
            foo.getPath().should.equal 'foo'
            baz.getPath().should.equal 'foo:bar:baz'
    describe 'findByPath', ->
        it 'returns a node that matches path', ->
            node = root.findByPath 'foo:bar:baz'
            node.id.should.equal baz.id
        it 'returns null if no node matches the path', ->
            node = root.findByPath 'foo:bar:a'
            (node is null).should.be.true
