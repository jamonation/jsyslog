var dgram = require('dgram')
var fs = require('fs')
var net = require('net')
var P = require('bluebird')

const config = require('../config/config.js')
var logger = require('./logger').setup_logger()
var queue = require('./queue')
var helpers = require('./helpers')

module.exports = {

  listen_sock: function(server) {
    server.sock
      .on('listening', function() {
        logger.info(helpers.create_message('server listening'))
        logger.info(helpers.create_message('setting socket permissions'))
        // server is listening, make the socket writable
        fs.chmodSync(config.socketPath, '0666')
      })
      .on('connection', function(c) {
        // not implemented
      })
      .on('end', function() {
        logger.info(helpers.create_message('server end'))
      })
      .on('error', claim_socket)
    },

    read_sock: function(server) {
      //console.dir(sock)
      server.sock
        .on('data', function(data) {
          queue.items.push(helpers.parse_data(data))
        })
        .on('close', function() {
          // not implemented    
        })
        .on('finish', function() {
          // not implemented    
        })
        .on('end', function() {
          // not implemented    
        })    
    },

    listen_dgram: function(server) {
      return server.dgram
        .on('message', function(msg, rinfo) {
          // check that a message on udp port starts with <nnn> before parsing
          // though, rfc3164 says a udp message must not be discarded regardless
          if (msg[0] === 60 && (msg[2] === 62 || msg[3] === 62 || msg[3] === 62) ) {
            queue.items.push(helpers.parse_data(msg))
          } else {
            logger.error('malformed message from:', rinfo)
            logger.error(msg.toString())
          }
        })
        .on('error', function(err) {
          logger.error('error of some udp variety:' + err)
        })
    }
}

/* TODO: deprecate/remove this */
var claim_socket = (function(err) {
  // maybe not so nice, but attempt to take over a socket
  // note: this is conditional on config.claimSocket being true,
  // so you have to deliberately be a jerk to take it over	
  if (err.errno === 'EADDRINUSE' && config.claimSocket === true) {
    logger.info(helpers.create_message('attempting to clean up old socket'))
    fs.unlink(config.socketPath, function(err) {
      if (err) {
        logger.error(helpers.create_message('could not unlink ' + config.socketPath))
        throw new Error(err)  
        process.exit(1)
      } else {
        logger.info(helpers.create_message('unlinked old socket at ' + config.socketPath))
        server.sock.listen(config.socketPath)
      }
    })
  } else {
    logger.error(helpers.create_message('socket already exists and config.claimSocket is false, bailing out'))
    logger.error(helpers.create_message(err))
    throw new Error(err)
    process.exit(1)
  }
})
