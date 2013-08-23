/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var completionUtil = require("ext/codecomplete/complete_util");
var editors = require("ext/editors/editors");
var TokenIterator = require("ace/token_iterator").TokenIterator;

var REQUIRE_ID_REGEX = /(?!["'])./;

var language;

function hook(ext) {
    language = ext;
}

function composeHandlers(mainHandler, fallbackHandler) {
    return function onKeyPress() {
        var result = mainHandler.apply(null, arguments);
        if(!result)
            fallbackHandler.apply(null, arguments);
    };
}

function onTextInput(text, pasted) {
    if (language.disabled)
        return false;
    if (language.isContinuousCompletionEnabled())
        typeAlongCompleteTextInput(text, pasted);
    else
        inputTriggerComplete(text, pasted);
    return false;
}

function onCommandKey(e) {
    if (language.disabled)
        return false;
    if (language.isContinuousCompletionEnabled())
        typeAlongComplete(e);
    if (e.keyCode == 27) // Esc
        require("ext/language/marker").hideToolTip();
    return false;
}

function typeAlongComplete(e) {
    if (e.metaKey || e.altKey || e.ctrlKey)
        return false;
    if (!isJavaScript())
        return false;
    if (e.keyCode === 8) { // Backspace
        var complete = require("ext/language/complete");
        var editor = editors.currentEditor.amlEditor.$editor;
        var pos = editor.getCursorPosition();
        var line = editor.session.getDocument().getLine(pos.row);
        if (!preceededByIdentifier(line, pos.column))
            return false;
        complete.deferredInvoke();
    }
}

function inputTriggerComplete(text, pasted) {
    var complete = require("ext/language/complete");
    var completionRegex = complete.getContinousCompletionRegex();
    var idRegex = complete.getIdentifierRegex();
    if (!pasted && completionRegex && text.match(completionRegex) && language.isInferAvailable())
        handleChar(text, idRegex, completionRegex);
}

function typeAlongCompleteTextInput(text, pasted) {
    var complete = require("ext/language/complete");
    var completionRegex = complete.getContinousCompletionRegex();
    var idRegex = complete.getIdentifierRegex();
    if (pasted || !completionRegex)
        return false;
    handleChar(text, idRegex, completionRegex);
}

function isJavaScript() {
    return editors.currentEditor.amlEditor.syntax === "javascript";
}

function inTextToken(editor, pos) {
    var token = new TokenIterator(editor.getSession(), pos.row, pos.column).getCurrentToken();
    return token && token.type && token.type === "text";
}

function inCommentToken(editor, pos) {
    var token = new TokenIterator(editor.getSession(), pos.row, pos.column).getCurrentToken();
    return token && token.type && token.type.match(/^comment/);
}

function handleChar(ch, idRegex, completionRegex) {
    if (ch.match(idRegex || /[A-Za-z0-9_\$\.\"\'\/]/) || (completionRegex && ch.match(completionRegex))) {
        var ext = require("ext/language/complete");
        var editor = editors.currentEditor.amlEditor.$editor;
        var pos = editor.getCursorPosition();
        var line = editor.session.getDocument().getLine(pos.row);
        if (!preceededByIdentifier(line, pos.column, ch) && !inTextToken(editor, pos))
            return false;
        ext.deferredInvoke(ch === ".");
    }
}

/**
 * Ensure that code completion is not triggered.
 */
function inCompletableCodeContext(line, column, id) {
    var inMode = null;
    if (line.match(/^\s*\*.+/))
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
            if (line.substr(i + 2, 6) === "global")
                continue;
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

function preceededByIdentifier(line, column, postfix) {
    var id = completionUtil.retrievePrecedingIdentifier(line, column);
    if(postfix) id += postfix;
    return id !== "" && !(id[0] >= '0' && id[0] <= '9') &&
        (inCompletableCodeContext(line, column, id) || isRequireJSCall(line, column, id));
}

function isRequireJSCall(line, column, identifier) {
    if (editors.currentEditor.amlEditor.syntax !== "javascript" || !language.isInferAvailable())
        return false;
    var id = identifier || completionUtil.retrievePrecedingIdentifier(line, column, REQUIRE_ID_REGEX);
    var LENGTH = 'require("'.length;
    var start = column - id.length - LENGTH;

    return start >= 0 && line.substr(start, LENGTH).match(/require\(["']/)
        || line.substr(start + 1, LENGTH).match(/require\(["']/);
}

exports.hook = hook;
exports.onTextInput = onTextInput;
exports.onCommandKey = onCommandKey;
exports.inputTriggerComplete = inputTriggerComplete;
exports.typeAlongCompleteTextInput = typeAlongCompleteTextInput;
exports.typeAlongComplete = typeAlongComplete;
exports.composeHandlers = composeHandlers;
exports.inCompletableCodeContext = inCompletableCodeContext;
exports.preceededByIdentifier = preceededByIdentifier;
exports.isRequireJSCall = isRequireJSCall;
});
