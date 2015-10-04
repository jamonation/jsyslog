var test = require('tape')

test('config',
     function (t) {
	 t.plan(1)

	 var config = require('../config/config')

	 t.equal(typeof config, 'object', 'config is imported')
     }
)
