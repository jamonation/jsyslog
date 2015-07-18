#!/usr/bin/env node

var bluebird = require('bluebird')
var fs = bluebird.promisifyAll(require('fs'))
var spawn = require('child_process').spawn

// only want start/stop/restart argument
var arg = process.argv.slice(2)[0]

var config = require('./config/config')


// start the child jsyslog process and detach parent
function spawn_child() {
  var child = spawn('node', ['./lib/jsyslog'], {
    detached: true,
    stdio: [ 'ignore', 'ignore', 'ignore' ]
  })
  fs.writeFileAsync(config.pid, child.pid + '\n')
    .then(function() {
      console.log('Spawned jsyslog process with pid %d', child.pid)
      child.unref() // forking is done, unfref lets this parent detach
    })  
    .catch(function(err) {
      console.log('Could not write process pid, attempting to shutdown jsyslog')
      throw new Error(err)  
      shutdown(child.pid).then(process.exit(1)) // something went splat
    })
}


// shutdown a running jsyslog child if a pid exists
function shutdown(pid) {
  var d = bluebird.defer()
  process.kill(pid, 'SIGTERM', function(err) {
    if (err) {
      console.log('Error sending SIGTERM to pid: ' + pid)
      d.reject(err)
    } else {
      d.resolve()
    }
  })
  console.log('Sent shutdown signal to process %d', pid)
  return d.promise
}


// parse arg string for start/restart/stop and take appropriate action
if (arg === 'start') {
  fs.readFileAsync(config.pid) // check for a pid
    // pid exists, so just notify the user and then take no action
    .then(function(pid) {        
      console.log('jsyslog process with pid %d detected, exiting', pid)
      process.exit()
    })
    // pid doesn't exist, so start up a child
    .catch(Error, function(err) {
      if (err.code === 'ENOENT') {
        spawn_child()
      }
    })
    // bustage
    .catch(function(err) {
       console.log('Something went wrong starting jsyslog, exiting')
       throw new Error(err)
       process.exit(1)
    })
} else if (arg === 'restart') {
  fs.readFileAsync(config.pid) // check for a pid
    .then(shutdown) // be lazy, shutdown the server
    .then(spawn_child) // then start up a new one
    .catch(function(err) {
      console.log('Something went wrong restarting')
      throw new Error(err)  
      process.exit(1)
    })
} else if (arg === 'stop') {
  fs.readFileAsync(config.pid) // check for a pid
    .then(shutdown) // shutdown the server
    .catch(Error, function(err, data) {
      if (err.errno === 'ESRCH') {
        // called stop on a pid for a process that doesn't exist. Bork.
        console.log('No jsyslog process detected. Please check %s. Exiting.',
                    fs.readFileSync(config.pid))
        process.exit()
      } else if (err.code === 'ENOENT') {
        console.log('No jsyslog process detected. Exiting.')
        process.exit()
      }
    })
    .catch(function(err) {
      console.log('Something went wrong shutting down.')
      throw new Error(err)  
      process.exit(1)
    })    
} else {
  console.error('Error. No argument given.\n' +
                'Please pass \'start\', \'stop\' or \'restart\'' +
                'as an argument to jsyslog')
}
