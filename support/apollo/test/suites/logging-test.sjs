// We can't easily test the actual logging (output),
// but we can at least test the logic & formatting.

var test = require('../lib/testUtil').test;
var logging = require('apollo:logging');

test('default format', 'DEBUG: msg', function() {
  return logging.formatMessage(logging.DEBUG, 'msg');
});

test('value substitution', 'INFO: hello world', function() {
  return logging.formatMessage(logging.INFO, 'hello {who}', {who: 'world'});
});

test('print all log levels and revert', logging.getLevel(), function() {
  logging.print(' ------ test output: ----');
  using(logging.logContext({
    level: logging.DEBUG,
    format: ' (test) {level}: {message}'
  })) {
    logging.debug('debug');
    logging.verbose('verbose');
    logging.info('{value}', {value: 'info'});
    logging.warn('warn');
    logging.error('error with JSON object: ', {}, {error: "some error!"});
  }
  return logging.getLevel();
});

test('custom format', 'custom: msg // INFO', function() {
  using(logging.logContext({format: 'custom: {message} // {level}'})) {
    return logging.formatMessage(logging.INFO, "msg");
  }
});

test('defining a custom field function', 'INFO: message!', function() {
  logging.defineField('excited_message', function() {
    return this.message + '!';
  });
  using(logging.logContext({format: '{level}: {excited_message}'})) {
    return logging.formatMessage(logging.INFO, 'message');
  }
});

test('enabled levels at INFO', {DEBUG: false, VERBOSE:false, INFO:true, WARN:true, ERROR:true}, function() {
  var levels = ['DEBUG', 'VERBOSE', 'INFO', 'WARN', 'ERROR'];
  var enabled = {};
  for(var i=0; i<levels.length; i++) {
    var level = levels[i];
    enabled[level] = logging.isEnabled(logging[level]);
  }
  return enabled;
});

//--------------------------------------------------------------------------------
test('logging to debug.console objects',
    {log1: ["INFO: message 1"],
     log2: ["INFO: message 1", "INFO: message 2"],
     nologs: []
    }, function() {
  var debug = require('apollo:debug');
  function mkConsole(receivelog) {
    var c = debug.console({receivelog: receivelog});
    // make a console that records log messages
    c.loggedMessages = [];
    c.log = function(msg) {
      this.loggedMessages.push(msg);
    };
    return c;
  };

  var noLogging = mkConsole(false);
  var logging1 = mkConsole(true);
  var logging2 = mkConsole(true);

  logging.info("message 1");

  logging1.shutdown();

  logging.info("message 2");

  logging2.shutdown();

  logging.info("message 3 - should appear in browser console");

  noLogging.shutdown();

  return {
    log1: logging1.loggedMessages,
    log2: logging2.loggedMessages,
    nologs: noLogging.loggedMessages
  };
}).browserOnly();
