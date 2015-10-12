var test = require('tape')


test('jsyslog',
     function (t) {
	 t.plan(1)

	 var jsyslog = require('../lib/jsyslog')
	 
	 t.equal(typeof jsyslog, 'object', 'jsyslog is imported')
     }
)
