#!/usr/bin/env node

var dgram = require('dgram')
var fs = require('fs')
var net = require('net')

const config = require('../config/config.js')
var logger = require('./logger').setup_logger()
var logFile = require('./logfile').setup_logfile()
var queue = require('./queue')
var helpers = require('./helpers')
var socket = require('./sockets')

var server = {}

var start_sock = (function() {
  server.sock = net.createServer(socket.read_sock)
  server.sock.listen(config.socketPath) // do the needful, bind to the unix socket
  socket.listen_sock(server)
})()

var start_dgram = (function() {
  server.dgram = dgram.createSocket('udp4')
  server.dgram.bind(config.port, config.iface) // do the needful, bind the udp port
  socket.listen_dgram(server)
})()


queue.on('message', function() {
  // TODO: look into using an offset & slice for increased performance  
  var message = queue.items[0] + '\n'
  logFile.write(message, 'ascii', queue.items.shift())
})


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
    fs.unlink('/tmp/jsyslog.pid')  
    logFile.write(message, function() {
      logFile.end()
    })
    logFile.on('finish', function() {
      process.exit()
    })
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGCHLD', function() {
  return null // don't do anything on SIGCHLD, signal is just used to check existence of process
})
