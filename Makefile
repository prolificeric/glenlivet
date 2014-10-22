test:
	node_modules/.bin/mocha --require should --compilers coffee:coffee-script/register --reporter spec test/ plugins/*/test.coffee

.PHONY: all test
