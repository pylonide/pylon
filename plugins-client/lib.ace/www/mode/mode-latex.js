define('ace/mode/latex', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/latex_highlight_rules', 'ace/range'], function(require, exports, module) {


var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var Tokenizer = require("../tokenizer").Tokenizer;
var LatexHighlightRules = require("./latex_highlight_rules").LatexHighlightRules;
var Range = require("../range").Range;

var Mode = function()
{
    this.$tokenizer = new Tokenizer(new LatexHighlightRules().getRules());
};
oop.inherits(Mode, TextMode);

(function() {
    this.toggleCommentLines = function(state, doc, startRow, endRow) {
        var outdent = true;
        var commentRegEx = /^(\s*)\%/;

        for (var i = startRow; i <= endRow; i++) {
            if (!commentRegEx.test(doc.getLine(i))) {
                outdent = false;
                break;
            }
        }

        if (outdent) {
            var deleteRange = new Range(0, 0, 0, 0);
            for (var i = startRow; i <= endRow; i++) {
                var line = doc.getLine(i);
                var m = line.match(commentRegEx);
                deleteRange.start.row = i;
                deleteRange.end.row = i;
                deleteRange.end.column = m[0].length;
                doc.replace(deleteRange, m[1]);
            }
        }
        else {
            doc.indentRows(startRow, endRow, "%");
        }
    };
    this.getNextLineIndent = function(state, line, tab) {
        return this.$getIndent(line);
    };
    
}).call(Mode.prototype);

exports.Mode = Mode;

});
define('ace/mode/latex_highlight_rules', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text_highlight_rules'], function(require, exports, module) {


var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var LatexHighlightRules = function() {   
    this.$rules = {
        "start" : [{
            token : "keyword",
            regex : "\\\\(?:[^a-zA-Z]|[a-zA-Z]+)"
        }, {
            token : "lparen",
            regex : "[[({]"
        }, {
            token : "rparen",
            regex : "[\\])}]"
        }, {
            token : "string",
            regex : "\\$(?:(?:\\\\.)|(?:[^\\$\\\\]))*?\\$"
        }, {
            token : "comment",
            regex : "%.*$"
        }]
    };
};

oop.inherits(LatexHighlightRules, TextHighlightRules);

exports.LatexHighlightRules = LatexHighlightRules;

});
