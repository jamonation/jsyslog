var test = require('tape')

var servers = require('../lib/servers')
var queue = require('../lib/queue')

test('servers',
     function (t) {	 
	 t.plan(1)
	 t.equal(typeof servers, 'object', 'servers is imported')	 
     })
	 
test('server socket',
     function (t) {
	 t.plan(1)

	 var server = {}
	 servers.start_sock(server)
	 t.ok(server, 'start socket')
	 server.sock.unref()
     })

test('server dgram',
     function (t) {
	 t.plan(1)

	 var server = {}	 
	 servers.start_dgram(server), 	 
	 t.ok(server, 'start udp socket')
	 server.dgram.unref()
     })
