var dgram = require('dgram')
var fs = require('fs')
var net = require('net')

const config = require('./config/config.js')
var logger = require('./lib/logger')()
var queue = require('./lib/queue')
var helpers = require('./lib/helpers')


var server_sock = net.createServer(read_sock)
  server_sock.listen(config.socketPath) // do the needful, bind to the unix socket

var server_dgram = dgram.createSocket('udp4')
  server_dgram.bind(config.port, config.iface) // do the needful, bind the udp port

var logFile = fs.createWriteStream(config.syslogFile, {flags: 'a', mode: '0640', encoding: 'utf8'})

logFile
  .on('open', function() {
    var message = helpers.create_message('opened ' + config.syslogFile + ' for logging')
    logger.debug(message)
    queue.items.push(message)
  })
  .on('error', function(err) {
    logger.error('could not create write stream:' + err)
  })


queue.on('message', function() {
  // TODO: look into using an offset & slice for increased performance  
  var message = queue.items[0] + '\n'
  logFile.write(message, 'ascii', queue.items.shift())
})

/*
  listen for various emitted Events
*/
function read_sock(sock) {
  sock
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
}


server_dgram
  .on('message', function(msg, rinfo) {
    // check that a message on udp port starts with <nnn> before parsing
    // though, rfc3164 says a udp message must not be discarded regardless
    if (msg[0] == 60 && (msg[2] == 62 || msg[3] == 62 || msg[3] == 62) ) {
      queue.items.push(helpers.parse_data(msg))
    } else {
      logger.error('malformed message from:', rinfo)
      logger.error(msg.toString())
    }
  })
  .on('error', function(err) {
    logger.error('error of some udp variety:' + err)
  })


server_sock
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
  .on('error', function(err) {
    // maybe not so nice, but attempt to take over a socket
    // note: this is conditional on config.claimSocket being true,
    // so you have to deliberately be a jerk to take it over	
    if (err.errno === 'EADDRINUSE' && config.claimSocket === true) {
      logger.info(helpers.create_message('attempting to clean up old socket'))
      fs.unlink(config.socketPath, function(err) {
        if (err) {
          logger.error(helpers.create_message('could not unlink ' + config.socketPath))
        } else {
          logger.info(helpers.create_message('unlinked old socket at ' + config.socketPath))
          server_sock.listen(config.socketPath)
        }
      })
    } else {
      logger.error(helpers.create_message(err))
    }
  })


/*
  clean up socket on exit 
*/
process
  .on('SIGINT', function() {
    fs.unlink(config.socketPath, function(err) {
      if (err) {
        logger.error(helpers.create_message('Could not unlink socket!! ' + config.Socketpath))
        process.Exit(1)
      } else {
        logger.info(helpers.create_message('Cleaned up socket ' + config.Socketpath + ', exiting'))
        process.exit()
      }
    })
  })
