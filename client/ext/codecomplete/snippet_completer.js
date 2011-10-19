define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");

var javascriptSnippets = require("ext/codecomplete/snippets/javascript");
var JavascriptMode = require("ace/mode/javascript").Mode;
var htmlSnippets = require("ext/codecomplete/snippets/html");
var HTMLMode = require("ace/mode/html").Mode;

exports.hook = function() {
};

exports.analyze = function(editor, callback) {
    callback();
};

exports.complete = function(editor, callback) {
    var pos = editor.getCursorPosition();
    var line = editor.getSession().getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    
    var snippets = {};
    var editorMode = editor.getSession().getMode();
    
    if(editorMode instanceof JavascriptMode)
        snippets = javascriptSnippets;
    else if(editorMode instanceof HTMLMode)
        snippets = htmlSnippets;
    
    var allIdentifiers = Object.keys(snippets);
    
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);
    callback(matches.map(function(m) {
        return {
          name        : m,
          replaceText : snippets[m],
          icon        : null,
          meta        : "snippet",
          priority    : 2
        };
    }));
};

});