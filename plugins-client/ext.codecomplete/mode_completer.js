var globalRequire = require;

define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");
var baseLanguageHandler = require('ext/language/base_handler');

var completer = module.exports = Object.create(baseLanguageHandler);

var modeCache = {}; // extension -> static data

completer.handlesLanguage = function(language) {
    return language === "css";
};

var CSS_ID_REGEX = /[a-zA-Z_0-9\$\-]/;

completer.fetchText = function(staticPrefix, path) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', staticPrefix + "/" + path, false);
    try {
        xhr.send();
    }
    // Likely we got a cross-script error (equivalent with a 404 in our cloud setup)
    catch(e) {
        return false;
    }
    
    if(xhr.status === 200)
        return xhr.responseText;
    else
        return false;
};

completer.complete = function(doc, fullAst, pos, currentNode, callback) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column, CSS_ID_REGEX);
    if(!identifier.length || line[pos.column - identifier.length - 1] === '.') // No snippet completion after "."
        return callback([]);

    var mode = modeCache[this.language];

    if (mode === undefined) {
        var text;
        if (this.language)
            text = this.fetchText(this.staticPrefix, 'ext/codecomplete/modes/' + this.language + '.json');
        mode = text ? JSON.parse(text) : {};
        // Cache
        modeCache[this.language] = mode;
    }

    // keywords, functions, constants, ..etc
    var types = Object.keys(mode);
    var matches = [];
    types.forEach(function (type) {
        var compls = completeUtil.findCompletions(identifier, mode[type]);
        matches.push.apply(matches, compls.map(function(m) {
            return {
              name        : m,
              replaceText : m,
              doc         : null,
              icon        : null,
              meta        : type,
              priority    : 2
            };
        }));
    });
    
    callback(matches);
};


});