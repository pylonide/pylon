define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var lint = require("ace/worker/jshint").JSHINT;
var parser = require("ace/narcissus/jsparse");

var handler = module.exports = Object.create(baseLanguageHandler);

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

handler.analysisRequiresParsing = function() {
    return false;
};

handler.analyze = function(doc) {
    var value = doc.getValue();
    var markers = [];
    try {
        parser.parse(value);
    }
    catch (e) {
        var chunks = e.message.split(":");
        var message = chunks.pop().trim();
        var lineNumber = parseInt(chunks.pop().trim(), 10) - 1;
        markers = [{
            pos: {
                sl: lineNumber,
                el: lineNumber
            },
            message: message,
            type: "error"
        }];
        return markers;
    }
    finally {}
    if (this.isFeatureEnabled("jshint")) {
        lint(value, {
            undef: false,
            onevar: false,
            passfail: false
        });
        lint.errors.forEach(function(warning) {
            if (!warning)
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
