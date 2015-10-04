![jsyslog logo](http://jamon.ca/jsyslog.png)

[![Build Status](https://travis-ci.org/jamonation/jsyslog.svg)](https://travis-ci.org/jamonation/jsyslog)

[![Coverage Status](https://coveralls.io/repos/jamonation/jsyslog/badge.svg?branch=master&service=github)](https://coveralls.io/github/jamonation/jsyslog?branch=master)

jsyslog is a javascript based syslog daemon that aims to be a complete implementation of RFC 3164, and RFC 5424.

A number of features are planned, like a plugin system for logging to endpoints such as Elasticsearch, Fluentd, Heka, Logstash or other syslog daemons.

## why?

There is no RFC compliant syslog daemon in the nodejs ecosystem. Moreover, tools like rsyslog and syslog-ng are somewhat exacting in terms of their setup.

jsyslog intends to make it easy for anyone with a passing knowledge of javascript or json to be able setup, use and extend with a minimum amount of fuss.

## getting started

A few things are required to use jsyslog on Linux and OSX systems (untested on Windows and *BSD as of this writing):

1. node and npm binaries

2. root access (if you want to run as an rsyslog/syslogd/syslog-ng replacement)

3. highly recommend pm2 process manager

To get jsyslog setup, use npm or clone this repository.

cd to node_modules or wherever you cloned jsyslog

Edit `config/config.js` to your liking.

As root run `pm2 start jsyslog` or `node jsyslog`

## TODO:

1. Make npm -g install work

2. Use process fork to run standalone and as an unprivileged user

3. Build plugin system for logging endpoints like elasticsearch, fluentd, heka, logstash, rsyslog etc. etc.
