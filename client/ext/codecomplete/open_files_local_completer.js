define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");
var editors = require("ext/editors/editors");
var ide = require("core/ide");
var lang = require("ace/lib/lang");

var ID_REGEX = /[a-zA-Z_0-9\$]/;

var analysisCache = {}; // path => {identifier: 3, ...}
var globalWordIndex = {}; // word => frequency
var globalWordFiles = {}; // word => [path]

window.globalWordFiles = globalWordFiles;
window.globalWordIndex = globalWordIndex;

function frequencyAnalyzer(path, text, identDict, fileDict) {
    var identifiers = text.split(/[^a-zA-Z_0-9\$]+/);
    for (var i = 0; i < identifiers.length; i++) {
        var ident = identifiers[i];
        if(!ident)
            continue;
            
        if (Object.prototype.hasOwnProperty.call(identDict, ident)) {
            identDict[ident]++;
            fileDict[ident][path] = true;
        }
        else {
            identDict[ident] = 1;
            fileDict[ident] = {};
            fileDict[ident][path] = true;
        }
    }
    return identDict;
}

function removeDocumentFromCache(path) {
    var analysis = analysisCache[path];

    for (var id in analysis) {
        globalWordIndex[id] -= analysis[id];
        delete globalWordFiles[id][path];
        if (globalWordIndex[id] === 0) {
            delete globalWordIndex[id];
            delete globalWordFiles[id];
        }
    }
    delete analysisCache[path];
}

exports.hook = function() {
    function reindex() {
        var page = tabEditors.getPage();
        if (!page) return;
        
        if (!editors.currentEditor || !editors.currentEditor.ceEditor)
            return;
        
        var currentPath = page.getAttribute("id");
        removeDocumentFromCache(currentPath);
        analyzeDocument(currentPath, editors.currentEditor.getDocument().getValue());
    }
    
    var deferred = lang.deferredCall(reindex);
    
    ide.addEventListener("afteropenfile", function(event){
        if (!event.node) return;
        if (!editors.currentEditor || !editors.currentEditor.ceEditor) // No editor, for some reason
            return;
        var path = event.node.getAttribute("path");
        analyzeDocument(path, event.doc.getValue() || "");
        
        editors.currentEditor.ceEditor.$editor.addEventListener("change", function(event) {
            deferred.cancel().schedule(1000);
        });
        
        event.doc.addEventListener("close", function() {
            removeDocumentFromCache(path);
        });
    });
};

function analyzeDocument(path, allCode) {
    if(!analysisCache[path]) {
        // Delay this slightly, because in Firefox document.value is not immediately filled
        setTimeout(function() {
            analysisCache[path] = frequencyAnalyzer(path, allCode, {}, {});
            // may be a bit redundant to do this twice, but alright...
            frequencyAnalyzer(path, allCode, globalWordIndex, globalWordFiles);
        }, 200);
    }
}

exports.analyze = function(editor, callback) {
    callback();
};

exports.complete = function(editor, callback) {
    var pos = editor.getCursorPosition();
    var line = editor.getSession().getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    var identDict = globalWordIndex;
    
    var allIdentifiers = [];
    for(var ident in identDict) {
        allIdentifiers.push(ident);
    }
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);
    
    // Filter out all results from the currently open file
    var page        = tabEditors.getPage();
    if (!page)
        return;
    
    var currentPath = page.getAttribute("id");
    matches = matches.filter(function(m) {
        return !globalWordFiles[m][currentPath];
    });

    callback(matches.map(function(m) {
        var path = Object.keys(globalWordFiles[m])[0] || "[unknown]";
        var pathParts = path.split("/");
        var foundInFile = pathParts[pathParts.length-1];
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          score       : identDict[m],
          meta        : foundInFile,
          priority    : 0
        };
    }));
};

});