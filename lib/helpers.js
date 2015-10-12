var os = require('os')
var strftime = require('strftime')

var logger = require('./logger').setup_logger()

const config = require('../config/config.js')
const priorities = require('../config/levels.json')

module.exports = {

  // lives here for testing purposes
  _now_date: function() {
    return strftime(config.dateFormat)
  },

  // lives here for testing purposes
  _find_priority: function(buf) {
    var priority = 0,
      facility = 0,
      level = 0,
      offset = 0

    if (buf[2] === 62) {
      priority = parseInt(buf.slice(1,2), 10)
      offset = 3
    } else if (buf[3] === 62) {
      priority = parseInt(buf.slice(1,3), 10)
      offset = 4
    } else if (buf[4] === 62) {
      priority = parseInt(buf.slice(1,4), 10)
      offset = 5
    } else {
      priority = 0
      logger.debug('unknown priority')
    }

    return [priority, offset]
  },
  
  parse_data: function(data) {
    var priority_data = this._find_priority(data)
    var priority = priority_data[0],
      offset = priority_data[1],
      facility = priority >> 3, //bit shift instead of divide
      level = priority & 0x07 // and mask of 8 instead of % mod

    logger.debug(data + ' #{DEBUG: {priority:' + priority +
                 ', facility:' + facility + ', level:' +  level + '}}#')

    var message = data.slice(offset)
    return message
  },
    
  create_message: function(message_raw) {
    var message = [this._now_date(), os.hostname(), 'jsyslog[' +
                   process.pid.toString() + ']:', message_raw].join(' ')
    return message
  },

}
