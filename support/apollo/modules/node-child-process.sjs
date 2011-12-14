/*
 * Oni Apollo 'node-events' module
 * Stratified wrapper for nodejs events
 *
 * Part of the Oni Apollo Standard Module Library
 * Version: 'unstable'
 * http://onilabs.com/apollo
 *
 * (c) 2011 Oni Labs, http://onilabs.com
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
  @module    node-child-process
  @summary   Stratified wrapper of nodejs's child_process lib
  @hostenv   nodejs
*/

if (require('sjs:apollo-sys').hostenv != 'nodejs') 
  throw new Error('node-events only runs in a nodejs environment');

var child_process = require('child_process');

/**
   @function exec
   @summary Execute a child process and return output
   @param {String} [command] Command to execute
   @param {Object} [optional options] Hash of options (see nodejs's child-process.exec docs)
   @return {Object} Object with 'stdout' and 'stderr' members
   @desc
      If the child process exits abnormally (exit code != 0), an
      `Error` will be thrown with `code` and `status` signal set to
      the exit code and signal that terminated the process (if any).
      Upon `retract`, the child process will be killed (with SIGTERM).
*/
exports.exec = function(command, options) {
  waitfor(var err, stdout, stderr) {
    var child = child_process.exec(command, options, resume);
  }
  retract {
    kill(child);
  }
  if (err) throw err;
  return { stdout: stdout, stderr: stderr };
};


/**
   @function run
   @summary Execute a child process and return output
   @param {Array} [optional args] Array of command-line arguments
   @param {Object} [optional options] Hash of options (see nodejs's child-process.spawn docs)
   @return {Object} Object with 'stdout' and 'stderr' members
   @desc
      This function is just like `exec`, but takes an array of arguments instead
      of a string. Notably, this ensures that arguments containing whitespace are not
      interpreted as multiple arguments.
      
      When the command fails, any `stderr` and `stdout` output that was captured so far is
      added to the exception thrown (accessible by the `stderr` and `stdout` properties).

      Note that the `options` hash are used as options to the underlying `child_process.spawn`
      function, *not* to `child_process.exec`.
*/
exports.run = function(command, args, options) {
  var stdout = [], stderr = [];
  function appendTo(buffer) {
    return function(data) { buffer.push(data); }
  };

  var child = exports.launch(command, args, options);
  if(child.stdout) child.stdout.on('data', appendTo(stdout));
  if(child.stderr) child.stderr.on('data', appendTo(stderr));
  function join(arr) { return arr.join(''); };

  try {
    exports.wait(child);
  } catch(e) {
    // annotate error with stdout / err info
    e.stdout = join(stdout);
    e.stderr = join(stderr);
    throw e;
  } retract {
    kill(child);
  }
  return {stdout: join(stdout), stderr: join(stderr)};
};

//TODO is `launch` too similar to `run`? maybe `popen` or even `fork`?
/**
   @function launch
   @summary Launch a child process
   @param {String} [command] Command to launch
   @param {Array} [optional args] Array of command-line arguments
   @param {Object} [optional options] Hash of options (see nodejs's child-process.spawn docs)
   @return {Object} The child process
   @desc
     This function wraps the `spawn` function of node's child_process module, but
     is called `launch` to avoid confusion with the SJS `spawn` construct.

     The returned process will not yet have started - you will typically want to set
     up event handlers on the child and then call `wait(child)`.
*/
exports.launch = function(command, args, options) {
  return child_process['spawn'](command, args, options);
};

/**
   @function wait
   @summary Wait for a child process to finish
   @param {Object} [child] The child process object obtailed from `run`.
   @desc
      If the child process exits abnormally (exit code != 0), an
      `Error` will be thrown with `code` and `signal` properties set as per `exec`.
*/
exports.wait = function(child) {
  waitfor(var code, signal) {
    child.on('exit', resume);
  } retract {
    child.removeListener('exit', resume);
  }
  if(code != 0) {
    var err = new Error('child process exited with nonzero exit status: ' + code);
    err.code = code;
    err.signal = signal;
    throw err;
  }
};

/**
   @function kill
   @summary Kill a child process
   @param {Array} [command] Command to execute
   @param {Object} [optional options] Options, described below
   @desc
      If `options.signal` is set to a signal name (a string), that signal will be used
      instead of the default 'SIGTERM'.

      If `options.wait` is false, `kill` will return immediately (the process
      may not actually have ended).
*/
var kill = exports.kill = function(child, options) {
  function kill() {
    child.kill(options && options.signal);
  }

  if(options && options.wait === false) {
    kill();
  } else {
    waitfor() {
      child.on('exit', resume);
      kill();
      hold();
    } finally {
      child.removeListener('exit', resume);
    }
  }
};

