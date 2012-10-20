/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");
var baseLanguageHandler = require('ext/language/base_handler');

var completer = module.exports = Object.create(baseLanguageHandler);

var modeCache = {}; // extension -> static data

completer.handlesLanguage = function(language) {
    return ["css", "php"].indexOf(language) !== -1;
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
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column,
            this.language === "css" ? CSS_ID_REGEX : null);
    if(!identifier.length) // No completion after "."
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

    function getIcon(type) {
        var iconMap = {
            "variable": "property",
            "constant": "property",
            "function": "method"
        };
        var subs = Object.keys(iconMap);
        for (var i = 0; i < subs.length; i++)
            if (type.indexOf(subs[i]) !== -1)
                return iconMap[subs[i]];
        return null;
    }

    // keywords, functions, constants, ..etc
    var types = Object.keys(mode);
    var matches = [];
    types.forEach(function (type) {
        var icon = getIcon(type);
        var append = type.indexOf("function") === -1 ? "" : "()";
        var deprecated = type.indexOf("deprecated") === -1 ? 0 : 1;
        var compls = completeUtil.findCompletions(identifier, mode[type]);
        matches.push.apply(matches, compls.map(function(m) {
            return {
              name        : m,
              replaceText : m + append,
              doc         : deprecated ? ("Deprecated: <del>" + m+append + "</del>") : null,
              icon        : icon,
              meta        : type,
              priority    : 2 - deprecated
            };
        }));
    });
    
    callback(matches);
};


});