/*
 * Oni Apollo 'logging' module
 * Logging utilities
 *
 * Part of the Oni Apollo Standard Module Library
 * Version: 'unstable'
 * http://onilabs.com/apollo
 *
 * (c) 2010-2011 Oni Labs, http://onilabs.com
 *
 * This file is licensed under the terms of the MIT License:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
/**
  @module    logging
  @summary   Simple cross-environment logging framework
  @desc
    This module exposes a simple logging API, and is useable
    across environments.
    
    Logging events will be sent to the global `console`
    object, when defined. If your browser has no native
    `console` object, no logging will occur. In that case,
    you can either use a tool like Firebug Lite
    (http://getfirebug.com/firebuglite) to emulate a console,
    or create an apollo console using the [debug::]
    module.

    Note that where possible, an appropriate `console` method
    will be used. e.g if you use logging.error() and your
    console has an `error` method, it will be used. This can
    be useful for browsers that distinguish errors by color,
    for example. If no specific `error` method is available,
    `log` will be used instead.
*/

var common = require('apollo:common');
var sys = require('sjs:apollo-sys');

/**
  @variable DEBUG
  @summary debug log level constant
*/
exports.DEBUG = 50;
/**
  @variable VERBOSE
  @summary verbose log level constant
*/
exports.VERBOSE = 40;
/**
  @variable INFO
  @summary info log level constant
*/
exports.INFO = 30;
/**
  @variable WARN
  @summary warning log level constant
*/
exports.WARN = 20;
/**
  @variable ERROR
  @summary error log level constant
*/
exports.ERROR = 10;
/**
  @variable OFF
  @summary constant used to disable all logging (except `print`)
*/
exports.OFF = 0;

//XXX should we document this? it's a pretty uncommon case that people need to add
// their own levels
exports.levelNames = {};
var levels = ['DEBUG', 'VERBOSE', 'INFO', 'WARN', 'ERROR'];
for (var i=0; i<levels.length; i++) {
  var name = levels[i];
  exports.levelNames[exports[name]] = name;
};

var currentLevel = exports.INFO;
var currentFormat = "{level}: {message}";

/**
  @function getLevel
  @summary Get the current logging level
  @return {Integer} [level] the currently active log level
*/
exports.getLevel = function() { return currentLevel; }

/**
  @function getFormat
  @summary Get the current log message format
  @return {String} [format] the currently active log message format
*/
exports.getFormat = function() { return currentFormat; }

/**
  @function setLevel
  @param {Integer} [level] the desired log level (typically one of DEBUG, VERBOSE, INFO, etc).
  @summary Set the current logging level
  @desc
    This is a global setting, so it will affect all `logging`
    performed throughout the current apollo runtime.
*/
exports.setLevel = function(lvl) {
  if(lvl === undefined) {
    throw new Error("Invalid level: " + lvl);
  }
  currentLevel = lvl;
};

/**
  @function setFormat
  @param {String} [newFormat] the new format string.
  @summary Set the output format of log messages
  @desc
    The default format is `"{level}: {message}"`, substitutions
    will be performed using [common::supplant].

    Currently the only keys available for a format to include are
    `level` and `message`.
    
    You can add your own fields using [::defineField]
*/
exports.setFormat = function(fmt) {
  currentFormat = fmt;
};

/**
  @function defineField
  @param {String} [name] the field name
  @param {Function} [fn] the function which will return the field value
  @summary Define a new custom field to be used in the logging format string
  @desc
    After defining a field here, it can be used in [::setFormat].

    The function cannot be passed arguments, but will be called with `this` as the
    current set of field values.
    
    e.g:

        logging.defineField('excited_message', function() {
          return this.message + '!!!';
        });
        logging.setFormat('{level}: {excited_message}');
        logging.info("here goes");

        >>> INFO: here goes!!!
*/
customFormatFields = null;
exports.defineField = function(key, val) {
  customFormatFields = customFormatFields || {};
  customFormatFields[key] = val;
};

/**
  @function isEnabled
  @summary  Test whether a message at the given level would be logged based on the current log level.
  @return   {Boolean} [enabled]
*/
exports.isEnabled = function(lvl) { return currentLevel >= lvl; };

exports.formatMessage = function(lvl, message, vals) {
  if(vals) {
    message = common.supplant(message, vals);
  }
  var fields = {
    level: exports.levelNames[lvl],
    message: message
  };
  if(customFormatFields) {
    fields = common.mergeSettings(customFormatFields, fields);
  }
  var str = common.supplant(currentFormat, fields);
  return str;
};

