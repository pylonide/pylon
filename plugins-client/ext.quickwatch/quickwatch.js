/**
 * quickwatch Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");
var noderunner = require("ext/noderunner/noderunner");
var markup = require("text!ext/quickwatch/quickwatch.xml");
var commands = require("ext/commands/commands");

module.exports = ext.register("ext/quickwatch/quickwatch", {
    name    : "quickwatch",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    deps   : [noderunner],

    hook : function(){
        var _self = this;
        
        commands.addCommand({
            name : "quickwatch",
            bindKey: {mac: "Option-Q", win: "Alt-Q"},
            hint: "quickly inspect the variable that is under the cursor",
            exec: function(){
                _self.quickwatch();
            }
        });
    },

    init : function(amlNode){
        txtCurObject.addEventListener("keydown", function(e){
            if (e.keyCode == 13) {
                if (!this.value.trim())
                    return dgWatch.clear();

                require("ext/debugger/inspector").evaluate(this.value);
            }
            else if (e.keyCode == 40 && dgWatch.length) {
                var first = dgWatch.getFirstTraverseNode();
                if (first) {
                    dgWatch.select(first);
                    dgWatch.focus();
                }
            }
        });

        var restricted = [38, 40, 36, 35];
        dgWatch.addEventListener("keydown", function(e) {
            if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode())
                    txtCurObject.focus();
            }
            else if (restricted.indexOf(e.keyCode) == -1) {
                txtCurObject.focus();
            }
        }, true);
    },

    toggleDialog: function(force, exec) {
        ext.initExtension(this);

        if (!winQuickWatch.visible || force == 1) {
            var editor = editors.currentEditor;

            var range;
            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            if (sel.isEmpty()) {
                var cursor = sel.getCursor();
                range = doc.getWordRange(cursor.row, cursor.column);
            }
            else
                range = sel.getRange();
            var value = doc.getTextRange(range);

            if (value) {
                txtCurObject.setValue(value);
                if (exec) {
                    require("ext/debugger/inspector").evaluate(value);
                    txtCurObject.focus();
                }
            }

            winQuickWatch.show();
        }
        else
            winQuickWatch.hide();

        return false;
    },

    quickwatch : function(){
        this.toggleDialog(1, true);
    }
});

});