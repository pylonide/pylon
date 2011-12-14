/*
 * Oni Apollo 'node-repl' module
 * Read-eval-print loop for nodejs-based apollo
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
  @module  node-repl
  @summary Stratified read-eval-print loop for nodejs-based apollo
  @hostenv nodejs
*/

var sys = require('sjs:apollo-sys');
if (sys.hostenv != 'nodejs') 
  throw new Error('node-repl only runs in a nodejs environment');

var common = require('./common');
var events = require('./node-events');
var util = require('util');

var disableColors = true;
if (process.platform != 'win32') {
  disableColors = process.env.NODE_DISABLE_COLORS ? true : false;
}

//----------------------------------------------------------------------
// main repl entry point

// one global repl interface
var itf;

/**
   @function runREPL
   @summary Runs a stdin/stdout read-eval-print-loop.
*/
exports.runREPL = function() {
  if (itf) throw new Error("REPL already running");

  // XXX repl will be operating on global scope; place our 'require'
  // function there:
  sys.getGlobal().require = sys.require;

  var stdin = process.openStdin();

  try {
    itf = require('readline').createInterface(stdin, process.stdout);
    using (var lines = events.eventQueue(itf, 'line')) {
      while (1) {
        switchPrompt('input');
        itf.prompt();
        waitfor {
          var cl = lines.get()[0];
        }
        or {
          events.waitforEvent(itf, "SIGINT");
          write("<^C again to quit>");
          itf.prompt();
          events.waitforEvent(itf, "SIGINT");
          return;
        }
        switchPrompt('busy');
        evalCommandLine(cl);
      }
    }
  }
  finally {
    abortBgStrata();
    write("");
    itf.close();
    stdin.destroy();
  }
};

function evalCommandLine(cl) {
  var stratum = spawn require('sjs:apollo-sys').eval(cl, {filename:'repl'});

  waitfor {
    try { writeVal(stratum.waitforValue()); } catch(e) { writeErr(e); }
  }
  or {
    // when the user enters CTRL-C, we push into background:
    events.waitforEvent(itf, "SIGINT");
    trackInBackground(stratum);
  }
}

//----------------------------------------------------------------------
// prompt 

var promptType; 
var inputPrompt = 'apollo> ';

function switchPrompt(type) {
  if (type == promptType) return;
  promptType = type;
  switch (promptType) {
  case "input":
    itf.setPrompt(inputPrompt);
    break;
  case "busy":
    itf.setPrompt("");
    break;
  default:
    throw "unknown prompt";
  }
}

function updatePrompts() {
  // we show the numbe of background strata in our input prompt:
  inputPrompt = 'apollo'+(bgStrata.length ? '['+bgStrata.length+']> ' : '> ');

  // if we currently show the input prompt, update it:
  if (promptType == 'input') {
    itf.setPrompt(inputPrompt);
    itf._refreshLine();
  }
}

function setInputPrompt() {

}

//----------------------------------------------------------------------
// background strata

// array of background strata
var bgStrata = [];

function trackInBackground(s) {
  s.id = bgStrata.length ? bgStrata[bgStrata.length-1].id+1 : 1;
  s.handler = spawn bgStratumHandler(s);
  bgStrata.push(s);
  write('<pushed to background>', s.id);
  updatePrompts();
}

// handler for background strata; displays result, clears from array
function bgStratumHandler(s) {
  try {
    var val = s.waitforValue();
    writeVal(val, s.id);
  } 
  catch(e) { 
    writeErr(e, s.id);
  }
  bgStrata.splice(bgStrata.indexOf(s), 1);
  updatePrompts();
}

function abortBgStrata() {
  var strata = bgStrata.slice(0);
  for (var i=0; i<strata.length; ++i)
    strata[i].abort();
}

//----------------------------------------------------------------------
// output

function write(str, id) {
  process.stdout.cursorTo(0);
  process.stdout.clearLine(1);
  if (id) process.stdout.write('['+id+'] ');
  process.stdout.write(str+'\n');
}

function writeErr(e, id) {
  var message = (e instanceof Error) ? e.name+": "+e.message : 'Exception: '+e.toString();
  if (e.fileName && e.fileName != 'repl')
    message += "\n    in "+e.fileName+(e.lineNumber ? ":"+e.lineNumber : "");
  write(message, id);
}

function writeVal(val, id) {
  if (val === undefined) return;
  write(util.inspect(val, false, 2, itf.enabled && !disableColors), id);
}