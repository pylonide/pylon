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
var iconLanglist = ["php"];

completer.handlesLanguage = function(language) {
    return ["css", "php"].indexOf(language) !== -1;
};

var ID_REGEXES = {
    "css": /[a-zA-Z_0-9-]/
};

completer.complete = function(doc, fullAst, pos, currentNode, callback) {
    var language = this.language;
    var line = doc.getLine(pos.row);
    var idRegex = ID_REGEXES[language];
    var identifier = completeUtil.retrievePrecedingIdentifier(line, pos.column, idRegex);
    if(!identifier.length) // No completion after "."
        return callback([]);

    var mode = modeCache[language];

    if (mode === undefined) {
        var text;
        if (language)
            text = completeUtil.fetchText(this.staticPrefix, 'ext/codecomplete/modes/' + this.language + '.json');
        mode = text ? JSON.parse(text) : {};
        // Cache
        modeCache[language] = mode;
    }

    function getIcon(type) {
        if (iconLanglist.indexOf(language) === -1)
            return null;
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
        var nameAppend = "", replaceAppend = "";
        if (type.indexOf("function") !== -1) {
            nameAppend = "()";
            replaceAppend = "(^^)";
        }
        var deprecated = type.indexOf("deprecated") === -1 ? 0 : 1;
        var compls = completeUtil.findCompletions(identifier, mode[type]);
        matches.push.apply(matches, compls.map(function(m) {
            return {
                name            : m + nameAppend,
                replaceText     : m + replaceAppend,
                doc             : deprecated ? ("Deprecated: <del>" + m + nameAppend + "</del>") : null,
                icon            : icon,
                meta            : type,
                identifierRegex : idRegex,
                priority        : 2 - deprecated
            };
        }));
    });
    
    callback(matches);
};


});
