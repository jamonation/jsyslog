var test = require('tape')


test('helpers',
    function (t) {
        t.plan(7)

        var helpers = require('../lib/helpers')
        t.equal(typeof helpers, 'object', 'helpers is imported')

        // message will look like: 'Oct 11 12:18:08 hostname jsyslog[25856]: foo'
        var message = helpers.create_message('foo')
        var message_regex = /^[A-Za-z]+\s{1,}\d+\s(\d+:|\d+){3}\s\S+\sjsyslog\[\d+\]:\sfoo$/
	t.ok(message.match(message_regex), 'create message returns properly formatted message')

        t.equal(helpers.parse_data(Buffer('<83>foo')).toString(), 'foo', 'parse data works')

        t.equal(helpers._find_priority(0)[1], 0, 'priority unknown returns offset 0')

        var priorities = ['<1>', '<10>', '<100>']
        priorities.forEach(function (priority) {
            var message_raw = Buffer(priority)
            var priority_res_raw = helpers._find_priority(message_raw)[1]
            var priority_res_expected = priority.length
            t.equal(priority_res_raw, priority_res_expected, 'priority length detection: ' + priority)
        })

    }
)
