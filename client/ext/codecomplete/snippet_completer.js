var globalRequire = require;

define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");
var baseLanguageHandler = require('ext/language/base_handler');

var completer = module.exports = Object.create(baseLanguageHandler);

var snippetCache = {}; // extension -> snippets
    
completer.handlesLanguage = function(language) {
    return true;
};

completer.fetchText = function(path) {
    var chunks = path.split("/");
    chunks[0] = globalRequire.tlns[chunks[0]] || chunks[0];
    var url = chunks.join("/");
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send();
    if(xhr.status === 200)
        return xhr.responseText;
    else
        return false;
};

completer.complete = function(doc, fullAst, pos, currentNode) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);

    var snippets = snippetCache[this.language];
    
    if (snippets === undefined) {
        var text = this.fetchText('ext/codecomplete/snippets/' + this.language + '.json');
        snippets = text ? JSON.parse(text) : {};
        // Cache
        snippetCache[this.language] = snippets;
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


});