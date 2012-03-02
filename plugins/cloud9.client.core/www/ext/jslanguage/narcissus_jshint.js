/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var lint = require("ace/worker/jshint").JSHINT;
var parser = require("ace/narcissus/jsparse");

var handler = module.exports = Object.create(baseLanguageHandler);

var disabledJSHintWarnings = [/Missing radix parameter./, /Bad for in variable '(.+)'./];

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

handler.analysisRequiresParsing = function() {
    return false;
};

handler.analyze = function(doc) {
    var value = doc.getValue();
    value = value.replace(/^(#!.*\n)/, "//$1");

    var markers = [];
    try {
        parser.parse(value);
    }
    catch (e) {
        var chunks = e.message.split(":");
        var message = chunks.pop().trim();
        var numString = chunks.pop();
        if(numString) {
            var lineNumber = parseInt(numString.trim(), 10) - 1;
            markers = [{
                pos: {
                    sl: lineNumber,
                    el: lineNumber
                },
                message: message,
                type: "error"
            }];
        }
        return markers;
    }
    finally {}
    if (this.isFeatureEnabled("jshint")) {
        lint(value, {
            undef: false,
            onevar: false,
            passfail: false,
            devel: true,
            browser: true,
            node: true
        });
        lint.errors.forEach(function(warning) {
            if (!warning)
                return;
            for (var i = 0; i < disabledJSHintWarnings.length; i++)
                if(disabledJSHintWarnings[i].test(warning.reason))
                    return;
            markers.push({
                pos: {
                    sl: warning.line-1,
                    sc: warning.column-1
                },
                type: 'warning',
                message: warning.reason
            });
        });
    }
    return markers;
};
    
});
