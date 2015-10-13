#!/usr/bin/env node

var bluebird = require('bluebird')
var fs = bluebird.promisifyAll(require('fs'))
var spawn = require('child_process').spawn

var processPromise = bluebird.promisifyAll(process)

// only want start/stop/restart/status argument
var arg = process.argv.slice(2)[0]

var config = require('../config/config')


// start the child jsyslog process and detach parent
var spawn_child = function() {
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
      child.kill('SIGTERM').then(process.exit(1)) // something went splat, check file permissions?
    })
}


/*
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
}*/


// shutdown a running jsyslog child if a pid exists
var signal_pid = function(pid, signal) {
    // this is stupid and shouldn't be required. write better tests.
    // right now, if a socket exists, e.g. after testing and jsyslog stop is called
    // it will throw an ESRCH exception. this should not happen. stupid.
    if (process.env.MODE !== 'TESTING') {
	return fs.unlinkAsync(config.pid)
	    .then(function() {
		fs.unlinkAsync(config.socketPath)
	    })
	    .then(function() {
		processPromise.killAsync(pid, signal)
	    })
	    .then(function() {
		console.log('Server stopped. Exiting.')
            })
	    .catch(Error, error_pid)	
            .catch(function(err) {
		return err
	    })
    } else {
      	return processPromise.killAsync(pid, signal)
	    .then(function() {
		fs.unlink(config.socketPath)   
	    })	
	    .catch(Error, error_pid)
    }
}


var log_pid = function(pid) {
  console.log('jsyslog pidfile %s with pid %d exists', config.pid, pid)
  return pid  
}


var error_pid = function(err) {
  if (err.errno === 'ESRCH') {
    // called stop on a pid for a process that doesn't exist. Bork.
    console.log('No jsyslog process responding to signals at pid %s. Exiting.', fs.readFileSync(config.pid))
    /* istanbul ignore if */        
    if (process.env.MODE !== 'TESTING') {
      //throw new Error(err)	  
      process.exit(1)
    } else {
      return err
    }
  } else if (err.code === 'ENOENT') {
    console.log('No jsyslog process detected.')
    /* istanbul ignore if */
    if (process.env.MODE !== 'TESTING') {  
      process.exit()
    } else {
      return err
    }
  }
}

var daemon_action = function(action) {
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
	    .catch(spawn_child) // a process doesn't exist, so start one before really failing harrrrrd
	    .catch(function(err) {
		console.log('Something went wrong restarting. Exiting.')
		throw new Error(err)  
		process.exit(1)
	    })
    } else if (arg === 'stop') {
	fs.readFileAsync(config.pid) // check for a pid
	    .then(function(pid) {
		signal_pid(pid, 'SIGTERM') // shutdown the server
		    .catch(Error, error_pid) // gracefully handle ENOENT/ESRCH errors
	    })
	    .catch(Error, error_pid) // gracefully handle ENOENT/ESRCH errors
	    .catch(function(err) {
	        console.dir(err)	    
		console.log('Something went wrong shutting down.')
		throw new Error(err)  
		process.exit(1)
	    })
    } else if (arg === 'status') {
	fs.readFileAsync(config.pid) // check for a pid
	    .then(log_pid)
	    .then(function(pid) {
		signal_pid(pid, 'SIGCHLD') // check the server exists
		  .catch(Error, error_pid) // gracefully handle ENOENT/ESRCH errors
            })
	    .catch(Error, error_pid) // gracefully handle ENOENT/ESRCH errors
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

}

if (process.env.MODE !== 'TESTING') {
    daemon_action(arg)
}

module.exports = {
    arg: arg,
    daemon_action: daemon_action,
    error_pid: error_pid,
    log_pid: log_pid,
    signal_pid: signal_pid,
    spawn_child: spawn_child
}
