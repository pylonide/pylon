/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var lint = require("ace/worker/jshint").JSHINT;
var handler = module.exports = Object.create(baseLanguageHandler);

var disabledJSHintWarnings = [/Missing radix parameter./, /Bad for in variable '(.+)'./, /use strict/];

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

handler.analyze = function(doc, ast, callback) {
    callback(handler.analyzeSync(doc, ast));
};

handler.analyzeSync = function(doc, ast) {
    var value = doc.getValue();
    value = value.replace(/^(#!.*\n)/, "//$1");

    var markers = [];
    if (this.isFeatureEnabled("jshint")) {
        lint(value, {
            undef: false,
            onevar: false,
            passfail: false,
            devel: true,
            browser: true,
            node: true,
            esnext: true,
            expr: true
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
            if (reason.indexOf("Missing semicolon") !== -1)
                type = "info";
            if (reason.indexOf("conditional expression and instead saw an assignment") !== -1) {
                type = "warning";
                warning.reason = "Assignment in conditional expression";
            }
            for (var i = 0; i < disabledJSHintWarnings.length; i++)
                if(disabledJSHintWarnings[i].test(warning.reason))
                    return;
            markers.push({
                pos: {
                    sl: warning.line-1,
                    sc: warning.column-1
                },
                type: type,
                level: type,
                message: warning.reason
            });
        });
    }
    return markers;
};

/**
 * Gets an object like { foo: true } for JSHint global comments
 * like / * global foo: true * /
 */
handler.getGlobals = function() {
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
