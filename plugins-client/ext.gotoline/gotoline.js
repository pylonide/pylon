/**
 * Gotoline Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var editors = require("ext/editors/editors");
var settings = require("core/settings");
var skin = require("text!ext/gotoline/skin.xml");
var markup = require("text!ext/gotoline/gotoline.xml");
var anims = require("ext/anims/anims");

module.exports = ext.register("ext/gotoline/gotoline", {
    name    : "Gotoline Window",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : {
        id  : "gotoline",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/gotoline/images/"
    },
    markup  : markup,

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            menus.addItemByPath("Goto/Goto Line...", new apf.item({
                caption : "Goto Line...",
                hint: "enter a linenumber and jump to it in the active document",
                command : "gotoline"
            }), 200)
        );

        ide.addEventListener("gotoline", function() {
            _self.gotoline();
        });

        commands.addCommand({
            name: "gotoline",
            bindKey: {mac: "Command-L", win: "Ctrl-G"},
            isAvailable : function(editor){
                return editor && editor.amlEditor;
            },
            exec: function() {
                _self.gotoline();
            }
        });
    },

    init : function() {
        var _self = this;
        var list = lstLineNumber;
        var text = txtLineNr;

        list.addEventListener("afterchoose", function() {
            if (list.selected) {
                _self.execGotoLine(parseInt(list.selected.getAttribute("nr"), 10));
            }
            else {
                _self.execGotoLine();
            }
        });
        list.addEventListener("afterselect", function() {
            if (!this.selected)
                return;

            text.setValue(this.selected.getAttribute("nr"));
            _self.execGotoLine(null, null, true);
        });

        var restricted = [38, 40, 36, 35];
        list.addEventListener("keydown", function(e) {
            if (e.keyCode == 13 && this.selected){
                return false;
            }
            else if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode()) {
                    text.focus();
                    this.clearSelection();
                }
            }
            else if (e.keyCode == 27){
                _self.hide();
                editors.currentEditor.amlEditor.focus();
            }
            else if (restricted.indexOf(e.keyCode) == -1)
                text.focus();
        }, true);

        text.addEventListener("keydown", function(e) {
            if (e.keyCode == 13){
                _self.execGotoLine();
                return false;
            }
            else if (e.keyCode == 27){
                _self.hide();
                editors.currentEditor.amlEditor.focus();

                if (_self.$originalLine) {
                    _self.execGotoLine(_self.$originalLine, _self.$originalColumn, true);

                    delete _self.$originalLine;
                    delete _self.$originalColumn;
                }

                return false;
            }
            else if (e.keyCode == 40) {
                var first = list.getFirstTraverseNode();
                if (first) {
                    list.select(first);
                    list.$container.scrollTop = 0;
                    list.focus();
                }
            }
            else if ((e.keyCode > 57 || e.keyCode == 32) && (e.keyCode < 96 || e.keyCode > 105))
                return false;

            if (!e.ctrlKey && !e.metaKey && apf.isCharacter(e.keyCode)) {
                setTimeout(function(){
                    _self.execGotoLine(null, null, true);
                });
            }
        });

        winGotoLine.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.hide();
        });

        text.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.hide();
        });
    },

    show : function() {
        var editor = editors.currentEditor;
        var ace = editor.amlEditor.$editor;
        var aceHtml = editor.amlEditor.$ext;
        var cursor = ace.getCursorPosition();

        this.$originalLine = cursor.row + 1;
        this.$originalColumn = cursor.column;

        //Set the current line
        txtLineNr.setValue(txtLineNr.getValue() || cursor.row + 1);

        //Determine the position of the window
        var pos = ace.renderer.textToScreenCoordinates(cursor.row, cursor.column);
        var epos = apf.getAbsolutePosition(aceHtml);
        var maxTop = aceHtml.offsetHeight - 100;
        var top = Math.max(0, Math.min(maxTop, pos.pageY - epos[1] - 5));
        var left = 0;

        editor.amlEditor.parentNode.appendChild(winGotoLine);

        var correct = ide.dispatchEvent("ext.gotoline.correctpos", {
            anim: "out",
            top: top,
            left: left
        });
        console.log("correcting??",correct,(correct ? correct.top : top) + "px",(correct ? correct.left : left) + "px");
        winGotoLine.$ext.style.top = (correct ? correct.top : top) + "px";

        winGotoLine.show();
        txtLineNr.focus();

        //Animate
        if (apf.isTrue(settings.model.queryValue('general/@animateui'))) {
            winGotoLine.setWidth(0);
            anims.animate(winGotoLine, {
                width: "60px",
                timingFunction: "cubic-bezier(.11, .93, .84, 1)",
                duration : 0.15
            }, function() {
                winGotoLine.$ext.style.left = (correct ? correct.left : left) + "px";
            });
        }
        else {
            winGotoLine.setWidth(60);
        }
    },

    hide : function() {
        if (apf.isTrue(settings.model.queryValue('general/@animateui'))) {
            anims.animate(winGotoLine, {
                width: "0px",
                timingFunction: "cubic-bezier(.10, .10, .25, .90)",
                duration : 0.15
            }, function(){
                winGotoLine.hide();
            });
        }
        else {
            winGotoLine.hide();
        }
    },

    gotoline: function() {
        ext.initExtension(this);

        if (this.control && this.control.stop)
            this.control.stop();

        var editorPage = tabEditors.getPage();
        if (!editorPage)
            return;

        var editor = editors.currentEditor;
        if (!editor || !editor.amlEditor)
            return;

        if (!winGotoLine.visible)
            this.show();
        else
            this.hide();

        return false;
    },

    execGotoLine: function(line, column, preview) {
        var editor = editors.currentEditor;
        if (!editor || !editor.amlEditor)
            return;

        var amlEditor = editor.amlEditor;
        var ace       = amlEditor.$editor;

        if (typeof line != "number")
            line = parseInt(txtLineNr.getValue(), 10) || 0;

        if (!this.lastLine || this.lastLine != line
          || !ace.isRowFullyVisible(line)) {
            ace.gotoLine(line, column);
            this.lastLine = line;
        }

        if (typeof preview != "undefined") {
            var animate = apf.isTrue(settings.model.queryValue("editors/code/@animatedscroll"));
            if (!animate)
                return;

            var cursor = ace.getCursorPosition();
            var aceHtml = editor.amlEditor.$ext;

            var firstLine = ace.renderer.textToScreenCoordinates(0, 0).pageY;
            var pos = ace.renderer.textToScreenCoordinates(cursor.row, cursor.column);
            var half = aceHtml.offsetHeight / 2; //amlEditor.$editor.renderer.$size.scrollerHeight / 2; //
            var lineHeight = amlEditor.$editor.renderer.lineHeight;
            var totalLines = ace.getSession().getLength();
            var lastLine = ace.renderer.textToScreenCoordinates(totalLines, 0).pageY + lineHeight;
            var maxTop = aceHtml.offsetHeight - winGotoLine.getHeight() - 10;

            var top;
            //First part of doc
            if (pos.pageY - firstLine < half) {
                top = Math.max(0, pos.pageY - firstLine - 5);
            }
            //Last part of doc
            else if (lastLine - pos.pageY < half) {
                top = Math.min(maxTop, half + (half - (lastLine - pos.pageY)));
            }
            //Already visible
            else if (ace.isRowFullyVisible(cursor.row)) {
                //Determine the position of the window
                var epos = apf.getAbsolutePosition(aceHtml);
                top = Math.min(maxTop, pos.pageY - epos[1] - 5);
            }
            //General case (centered)
            else {
                top = half - 1;// - lineHeight;
            }

            if (this.lineControl)
                this.lineControl.stop();

            var left = 0;
            var correct = ide.dispatchEvent("ext.gotoline.correctpos", {
                anim: "out",
                top: top,
                left: left
            });
            //Animate
            anims.animate(winGotoLine, {
                top: (correct ? correct.top : top) + "px",
                timingFunction: "cubic-bezier(.11, .93, .84, 1)",
                duration : 0.25
            }, function() {
                winGotoLine.$ext.style.left = (correct ? correct.left : left) + "px";
            });
        }
        else {
            //winGotoLine.hide();
            this.hide();

            var history = lstLineNumber.$model;
            var gotoline, lineEl = history.queryNode("gotoline/line[@nr='" + line + "']");
            if (lineEl)
                gotoline = lineEl.parentNode;
            else {
                gotoline = apf.createNodeFromXpath(history.data, "gotoline");
                lineEl   = apf.getXml("<line nr='" + line + "' />");
            }

            if (lineEl != gotoline.firstChild)
                apf.xmldb.appendChild(gotoline, lineEl, gotoline.firstChild);

            amlEditor.focus();
        }
    },

    destroy : function(){
        commands.removeCommandByName("gotoline");
        this.$destroy();
    }
});

});
