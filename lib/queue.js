var events = require('events')

var queue = new events.EventEmitter()
queue.offset = 0
queue.items = []
queue.items.push = function() {
  Array.prototype.push.apply(this, arguments)
  // emit a message event *after* push has been applied to queue.items array    
  queue.emit('message')
  return this.length
}

module.exports = queue
