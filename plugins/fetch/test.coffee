Bottle = require '../../lib/Bottle'
Bottle.defaultPlugins.register 'fetch', require './index'

describe 'Fetch plugin', ->
    describe 'param setup', ->
        standardParamTests = (type) ->
            it 'should return a missing params error if required value is not passed', (done) ->
                bottle = new Bottle
                    fetch:
                        method: 'GET'
                        uri: 'http://mysite.com/{a}'
                        params: {}
                bottle.config.fetch.params[type] = {
                    a: true
                }

                bottle.middleware 'before process', (context, next, abort) -> abort()

                bottle.serve {}, (err, context) ->
                    err.should.be.an.instanceOf Error
                    done()

            it 'should use a default value if none is passed and spec specifies string, number, or object', (done) ->
                bottle = new Bottle
                    fetch:
                        method: 'GET'
                        uri: 'http://mysite.com/{a}/{b}/{c}'
                        params: {}
                bottle.config.fetch.params[type] = {
                    a: 'foo'
                    b: 5
                    c: {
                        test: true
                    }
                }

                bottle.middleware 'before process', (context, next, abort) -> abort()

                bottle.serve {}, (err, context) ->
                    context.data.a.should.equal 'foo'
                    context.data.b.should.equal 5
                    context.data.c.test.should.equal true
                    done()

            it 'should calculate a value if the spec is a function', (done) ->
                bottle = new Bottle
                    fetch:
                        method: 'GET'
                        uri: 'http://mysite.com/{a}'
                        params: {}
                bottle.config.fetch.params[type] = {
                    a: -> 'foo'
                }

                bottle.middleware 'before process', (context, next, abort) -> abort()

                bottle.serve {}, (err, context) ->
                    context.data.a.should.equal 'foo'
                    done()

        simpleParamMappingTests = (type) ->
            it 'maps param values to request options', (done) ->
                bottle = new Bottle
                    fetch:
                        method: 'GET'
                        uri: 'http://mysite.com'
                        params: {}
                params = bottle.config.fetch.params
                params[type] =
                    a: 'foo'
                    b: 'bar'

                bottle.middleware
                    'before process': (context, next, _done) -> _done()
                bottle.serve {}, (err, context) ->
                    typeOptions = context.fetch.requestOptions[type]
                    typeOptions.a.should.equal params[type].a
                    typeOptions.b.should.equal params[type].b
                    done()

        describe 'qs', ->
            standardParamTests 'qs'
            simpleParamMappingTests 'qs'

        describe 'form', ->
            standardParamTests 'form'
            simpleParamMappingTests 'form'

        describe 'headers', ->
            standardParamTests 'headers'
            simpleParamMappingTests 'headers'

        describe 'json', ->
            it 'should be mutually exclusive with form params', (done) ->
                bottle = new Bottle
                    fetch:
                        method: 'POST'
                        uri: 'http://mysite.com'
                        params:
                            json: (context) ->
                                x: 5
                            form:
                                foo: 'bar'

                bottle.middleware 'before process', (context, next, abort) -> abort()

                bottle.serve {}, (err, context) ->
                    (typeof context.fetch.requestOptions.form).should.equal 'undefined'
                    done()

            it 'should use the result of a function as the json value', (done) ->
                bottle = new Bottle
                    fetch:
                        method: 'POST'
                        uri: 'http://mysite.com'
                        params:
                            json: (context) ->
                                x: 5

                bottle.middleware 'before process', (context, next, abort) -> abort()

                bottle.serve {}, (err, context) ->
                    context.fetch.requestOptions.json.x.should.equal 5
                    done()

        describe 'uri', ->
            standardParamTests 'uri'

            it 'replaces params within uri string', (done) ->
                bottle = new Bottle
                    fetch:
                        method: 'GET'
                        uri: 'http://mysite.com/{a}/{b}'
                        params:
                            uri:
                                a: true
                                b: true

                bottle.middleware 'before process', (context, next, abort) -> abort()

                bottle.serve
                    a: 5
                    b: 10
                , (err, context) ->
                    context.fetch.requestOptions.uri.should.equal 'http://mysite.com/5/10'
                    done()
