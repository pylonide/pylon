/**
 * Gotoline Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var code = require("ext/code/code");
var menus = require("ext/menus/menus");
var editors = require("ext/editors/editors");
var settings = require("core/settings");
var skin = require("text!ext/gotoline/skin.xml");
var markup = require("text!ext/gotoline/gotoline.xml");

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
    commands : {
        "gotoline": {hint: "enter a linenumber and jump to it in the active document"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;
        
        this.nodes.push(
            menus.addItemByPath("Goto/Goto Line...", new apf.item({
                caption : "Goto Line...",
                onclick : function(){
                    _self.gotoline();
                }
            }), 200)
        );

        ide.addEventListener("gotoline", function() {
            _self.gotoline();
        });

        code.commandManager.addCommand({
            name: "gotoline",
            exec: function() {
                _self.gotoline();
            }
        });

        this.hotitems.gotoline = [this.nodes[1]];
    },

    init : function() {
        var _self = this;

        lstLineNumber.addEventListener("afterchoose", function() {
            if (lstLineNumber.selected) {
                _self.execGotoLine(parseInt(lstLineNumber.selected.getAttribute("nr"), 10));
            }
            else {
                _self.execGotoLine();
            }
        });
        lstLineNumber.addEventListener("afterselect", function() {
            if (!this.selected)
                return;
            
            txtLineNr.setValue(this.selected.getAttribute("nr"));
            _self.execGotoLine(null, true);
        });

        var restricted = [38, 40, 36, 35];
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
                _self.hide();
                ceEditor.focus();
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
                _self.hide();
                ceEditor.focus();
                
                if (_self.$originalLine) {
                    _self.execGotoLine(_self.$originalLine, true);
                    delete _self.$originalLine;
                }
                
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
            else if (!e.ctrlKey && !e.metaKey && (e.keyCode > 57 || e.keyCode == 32) && (e.keyCode < 96 || e.keyCode > 105))
                return false;

            setTimeout(function(){
                _self.execGotoLine(null, true);
            });
        });

        winGotoLine.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.hide();
        });
        
        txtLineNr.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.hide();
        });
    },
    
    show : function() {
        var editor = editors.currentEditor;
        var ace = editor.ceEditor.$editor;
        var aceHtml = editor.ceEditor.$ext;
        var cursor = ace.getCursorPosition();

        this.$originalLine = cursor.row + 1;

        //Set the current line
        txtLineNr.setValue(txtLineNr.getValue() || cursor.row + 1);

        //Determine the position of the window
        var pos = ace.renderer.textToScreenCoordinates(cursor.row, cursor.column);
        var epos = apf.getAbsolutePosition(aceHtml);
        var maxTop = aceHtml.offsetHeight - 100;

        editor.ceEditor.parentNode.appendChild(winGotoLine);
        winGotoLine.setAttribute("top", Math.max(0, Math.min(maxTop, pos.pageY - epos[1] - 5)));
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
    },

    hide : function() {
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
            }
        });
    },

    gotoline: function() {
        ext.initExtension(this);

        if (this.control && this.control.stop)
            this.control.stop();

        var editorPage = tabEditors.getPage();
        if (!editorPage)
            return;

        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        if (!winGotoLine.visible)
            this.show();
        else
            this.hide();

        return false;
    },

    execGotoLine: function(line, preview) {
        var editor = require('ext/editors/editors').currentEditor;
        if (!editor || !editor.ceEditor)
            return;
        
        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        if (typeof line != "number")
            line = parseInt(txtLineNr.getValue(), 10) || 0;

        ace.gotoLine(line);
        
        if (preview) {
            var animate = apf.isTrue(settings.model.queryValue("editors/code/@animatedscroll"));
            if (!animate)
                return;

            var cursor = ace.getCursorPosition();
            var aceHtml = editor.ceEditor.$ext;
            
            var firstLine = ace.renderer.textToScreenCoordinates(0, 0).pageY;
            var pos = ace.renderer.textToScreenCoordinates(cursor.row, cursor.column);
            var half = aceHtml.offsetHeight / 2; //ceEditor.$editor.renderer.$size.scrollerHeight / 2; //
            var lineHeight = ceEditor.$editor.renderer.lineHeight;
            var totalLines = ace.getSession().getLength();
            var lastLine = ace.renderer.textToScreenCoordinates(totalLines, 0).pageY + lineHeight;
            var maxTop = aceHtml.offsetHeight - winGotoLine.getHeight() - 10;
            
            var top;
            if (pos.pageY - firstLine < half) {
                top = Math.max(0, pos.pageY - firstLine - 5);
            }
            else if (lastLine - pos.pageY < half) {
                top = Math.min(maxTop, half + (half - (lastLine - pos.pageY)));
            }
            else if (ace.isRowFullyVisible(cursor.row)) {
                //Determine the position of the window
                var epos = apf.getAbsolutePosition(aceHtml);
                top = Math.min(maxTop, pos.pageY - epos[1] - 5);
            }
            else {
                top = half - 5 - lineHeight;
            }

            if (this.lineControl)
                this.lineControl.stop();
    
            //Animate
            apf.tween.single(winGotoLine, {
                type     : "top",
                anim     : apf.tween.easeInOutCubic,
                from     : winGotoLine.getTop(),
                to       : top,
                steps    : 8,
                interval : 10,
                control  : (this.lineControl = {})
            });
        }
        else {
            winGotoLine.hide();

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
                
            ceEditor.focus();
        }
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
