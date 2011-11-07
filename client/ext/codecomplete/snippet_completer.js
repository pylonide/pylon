define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");

var oop = require("pilot/oop");
var BaseLanguageHandler = require('ext/language/base_handler').BaseLanguageHandler;

var Completer = exports.Completer = function() {

};

oop.inherits(Completer, BaseLanguageHandler);


(function() {
    
    this.snippetCache = {}; // extension -> snippets
    
    this.handlesPath = function(path) {
        return true;
    };

    this.fetchText = function(path) {
        var chunks = path.split("/");
        chunks[0] = require.tlns[chunks[0]] || chunks[0];
        var url = chunks.join("/");
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send();
        if(xhr.status === 200)
            return xhr.responseText;
        else
            return false;
    };
    
    this.complete = function(doc, fullAst, pos, currentNode) {
        var line = doc.getLine(pos.row);
        var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    
        var parts = this.path.split('.');
        var ext = parts[parts.length-1];
        var snippets = this.snippetCache[ext];
        
        if(snippets === undefined) {
            var text = this.fetchText('ext/codecomplete/snippets/' + ext + '.json');
            snippets = text ? JSON.parse(text) : {};
            // Cache
            this.snippetCache[ext] = snippets;
        }
        
        var allIdentifiers = Object.keys(snippets);
        
        var matches = completeUtil.findCompletions(identifier, allIdentifiers);
        return matches.map(function(m) {
            return {
              name        : m,
              replaceText : snippets[m],
              icon        : null,
              meta        : "snippet",
              priority    : 2
            };
        });
    };
    
}).call(Completer.prototype);

});