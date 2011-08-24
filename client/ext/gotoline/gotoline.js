/**
 * Gotoline Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var canon = require("pilot/canon");
var editors = require("ext/editors/editors");
var skin = require("text!ext/gotoline/skin.xml");
var markup = require("text!ext/gotoline/gotoline.xml");

module.exports = ext.register("ext/gotoline/gotoline", {
    name    : "Gotoline Window",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : skin,
    markup  : markup,
    
    commands : {
        "gotoline": {hint: "enter a linenumber and jump to it in the active document"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Go to Line",
                onclick : function(){
                    _self.gotoline(1);
                }
            }))
        );

        this.hotitems["gotoline"] = [this.nodes[1]];

        canon.addCommand({
            name: "gotoline",
            exec: function(env, args, request) { 
                _self.gotoline(1);
            }
        });
    },

    init : function(amlNode){
        var _self = this;
        lstLineNumber.addEventListener("afterchoose", function() {
            if (lstLineNumber.selected) {
                _self.execGotoLine(parseInt(lstLineNumber.selected.getAttribute("nr")));
            }
            else
                _self.execGotoLine();
        });
        lstLineNumber.addEventListener("afterselect", function() {
            if (this.selected)
                txtLineNr.setValue(this.selected.getAttribute("nr"));
        });

        var restricted = [38, 40, 36, 35]
        lstLineNumber.addEventListener("keydown", function(e) {
            if (e.keyCode == 13 && this.selected){
                return false;
            }
            else if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode()) {
                    txtLineNr.focus();
                    this.clearSelection();
                }
            }
            else if (e.keyCode == 27){
                _self.gotoline(-1);
            }
            else if (restricted.indexOf(e.keyCode) == -1)
                txtLineNr.focus();
        }, true);

        txtLineNr.addEventListener("keydown", function(e) {
            if (e.keyCode == 13){
                _self.execGotoLine();
                return false;
            }
            else if (e.keyCode == 27){
                _self.gotoline(-1);
                return false;
            }
            else if (e.keyCode == 40) {
                var first = lstLineNumber.getFirstTraverseNode();
                if (first) {
                    lstLineNumber.select(first);
                    lstLineNumber.$container.scrollTop = 0;
                    lstLineNumber.focus();
                }
            }
            else if ((e.keyCode > 57 || e.keyCode == 32) && (e.keyCode < 96 || e.keyCode > 105))
                return false;
        });
        
        winGotoLine.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.gotoline(-1);
        });
    },

    gotoline: function(force) {
        ext.initExtension(this);
        
        if (this.control && this.control.stop)
            this.control.stop();

        var editorPage = tabEditors.getPage();
        if (!editorPage) return;

        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        if (!force && !winGotoLine.visible || force > 0) {
            var ace = editor.ceEditor.$editor;
            var aceHtml = editor.ceEditor.$ext;
            var cursor = ace.getCursorPosition();
            
            //Set the current line
            txtLineNr.setValue(txtLineNr.getValue() || cursor.row + 1);
                
            //Determine the position of the window
            var pos = ace.renderer.textToScreenCoordinates(cursor.row, cursor.column);
            var epos = apf.getAbsolutePosition(aceHtml);
            var maxTop = aceHtml.offsetHeight - 100;
            
            editor.ceEditor.parentNode.appendChild(winGotoLine);
            winGotoLine.setAttribute("top", Math.min(maxTop, pos.pageY - epos[1]));
            winGotoLine.setAttribute("left", -60);
            
            winGotoLine.show();
            txtLineNr.focus();
            
            //Animate
            apf.tween.single(winGotoLine, {
                type     : "left",
                anim     : apf.tween.easeInOutCubic,
                from     : -60,
                to       : 0,
                steps    : 8,
                interval : 10,
                control  : (this.control = {})
            });
        }
        else if (winGotoLine.visible) {
            //Animate
            apf.tween.single(winGotoLine, {
                type     : "left",
                anim     : apf.tween.EASEOUT,
                from     : winGotoLine.$ext.offsetLeft,
                to       : -60,
                steps    : 8,
                interval : 10,
                control  : (this.control = {}),
                onfinish : function(){
                    winGotoLine.hide();
                    editor.ceEditor.focus();
                }
            });
        }

        return false;
    },

    execGotoLine: function(line) {
        var editor = require('ext/editors/editors').currentEditor;
        if (!editor || !editor.ceEditor)
            return;
        
        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        winGotoLine.hide();

        if (typeof line != "number")
            line = parseInt(txtLineNr.getValue()) || 0;

        var history = lstLineNumber.$model;
        var gotoline, lineEl = history.queryNode("gotoline/line[@nr='" + line + "']");
        if (lineEl)
            gotoline = lineEl.parentNode;
        else {
            gotoline = apf.createNodeFromXpath(history.data, "gotoline") 
            lineEl   = apf.getXml("<line nr='" + line + "' />");
        }
        
        if (lineEl != gotoline.firstChild)
            apf.xmldb.appendChild(gotoline, lineEl, gotoline.firstChild);

        ace.gotoLine(line);
        ceEditor.focus();
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});