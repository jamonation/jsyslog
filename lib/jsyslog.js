#!/usr/bin/env node


var fs = require('fs')

const config = require('../config/config.js')
var logger = require('./logger').setup_logger()
var logFile = require('./logfile').setup_logfile()
var queue = require('./queue')
var helpers = require('./helpers')
var servers = require('./servers')


queue.on('message', function() {
  // TODO: look into using an offset & slice for increased performance  
  var message = queue.items[0] + '\n'
  logFile.write(message, 'ascii', queue.items.shift())
})


var server = {}


// clean up socket on exit 
var shutdown = function() {
    queue.items.push(helpers.create_message('received shutdown signal'))
    if (queue.items.length === 0) {  
        server.sock.close( function(err) {
            if (err) {
                logFile.write(helpers.create_message('Could not close socket!! ' + config.socketPath))
                process.exit(1)
            }
        })
    server.dgram.close()
        var message = helpers.create_message('Cleaned up socket ' + config.socketPath + ', exiting\n')
        fs.unlink('/tmp/jsyslog.pid', function(err) {
            if (err) {
                logger.warn(err)
            }
        })
        logFile.write(message, function() {
            logFile.end()
        })
        logFile.on('finish', function() {
            process.exit()
        })
    }
}



if (process.env.MODE !== 'TESTING') {
    servers.start_sock(server, queue)
    servers.start_dgram(server, queue)

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    process.on('SIGCHLD', function() {
	return null // don't do anything on SIGCHLD, signal is just used to check existence of process
    })
    
}

