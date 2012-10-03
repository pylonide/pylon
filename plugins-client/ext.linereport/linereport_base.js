/**
 * Line reporter worker for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var worker = module.exports = Object.create(baseLanguageHandler);

var REPORTER_TIMEOUT = 60000;
var CACHE_TIMEOUT = 60000;

var commandId = 1;
var callbacks = {};
var resultCache = {}; // // map command to doc to result array
var inProgress = {}; // map command to boolean
var nextJob = {}; // map command to function
    
worker.init = function() {
    worker.sender.on("linereport_invoke_result", function(event) {
        worker.$onInvokeResult(event.data);
    });
};

worker.initReporter = function(checkInstall, performInstall, callback) {
   worker.$invoke(checkInstall, null, function(code, output) {
       if (code !== 0) {
           console.log(performInstall);
           worker.$invoke(performInstall, null, callback);
       } else {
           callback();
       }
   });
},

worker.invokeReporter = function(command, processLine, callback) {
    var _self = this;
        
    resultCache[command] = resultCache[command] || {};
    var doc = this.doc.getValue();
    if (resultCache[command][doc])
        return callback(resultCache[command][doc]);
    resultCache[command] = {};
    if (inProgress[command])
        return nextJob[command] = invoke;
    
    invoke();
    
    function invoke() {
        inProgress[command] = setTimeout(function() {
            delete inProgress[command];
        }, REPORTER_TIMEOUT);
        _self.$invoke(command, worker.path, function(code, output) {
            var doc = _self.doc.getValue();
            var result = resultCache[command][doc] = _self.parseOutput(output, processLine);
            setTimeout(function() {
                if (resultCache[command][doc])
                    delete resultCache[command][doc];
            }, CACHE_TIMEOUT);
            if (result.length === 0 && code !== 0)
                console.log("External tool produced an error that could not be parsed:", output);
            
            if (inProgress[command]) {
                clearTimeout(inProgress[command]);
                delete inProgress[command];
            }
            callback(result);
            if (nextJob[command]) {
                nextJob[command]();
                delete nextJob[command];
            }
        });
    }
};

worker.onDocumentOpen = function(path, doc, oldPath, callback) {
    resultCache = {};
    callback();
};

worker.$invoke = function(command, path, callback) {
    var id = commandId++;
    var command = {
        command: "sh",
        argv: ["sh", "-c", command],
        line: command,
        cwd: worker.workspaceDir,
        requireshandling: true,
        tracer_id: id,
        extra: { linereport_id: id }
    };
    callbacks[id] = callback;
    this.sender.emit("linereport_invoke", { command: command, path: path });
};

worker.$onInvokeResult = function(event) {
   // Note: invoked at least once for each linereport_base instance
   if (!callbacks[event.id])
       return; // already handled
   callbacks[event.id](event.code, event.output);
   delete callbacks[event.id];
};

worker.parseOutput = function(output, processLine) {
    var lines = output.split("\n");
    var results = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (processLine)
            line = processLine(line);
        var result = line.charAt ? this.$parseOutputLine(line) : line;
        if (result)
            results.push(result);
    }
    return results;
};

worker.$parseOutputLine = function(line) {
    var match = line.match(/^\s*(\d+):(?:\s*(\d+):)?\s*(.*)/);
    if (!match)
        return;
    var warningMatch = match[3].match(/^\s.?warning.?:?\s*(.*)/i);
    var errorMatch = match[3].match(/^\.?error.?:?\s*(.*)/i);
    var infoMatch = match[3].match(/^\.?info.?:?\s*(.*)/i);
    return {
        // Change from 1-indexed rows / cols to Ace 0-indexed rows / cols
        pos: { sl: parseInt(match[1], 10)-1, sc: parseInt(match[2], 10)-1 },
        type: 'unused',
        level: warningMatch ? 'warning' : infoMatch ? 'info' : 'error',
        message: warningMatch ? warningMatch[1] :
                 infoMatch ? infoMatch[1] :
                 errorMatch ? errorMatch[1] :
                 match[3]
    };
};

});
