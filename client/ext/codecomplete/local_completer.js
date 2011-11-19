define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");

var ID_REGEX = /[a-zA-Z_0-9\$]/;
var SPLIT_REGEX = /[^a-zA-Z_0-9\$]+/;

// For the current document, gives scores to identifiers not on frequency, but on distance from the current prefix
function wordDistanceAnalyzer(doc, pos, prefix) {
    var text = doc.getValue().trim();
    
    // Determine cursor's word index
    var textBefore = doc.getLines(0, pos.row-1).join("\n") + "\n";
    var currentLine = doc.getLine(pos.row);
    textBefore += currentLine.substr(0, pos.column);
    var prefixPosition = textBefore.trim().split(SPLIT_REGEX).length;
    
    // Split entire document into words
    var identifiers = text.split(SPLIT_REGEX);
    var identDict = {};
    // Find prefix to find other identifiers close it
    for (var i = 0; i < identifiers.length; i++) {
        var ident = identifiers[i];
        var distance = Math.max(prefixPosition, i) - Math.min(prefixPosition, i);
        // Score substracted from 100000 to force descending ordering
        if (Object.prototype.hasOwnProperty.call(identDict, ident))
            identDict[ident] = Math.max(1000000-distance, identDict[ident]);
        else
            identDict[ident] = 1000000-distance;
        
    }
    return identDict;
}

exports.hook = function() {
};

exports.analyze = function(editor, callback) {
    var pos = editor.getCursorPosition();
    var line = editor.getSession().getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    var doc = editor.getSession().getDocument();
    
    editor.lcAnalysisCache = wordDistanceAnalyzer(doc, pos, identifier);
    // Remove the word to be completed
    delete editor.lcAnalysisCache[identifier];

    callback();
};

exports.complete = function(editor, callback) {
    var pos = editor.getCursorPosition();
    var line = editor.getSession().getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    var identDict = editor.lcAnalysisCache;
    
    var allIdentifiers = [];
    for(var ident in identDict) {
        allIdentifiers.push(ident);
    }
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);

    callback(matches.map(function(m) {
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          score       : identDict[m],
          meta        : "",
          priority    : 1
        };
    }));
};

});