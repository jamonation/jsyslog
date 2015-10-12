// initialize a logger to use console, bunyan, or winston depending on config
// note that you will need to 'npm install --optional' to get bunyan or winston
// as they are not installed by default

var fs = require('fs')

const config = require('../config/config.js')

module.exports = {

  setup_logger: function() {
    this.logger = require(config.logger)
    /* istanbul ignore if */      
    if (config.logger === 'winston') {
      this.logger.fatal = logger.error
    } else {
      this.logger.fatal = console.error
      this.logger.debug = console.info
    }
    /* istanbul ignore if */      
    if (config.logger !== 'console' && config.logLevel !== null) {
      this.logger.level = config.logLevel
    } else if (config.logger === 'console' && config.logLevel === 'info') {
      this.logger.debug = function() {}
    }
    return this.logger
  }
}
