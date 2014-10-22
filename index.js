var glenlivet = require('./lib');
var request = require('request');
var _ = require('lodash');
var express = require('express');
var app = express();

var prolific = glenlivet.createBarrel({
	api: true
});

prolific.plugins.loadFromDirectory('./plugins');

prolific.bottle('getHomeLinks', {
	fetch: {
		uri: 'http://www.prolificinteractive.com',
		params: {}
	},
	htmlToJson: ["a", {
		"text": function ($a) {
			return $a.text();
		},
		"link": function ($a) {
			return $a.attr('href');
		}
	}],
	api: {
		method: 'GET',
		route: '/things/:id',
		params: {
			id: function (req) {
				return req.param('id');
			}
		},
		returnPath: 'htmlToJson.json'
	}
});

app.use(prolific.api());
app.listen(8889);
