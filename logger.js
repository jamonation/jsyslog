// initialize a logger to use console, bunyan, or winston depending on config
// note that you will need to 'npm install --optional' to get bunyan or winston
// as they are not installed by default

var setup_logger = function(config) {
  this.logger = require(config.logger)
  if (config.logger === 'winston') {
    this.logger.fatal = logger.error
  } else {
    this.logger.fatal = console.error
    this.logger.debug = console.info
  }
  if (config.logger !== 'console' && config.logLevel !== null) {
    this.logger.level = config.logLevel
  }
  if (config.logger === 'console' && config.logLevel === 'info') {
    this.logger.debug = function() {}
  }
  return this.logger
}

module.exports = setup_logger
