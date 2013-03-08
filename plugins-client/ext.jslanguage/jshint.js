/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var lint = require("ace/mode/javascript/jshint").JSHINT;
var handler = module.exports = Object.create(baseLanguageHandler);

var disabledJSHintWarnings = [/Missing radix parameter./,
    /Bad for in variable '(.+)'./,
    /use strict/,
    /Input is an empty string./];

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

handler.analyze = function(value, ast, callback) {
    callback(handler.analyzeSync(value, ast));
};

handler.analyzeSync = function(value, ast) {
    var markers = [];
    if (!this.isFeatureEnabled("jshint"))
        return markers;

    value = value.replace(/^(#!.*\n)/, "//$1");
    // jshint throws error when called on empty string
    if (!value)
        return markers;

    lint(value, {
        es5: true,
        undef: false,
        onevar: false,
        passfail: false,
        devel: true,
        browser: true,
        node: true,
        esnext: true,
        expr: true,
        laxbreak: true,
        laxcomma: true,
        loopfunc: true,
        lastsemic: true,
        multistr: true,
        onecase: true
    });
    
    lint.errors.forEach(function(warning) {
        if (!warning)
            return;
        var type = "warning";
        var reason = warning.reason;
        if (reason.indexOf("Expected") !== -1 && reason.indexOf("instead saw") !== -1) // Parse error!
            type = "error";
        if (reason.indexOf("begun comment") !== -1) // Stupidly formulated parse error!
            type = "error";
        if (reason.indexOf("Missing semicolon") !== -1 || reason.indexOf("Unnecessary semicolon") !== -1)
            type = "info";
        if (reason.indexOf("better written in dot") !== -1)
            type = "info";
        if (reason.indexOf("used out of scope") !== -1)
            type = "info";
        if (reason.indexOf("conditional expression and instead saw an assignment") !== -1) {
            type = "warning";
            warning.reason = "Assignment in conditional expression";
        }
        for (var i = 0; i < disabledJSHintWarnings.length; i++)
            if(disabledJSHintWarnings[i].test(warning.reason))
                return;
        markers.push({
            pos: { // TODO quickfix framework needs el/ec in order to be able to select the issue in the editor
                sl: warning.line-1,
                sc: warning.character-1
            },
            type: type,
            level: type,
            message: warning.reason
        });
    });

    return markers;
};


/**
 * Gets an object like { foo: true } for JSHint global comments
 * like / * global foo: true * /
 */
handler.getGlobals = function() {
    if (!lint.errors || !this.isFeatureEnabled("jshint"))
        return {};
    var array = lint.data().globals;
    if (!array) // no data (yet?)
        return {};
    var obj = {};
    for (var i = 0; i < array.length; i++) {
        obj[array[i]] = true;
    }
    return obj;
};
    
});
