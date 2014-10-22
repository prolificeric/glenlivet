Pipeline = require '../lib/Pipeline'

describe 'Pipeline object', ->
    describe 'appendTo', ->
        it 'adds list of children to a node given a path', ->
            pipeline = new Pipeline ['foo', 'bar']
            pipeline.appendTo 'foo', ['biz', 'baz']
            node = pipeline.root.findByPath 'foo:biz'
            (node isnt null).should.be.true
            node.getPath().should.equal 'foo:biz'
        it 'for object passed as a first argument, uses keys as paths and values as child names', ->
            pipeline = new Pipeline ['foo', 'bar']
            pipeline.appendTo
                foo: ['a', 'b']
                bar: ['c', 'd']
            a = pipeline.root.findByPath 'foo:a'
            b = pipeline.root.findByPath 'foo:b'
            c = pipeline.root.findByPath 'bar:c'
            d = pipeline.root.findByPath 'bar:d'
            a.getPath().should.equal 'foo:a'
            b.getPath().should.equal 'foo:b'
            c.getPath().should.equal 'bar:c'
            d.getPath().should.equal 'bar:d'
        it 'throws an error when a path does not exist', ->
            pipeline = new Pipeline ['a', 'b']
            test = -> pipeline.appendTo 'foo', ['bar']
            test.should.throw()
    describe 'Bug Fixes', ->
        it 'should execute the same way every time', (done) ->
            pipeline = new Pipeline(['setup'])

            pipeline.middleware
                'setup': (context) ->
                    context.x = 10

            pipeline.exec {}, (err, context) ->
                context.x.should.equal 10

                pipeline.exec {}, (err, context) ->
                    context.x.should.equal 10
                    done()