exports.log = function(lvl, message, vals, obj, preferred_console_method) {
  if(!message) throw new Error("Please supply both a level and a message");
  if(!exports.isEnabled(lvl)) return;
  var str = exports.formatMessage(lvl, message, vals);

  // only pass the obj arg if it's defined,
  // otherwise the console will log an `undefined` obj
  var args = [str];
  if(obj !== undefined) {
    args.push(obj);
  }
  getPrinter(preferred_console_method).apply(null, args);
};

var printfn = function(lvl, preferred_console_method) {
  return function(message, vals, obj) {
    return exports.log(lvl, message, vals, obj, preferred_console_method);
  }
};

/**
  @function print
  @summary  Log the given string to the console, regardless of the current log level.
  @desc
    Does not format the message in any way, unlike other `log` methods.
  @param    {String} [message]
  @param    {optional Object} [obj] an optional object to print - see the `obj` paramater in [::debug] for details.
*/
exports.print = function() { getPrinter('log').apply(null, arguments); };

/**
  @function debug
  @summary  Print the given message to the console when the current log level is DEBUG or higher
  @param    {String} [message] The message to log
  @param    {optional Object} [values] Values to be substituted into the message (see [common::supplant] for the syntax).
  @param    {optional Object} [obj] An additional object to pass through to the underlying log method.
            In the node.js environment, the object will be dumped as a JSON string.
            In a browser, this may show an expandable view of the object.
*/
exports.debug = printfn(exports.DEBUG, 'debug');

/**
  @function verbose
  @summary  Print the given message to the console when the current log level is VERBOSE or higher.
            The arguments are interpreted as for [::debug].
  @param    {String} [message]
  @param    {optional Object} [values]
  @param    {optional Object} [obj]
*/
exports.verbose = printfn(exports.VERBOSE, 'debug');

/**
  @function info
  @summary  Print the given message to the console when the current log level is INFO or higher.
            The arguments are interpreted as for [::debug].
  @param    {String} [message]
  @param    {optional Object} [values]
  @param    {optional Object} [obj]
*/
exports.info = printfn(exports.INFO,'info');

/**
  @function warn
  @summary  Print the given message to the console when the current log level is WARN or higher.
            The arguments are interpreted as for [::debug].
  @param    {String} [message]
  @param    {optional Object} [values]
  @param    {optional Object} [obj]
*/
exports.warn = printfn(exports.WARN,'warn');
/**
  @function error
  @summary  Print the given message to the console when the current log level is ERROR or higher.
            The arguments are interpreted as for [::debug].
  @param    {String} [message]
  @param    {optional Object} [values]
  @param    {optional Object} [obj]
*/
exports.error = printfn(exports.ERROR,'error');


/**
  @function logContext
  @summary  A content manager to temporarily modify the logging configuration.
  @desc
    Once the context has ended, all settings will be reverted to the values
    they had when `logContext()` was invoked.

    Note that this function affects global settings, so any other strata currently
    running will use these settings until the context ends.

    Example usage:

        using(logging.logContext({level:logging.WARN}) {
          // some code that logs too much at INFO level
        }
  @param    {Object} [settings] Settings for the context. Valid keys are `level` and `format`.
*/
exports.logContext = function(settings) {
  var oldLevel = currentLevel;
  var oldFormat = currentFormat;
  exports.setLevel(settings.level || oldLevel);
  exports.setFormat(settings.format || oldFormat);

  var ret = {
    __finally__: function() {
      exports.setLevel(oldLevel);
      exports.setFormat(oldFormat);
    }
  };
  return ret;
}

/**
  @function setConsole
  @param    {optional Object} [console] the new `console` object
  @summary  Override the `console` object that this module will print to
  @desc
    This method is used by the [debug::] module to redirect logging
    to any console created with `receivelog = true`.

    If `console` is null or not provided, the global `console` object will
    be used instead.
*/
exports.setConsole = function(console) {
  consoleOverride = console;
  // clear printer cache so that getPrinter() will use the new console
  printerCache = {};
};

// -------------------------------------------------------------
// helpers to construct & cache printer objects for each
// possible preferred_console_method
var printerCache = {};
var consoleOverride = null;

var getPrinter = function(preferred_console_method) {
  // only generate the printer once per preferred_console_method,
  // and cache it for further use
  if (!printerCache[preferred_console_method]) {
    printerCache[preferred_console_method] = makePrinter(preferred_console_method);
  }
  return printerCache[preferred_console_method];
};

var getConsole = function() {
  if(consoleOverride) {
    return consoleOverride;
  }
  return sys.getGlobal().console;
};

var makePrinter = function(preferred_console_method) {
  // find a print function for the preferred_console_method,
  // falling back to whatever we can get
  var c = getConsole();
  if(c) {
    if(c[preferred_console_method]) {
      return function() { c[preferred_console_method].apply(c, arguments); };
    }
    if(c.log) {
      return function() { c.log.apply(c, arguments); };
    }
  }
  return function() {};
};

