/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");

function composeHandlers(mainHandler, fallbackHandler) {
    return function onKeyPress() {
        var result = mainHandler.apply(null, arguments);
        if(!result)
            fallbackHandler.apply(null, arguments);
    };
}

function typeAlongComplete(e, hashKey, keyCode) {
    if(e.metaKey || e.altKey || e.ctrlKey)
        return false;
    if(editors.currentEditor.amlEditor.syntax !== "javascript")
        return false;
    var ch = String.fromCharCode(parseInt(e.keyIdentifier.replace("U+", ""), 16));
    var ext = require("ext/language/complete");
    
    
    if(ch.match(/[A-Za-z0-9_\$\.]/) || ch === ".") {
        var editor = editors.currentEditor.amlEditor.$editor;
        var pos = editor.getCursorPosition();
        var line = editor.session.getDocument().getLine(pos.row);
        if(!inCompletableCodeContext(line, pos.column))
            return false;
        setTimeout(function() {
            ext.closeCompletionBox(null, true);
            ext.deferredInvoke();
        });
        return true;
    }
}

/**
 * Ensure that code completion is not triggered.
 */
function inCompletableCodeContext(line, column) {
    var inMode = null;
    if(line.match(/^\s*\*.+/))
        return false;
    for (var i = 0; i < column; i++) {
        if(line[i] === '"' && !inMode)
            inMode = '"';
        else if(line[i] === '"' && inMode === '"' && line[i-1] !== "\\")
            inMode = null;
        else if(line[i] === "'" && !inMode)
            inMode = "'";
        else if(line[i] === "'" && inMode === "'" && line[i-1] !== "\\")
            inMode = null;
        else if(line[i] === "/" && line[i+1] === "/") {
            inMode = '//';
            i++;
        }
        else if(line[i] === "/" && line[i+1] === "*" && !inMode) {
            inMode = '/*';
            i++;
        }
        else if(line[i] === "*" && line[i+1] === "/" && inMode === "/*") {
            inMode = null;
            i++;
        }
        else if(line[i] === "/" && !inMode)
            inMode = "/";
        else if(line[i] === "/" && inMode === "/" && line[i-1] !== "\\")
            inMode = null;
    }
    return !inMode;
}

exports.typeAlongComplete = typeAlongComplete;
exports.composeHandlers = composeHandlers;
exports.inCompletableCodeContext = inCompletableCodeContext;
});
