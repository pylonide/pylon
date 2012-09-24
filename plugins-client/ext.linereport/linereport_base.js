/**
 * Line reporter worker for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var worker = module.exports = Object.create(baseLanguageHandler);

var commandId = 1;
var callbacks = {};
var resultCache = {};
    
worker.initReporter = function(checkInstall, performInstall, callback) {
   worker.$invoke("if ! " + checkInstall + "; then " + performInstall + "; fi", callback);
},

worker.invokeReporter = function(command, callback) {
    resultCache[command] = resultCache[command] || {};
    if (resultCache[command][this.doc])
        return callback(resultCache[this.command][this.doc]);
    if (resultCache[command].inProgress)
        return callbacks[resultCache[command].inProgress] = callback;
    
    resultCache[command].inProgress = commandId;
    var _self = this;
    this.$invoke(command, function(err, output) {
        if (err)
            return callback();
        callback(resultCache[command][_self.doc] = _self.parseOutput(output));
    });
};

worker.onDocumentOpen = function(path) {
    resultCache = {};
};

worker.$invoke = function(command, callback) {
    var id = commandId++;
    var data = {
        command: "alert",
        argv: ["alert","1"],
        line: "alert 1",
        cwd: "/",
        requireshandling: true,
        tracer_id: id,
        extra: { command_id: id }
    };
    callbacks[id] = callback;
    this.sender.emit("linereport_invoke", { command: data });
};

worker.init = function() {
    console.log("init linereport"); // DEBUG
};

worker.parseOutput = function(output) {
    var lines = output.split("\n");
    var results = [];
    for (var i = 0; i < lines.length; i++) {
        results.push(this.$parseOutputLine(lines[i]));
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