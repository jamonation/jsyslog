var test = require('tape')

test('queue',
     function (t) {
	 t.plan(3)
	 var queue = require('../lib/queue')

	 t.equal(typeof queue, 'object', 'queue module returns an object')
	 t.equal(typeof queue.items.push, 'function', 'queue.items.push is a function')

	 queue.items.push('test1')
	 var queue_length = queue.items.push('test2')
         t.equal(queue_length, 2, 'queue.items.push returns length of queue')

	 queue.on('message', function() {
	     t.ok('queue.items.push returns EventEmitter event named \'message\'')
	 })
     })
