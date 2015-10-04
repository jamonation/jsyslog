// this works why? something about both being assigned to the same null object?
var config = {}

try {
  config = require('/etc/jsyslog/config.js') 
} catch (err) {
  // where to write a pid file - convention is /var/run/
  config.pid = '/tmp/jsyslog.pid'

  // use UDP 514 for actual syslog port per RFC 3164
  // TODO: use TCP 6514 for TLS syslog port per RFC 5425
  config.port = 5514

  // bind to which network interface? ipv4 only at the moment
  // TODO: make a flag to specify v4/v6
  config.iface = '0.0.0.0'

  // what is the socket's path e.g. /dev/log on most linux systems
  config.socketPath = '/tmp/log'

  // do we rm and take over an existing /dev/log socket?
  // very dangerous on a prod system with another syslog daemon installed
  config.claimSocket = false

  // where to log, on debian/ubuntu use /var/log/syslog
  // on rhel systems use /var/log/messages
  config.syslogFile = '/tmp/syslog'

  // date format, depending on which rfc is being used, change the strftime format here
  // e.g. rfc 3164 uses %b %e %H:%M:%S where %b is short month, and %e is date with a leading space
  // instead of a zero for any day of the month from 1-9
  config.dateFormat = '%b %e %H:%M:%S'

  // choose a logger here, winston, bunyan, or console are supported
  config.logger = 'console'
  config.logLevel = 'info'
}

module.exports = config
