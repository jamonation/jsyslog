var os = require('os')
var strftime = require('strftime')

var logger = require('./logger').setup_logger()

const config = require('../config/config.js')
const priorities = require('../config/levels.json')

module.exports = {

  parse_data: function(data) {
    var priority_data = find_priority(data)
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
    var message = [nowDate(), os.hostname(), 'jsyslog[' +
                   process.pid.toString() + ']:', message_raw].join(' ')
    return message
  }

}

var nowDate = function() {
  return strftime(config.dateFormat)
}


function find_priority(buf) {
  var priority = 0,
    facility = 0,
    level = 0,
    offset = 0

  if (buf[2] === 62) {
    priority = parseInt(buf.slice(1,2), 10)
    offset = 3
  } else if (buf[3] === 62) {
    priority = parseInt(buf.slice(1,3), 10)
    offset = 4;
  } else if (buf[4] === 62) {
    priority = parseInt(buf.slice(1,4), 10)
    offset = 5;
  } else {
    priority = 0;
    logger.warn('unknown priority')
  }

  return [priority, offset]
}
