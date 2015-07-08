var dgram = require('dgram'),
  events = require('events'),
  fs = require('fs'),    
  net = require('net')

const config = require('./config.js'),
  priorities = require('./levels.json')

var queue = new events.EventEmitter()
queue.offset = 0
queue.items = []
queue.items.push = function() {
  Array.prototype.push.apply(this, arguments);
  queue.emit('message') // emit a message event *after* push has been applied to queue.items array
  return this.length
}

function find_priority(buf) {
  var priority = 0,
    facility = 0,
    level = 0,
    offset = 0

  if (buf[2] == 62) {
    priority = parseInt(buf.slice(1,2), 10)
    offset = 3
  } else if (buf[3] == 62) {
    priority = parseInt(buf.slice(1,3), 10)
    offset = 4;
  } else if (buf[4] == 62) {
    priority = parseInt(buf.slice(1,4), 10)
    offset = 5;
  } else {
    priority = 0;
    console.log('unknown priority')
  }

  return [priority, offset]
}


function parse_data(data) {
  var priority_data = find_priority(data)
  var priority = priority_data[0],
    offset = priority_data[1],
    facility = priority >> 3, //bit shift instead of divide
    level = priority & 0x07 // and mask of 8 instead of % mod

   console.log('priority:', priority, '\t',
    'facility:', facility, '\t',
    'level:',  level)
  var message = (priorities.facilities[facility].name, priorities.levels[level].name,  data.slice(offset).toString())

  queue.items.push(message)
}


var logFile = fs.createWriteStream(config.syslogFile, {flags: 'r+', encoding: 'utf8', mode: 0640})

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
    .on('data', parse_data)
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


var server_sock = net.createServer(read_sock)
    server_sock.listen(config.socketPath) // do the needful, bind to the unix socket

var server_dgram = dgram.createSocket('udp4')
    server_dgram.bind(config.port, config.iface) // do the needful, bind the udp port


server_dgram
  .on('message', function(msg, rinfo) {
    // check that a message on udp port starts with <nnn> before parsing
    // though, rfc3164 says a udp message must not be discarded regardless
    if (msg[0] == 60 && (msg[2] == 62 || msg[3] == 62 || msg[3] == 62) ) {
      parse_data(msg)
    } else {
      console.log('malformed message from:' + rinfo)
      console.log(msg)
    }
  })
  .on('error', function(err) {
    console.log('error of some udp variety:' + err)
  })


server_sock
  .on('listening', function() {
    console.log('server listening')
    console.log('setting socket permissions')
    // server is listening, make the socket writable
    fs.chmodSync(config.socketPath, '0666')
  })
  .on('connection', function(c) {
    // not implemented
  })
  .on('end', function() {
    console.log('server end')
  })
  .on('error', function(err) {
    // maybe not so nice, but attempt to take over a socket
    // note: this is conditional on config.claimSocket being true,
    // so you have to deliberately be a jerk to take it over	
    if (err.errno === 'EADDRINUSE' && config.claimSocket === true) {
      console.log('attempting to clean up old socket')
      fs.unlink(config.socketPath, function(err) {
        if (err) {
          console.log('could not unlink ' + config.socketPath)
        } else {
          console.log('unlinked old socket at ' + config.socketPath)
          server_sock.listen(config.socketPath)
        }
      })
    } else {
      console.log(e)
    }
  })


/*
  clean up socket on exit 
*/
process
  .on('SIGINT', function() {
    fs.unlink(config.socketPath, function(err) {
      if (err) {
        console.log('could not unlink socket!! ' + config.socketPath)
        process.exit(1)
      } else {
        console.log('cleaned up socket ' + config.socketPath + ', exiting')
        process.exit()
      }
    })
  })
