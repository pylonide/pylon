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
   worker.$invoke("if ! " + checkInstall + "\n then " + performInstall + "\n fi", null, callback);
},

worker.invokeReporter = function(command, callback) {
    var _self = this;
        
    resultCache[command] = resultCache[command] || {};
    var doc = this.doc.getValue();
    if (resultCache[command][doc])
        return callback(resultCache[command][doc]);
    if (inProgress[command])
        return nextJob[command] = invoke;
    resultCache[command] = {};
    
    invoke();
    
    function invoke() {
        inProgress[command] = setTimeout(function() {
            delete inProgress[command];
        }, REPORTER_TIMEOUT);
        _self.$invoke(command, worker.path, function(code, output) {
            var result = resultCache[command][_self.doc.getValue()] = _self.parseOutput(output);
            if (result.length === 0 && code !== 0)
                console.err("External tool produced an error:", output);
            
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

worker.parseOutput = function(output) {
    var lines = output.split("\n");
    var results = [];
    for (var i = 0; i < lines.length; i++) {
        var result = this.$parseOutputLine(lines[i]);
        if (result)
            results.push(result);
    }
    return results;
};

worker.$parseOutputLine = function(line) {
    var match = line.match(/^\s*(\d+):\s*(\d+):\s*(.*)/);
    if (!match)
        return;
    var warningMatch = match[3].match(/^\s.?warning.?:?\s*(.*)/i);
    var errorMatch = match[3].match(/^\.?error.?:?\s*(.*)/i);
    var infoMatch = match[3].match(/^\.?info.?:?\s*(.*)/i);
    return {
        pos: { sl: parseInt(match[1], 10), sc: parseInt(match[2], 10) },
        type: 'unused',
        level: warningMatch ? 'warning' : infoMatch ? 'info' : 'error',
        message: warningMatch ? warningMatch[1] :
                 infoMatch ? infoMatch[1] :
                 errorMatch ? errorMatch[1] :
                 match[3]
    };   
};

});
