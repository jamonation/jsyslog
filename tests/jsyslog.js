var test = require('tape')

var dgram = require('dgram')
var fs = require('fs')
var net = require('net')

test('jsyslog lib',
     function (t) {
	 t.plan(1)

	 var jsyslog = require('../lib/jsyslog')
	 
	 t.equal(typeof jsyslog, 'object', 'jsyslog is imported')
	 var server = {}
	 server.sock = net.createServer()
	 server.sock.listen('/tmp/jsyslog.test.sock')
	 server.dgram = dgram.createSocket('udp4')
	 server.dgram.bind(55514, 'localhost')
	 jsyslog.shutdown(server)
     }
)

test('jsyslog bin',
     function (t) {
	 //t.plan(6)

	 var jsyslog = require('../bin/jsyslog')
	 var config = require('../config/config.js')	 
	 
	 t.equal(typeof jsyslog, 'object', 'jsyslog is imported')
         jsyslog.daemon_action('status')
	 jsyslog.spawn_child()
	 t.equal(jsyslog.log_pid(process.pid), process.pid, 'log_pid returns correct process.pid')
	 var sigusr = jsyslog.signal_pid(process.pid, 'SIGUSR1')
	 t.equal(typeof sigusr, 'object', 'SIGUSR1 sent to signal_pid returns a promise')

	 // this test is a little funky, needs to catch the promise rejection, which is a thrown error
	 jsyslog.signal_pid(process.pid, 'SIGFOO')
	     .catch(function(err) { t.throws(err, 'signal SIGFOO throws an error') })

         // try to kill a non-existent pid and catch the rejected promise
	 jsyslog.signal_pid(100000000, 'SIGTERM')
	     .catch(function(err) { t.throws(err, 'sigterm sent to non-existent pid throws an error') }) 
				    
	 var err_enoent = new Error('ENOENT, readlink /tmp/foo')
         err_enoent.code = 'ENOENT'
         err_enoent.errno = 34
         err_enoent.path = '/tmp/foo'
	 t.throws(jsyslog.error_pid(err_enoent), 'error_pid sent ENOENT returns error in place of process.exit')

	 var err_esrch = new Error('ESRCH, readlink /tmp/foo')
         err_esrch.code = 'ESRCH'
         err_esrch.errno = 'ESRCH'
	 t.throws(jsyslog.error_pid(err_esrch), 'error_pid sent ESRCH returns error in place of process.exit')

         t.end()
     }
)
