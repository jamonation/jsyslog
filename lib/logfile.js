var fs = require('fs')
var helpers = require('./helpers')
var logger = require('./logger').setup_logger()
var queue = require('./queue')

const config = require('../config/config.js')

module.exports = {
  setup_logfile: function() {
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
    return logFile
  }
}
