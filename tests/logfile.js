var test = require('tape')

test('logfile',
     function (t) {
	 t.plan(2)

	 var logfile = require('../lib/logfile')
	 
	 t.equal(typeof logfile, 'object', 'logfile is imported')
	 t.equal(typeof logfile.setup_logfile(), 'object', 'logfile setup returns object')
     }
)
