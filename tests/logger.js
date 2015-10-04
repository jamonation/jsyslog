var test = require('tape')

test('logger',
     function (t) {
	 t.plan(2)

	 var logger = require('../lib/logger')
	 
	 t.equal(typeof logger, 'object', 'logger is imported')
	 t.equal(typeof logger.setup_logger(), 'object', 'logger setup returns object')
     }
)
