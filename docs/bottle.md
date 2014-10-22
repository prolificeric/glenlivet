# `new Bottle(config)`

Bottles create reusable workflows that are customized using plugins.

## `Bottle.serve(data, callback)`

Runs the bottle's workflow with `data` as input.

### `callback(err, context)`

`context` is an object that all middleware reads and writes to within the bottle's workflow.

## `Bottle.middleware(name, fn)`

## `Bottle.middleware(nameFnMap)`
