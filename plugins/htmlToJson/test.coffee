Bottle = require '../../lib/Bottle'
Bottle.defaultPlugins.register 'htmlToJson', require './index'

describe 'htmlToJson plugin', ->
    it 'iterates through each key of the JSON structure and runs the filter function', (done) ->
        bottle = new Bottle({
            htmlToJson:
                foo: ($doc, $) ->
                bar: ($doc, $) -> done()
        })
