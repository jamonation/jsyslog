#!/usr/bin/env node

var bluebird = require('bluebird')
var fs = bluebird.promisifyAll(require('fs'))
var spawn = require('child_process').spawn

// only want start/stop/restart/status argument
var arg = process.argv.slice(2)[0]

var config = require('../config/config')


// start the child jsyslog process and detach parent
function spawn_child() {
  var child = spawn('node', ['./lib/jsyslog'], {
    detached: true,
    stdio: [ 'ignore', 'ignore', 'ignore' ]
  })
  fs.writeFileAsync(config.pid, child.pid)
    .then(function() {
      console.log('Spawned jsyslog process with pid %d', child.pid)
      child.unref() // forking is done, unfref lets this parent detach and shutdown
    })  
    .catch(function(err) {
      console.log('Could not write process pid, attempting to shutdown jsyslog')
      shutdown(child.pid).then(process.exit(1)) // something went splat, check file permissions?
    })
}


// shutdown a running jsyslog child if a pid exists
function signal_pid(pid, signal) {
  var d = bluebird.defer()
  process.kill(pid, signal, function(err) {
    if (err) {
      console.log('Error sending %s to process %d', signal, pid)
      d.reject(err)
    }
  })
  if (signal === 'SIGTERM') {
    console.log('Sent signal %s to process %d', signal, pid)
  }
  d.resolve()
  return d.promise
}


function log_pid(pid) {
  console.log('jsyslog pidfile %s with pid %d exists', config.pid, pid)
  return pid  
}


function error_pid(err) {
  if (err.errno === 'ESRCH') {
    // called stop on a pid for a process that doesn't exist. Bork.
    console.log('No jsyslog process responding to signals at pid %s', fs.readFileSync(config.pid))
    //console.log('Please check or remove %s.', config.pid)
    //console.log('Also check for a rogue (still running) jsyslog.js process')
    throw new Error(err)
    process.exit(1)  
  } else if (err.code === 'ENOENT') {
    console.log('No jsyslog process detected.')
    process.exit()
  }
}


// parse arg string for start/restart/stop and take appropriate action
if (arg === 'start') {
  fs.readFileAsync(config.pid) // check for a pid
    // pid exists, so just notify the user and then take no action
    .then(log_pid)
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
    .then(function(pid) {
      signal_pid(pid, 'SIGTERM') // be lazy, shutdown the server
    })
    .then(spawn_child) // then start up a new one
    .catch(function(err) {
      console.log('Something went wrong restarting')
      throw new Error(err)  
      process.exit(1)
    })
} else if (arg === 'stop') {
  fs.readFileAsync(config.pid) // check for a pid
    .then(function(pid) {
      signal_pid(pid, 'SIGTERM') // shutdown the server
    })
    .catch(Error, error_pid)
    .catch(function(err) {
      console.log('Something went wrong shutting down.')
      throw new Error(err)  
      process.exit(1)
    })
} else if (arg === 'status') {
  fs.readFileAsync(config.pid) // check for a pid
    .then(log_pid)
    .then(function(pid) {
      signal_pid(pid, 'SIGCHLD') // check the server exists
    })
    .catch(Error, error_pid)
    .catch(function(err) {
      console.log('\n\nSomething went disastrously wrong:')
      console.error('It looks like there is a detatched process with the wrong pid.')
      console.error('You MUST do the following:\n')
      console.error('1) Send SIGKILL signal to the running node ./lib/jsyslog.js process.')
      console.error('2) Remove the pid file in %s', config.pid)
      throw new Error(err)  
      process.exit(1)
    })
} else {
  console.error('Error. No argument given.\n' +
                'Please pass \'start\', \'stop\' or \'restart\' as an argument to jsyslog')
}

