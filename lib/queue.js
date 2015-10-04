// setup a queue, addinig an EventEmitter that emits 'message' after a .push

var events = require('events')

var queue = new events.EventEmitter()
queue.offset = 0
queue.items = []
queue.items.push = function() {
  Array.prototype.push.apply(this, arguments);
  queue.emit('message') // emit a message event *after* push has been applied to queue.items array
  return this.length
}

module.exports = queue
