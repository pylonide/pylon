/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __AMLCODEEDITOR || __INC_ALL

/**
 * Element allowing the user to type code.
 *
 * @constructor
 * @define codeeditor
 * @addnode elements
 *
 * @inherits ppc.StandardBinding
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @author      Fabian Jakobs (fabian AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.1
 */

define(function(require, exports, module) {
"use strict";

var Editor = require("ace/editor").Editor;
var EditSession = require("ace/edit_session").EditSession;
var VirtualRenderer = require("ace/virtual_renderer").VirtualRenderer;
var UndoManager = require("ace/undomanager").UndoManager;
var MultiSelect = require("ace/multi_select").MultiSelect;
var Document = require("ace/document").Document;
var dom = require("ace/lib/dom");

require("ace/lib/fixoldbrowsers");
require("ppc/elements/scrollbars");

ppc.codeeditor = module.exports = function(struct, tagName) {
    this.$init(tagName || "codeeditor", ppc.NODE_VISIBLE, struct);

    this.documents = [];
    this.$cache    = {};
};

(function() {
    this.implement(
        //#ifdef __WITH_DATAACTION
        ppc.DataAction
        //#endif
    );

    this.$focussable       = true; // This object can get the focus
    this.$childProperty    = "value";
    this.$isTextInput      = true;

    this.value             = "";
    this.multiline         = true;
    this.caching           = true;

    this.$booleanProperties["activeline"]               = true;
    this.$booleanProperties["gutterline"]               = true;
    this.$booleanProperties["caching"]                  = true;
    this.$booleanProperties["readonly"]                 = true;
    this.$booleanProperties["showinvisibles"]           = true;
    this.$booleanProperties["showprintmargin"]          = true;
    this.$booleanProperties["showindentguides"]         = true;
    this.$booleanProperties["overwrite"]                = true;
    this.$booleanProperties["softtabs"]                 = true;
    this.$booleanProperties["gutter"]                   = true;
    this.$booleanProperties["highlightselectedword"]    = true;
    this.$booleanProperties["autohidehorscrollbar"]     = true;
    this.$booleanProperties["behaviors"]                = true;
    this.$booleanProperties["wrapbehaviors"]            = true;
    this.$booleanProperties["folding"]                  = true;
    this.$booleanProperties["wrapmode"]                 = true;
    this.$booleanProperties["wrapmodeViewport"]         = true;
    this.$booleanProperties["animatedscroll"]           = true;
    this.$booleanProperties["globalcommands"]           = true;
    this.$booleanProperties["fadefoldwidgets"]          = true;

    this.$supportedProperties.push("value", "syntax", "activeline", "selectstyle",
        "caching", "readonly", "showinvisibles", "showprintmargin", "printmargincolumn",
        "overwrite", "tabsize", "softtabs", "scrollspeed", "showindentguides",
        "theme", "gutter", "highlightselectedword", "autohidehorscrollbar", "animatedscroll",
        "behaviors", "wrapbehaviors", "folding", "newlinemode", "globalcommands", "fadefoldwidgets",
        "gutterline");

    this.$getCacheKey = function(value) {
        var key;
        if (typeof value === "string") {
            if (this.xmlRoot) {
                key = this.xmlRoot.getAttribute(ppc.xmldb.xmlIdTag);
            }
            else {
                key = value;
            }
        }
        else if (value.nodeType) {
            key = value.getAttribute(ppc.xmldb.xmlIdTag);
        }

        return key;
    };

    this.clearCacheItem = function(xmlNode) {
        if (!this.caching)
            return;

        var key = this.$getCacheKey(xmlNode);
        if (key)
            delete this.$cache[key];
    };

    this.addEventListener("unloadmodel", function() {
        this.syncValue();
    });

    /**
     * @attribute {String} value the text of this element
     * @todo ppc3.0 check use of this.$propHandlers["value"].call
     */
    this.$propHandlers["value"] = function(value){ //@todo ppc3.0 add support for the range object as a value
        var doc, key;
        var _self = this;

        if (this.caching)
            key = this.$getCacheKey(value);

        //Assuming document
        if (value instanceof EditSession)
            doc = value;

        if (!doc && key)
            doc = this.$cache[key];

        if (!doc) {
            if (value.nodeType) {
                ppc.xmldb.addNodeListener(value.nodeType == 1
                    ? value : value.parentNode, this);
                //@todo replace this by a proper function
                if (value.nodeType > 1 && value.nodeType < 5)
                    value = value.nodeValue;
                else
                    value = value.firstChild && value.firstChild.nodeValue;
            }

            doc = new EditSession(new Document(value || ""));
            doc.setUndoManager(new UndoManager());
            doc.setMode(this.getMode(this.syntax));

            doc.cacheId = key;
            if (key)
                this.$cache[key] = doc;
        }
        //@todo value can also be an xml node and should be updated in a similar fashion as above
        else if (typeof value == "string" && !doc.hasValue) {
            //@todo big hack!
            doc.setValue(value);
            doc.hasValue = true;
        }

        if (!doc.$hasModeListener) {
            doc.$hasModeListener = true;
            doc.on("loadmode", function(e) {
                _self.dispatchEvent("loadmode", e);
            });
        }
        _self.syntax = doc.syntax;
        _self.dispatchEvent("prop.syntax", {
            value : doc.syntax
        });

        doc.setTabSize(parseInt(_self.tabsize, 10));
        doc.setUseSoftTabs(_self.softtabs);
        doc.setUseWrapMode(_self.wrapmode);
        if (_self.wrapmodeViewport) {
            doc.setWrapLimitRange(_self.wraplimitmin, null);
        }
        else {
           doc.setWrapLimitRange(_self.wraplimitmin, _self.printmargincolumn);
        }
        doc.setFoldStyle(_self.folding ? "markbegin" : "manual");
        doc.setNewLineMode(_self.newlinemode);

        _self.$editor.setShowPrintMargin(_self.showprintmargin);

        /* Ace report the following in v1.1.9
           Automatically scrolling cursor into view after selection change this will be disabled in the next version
           set editor.$blockScrolling = Infinity to disable this message
         */
        _self.$editor.$blockScrolling = Infinity;

        _self.$editor.setSession(doc);
    };
    
    this.afterOpenFile = function(doc, path) {
    };

    this.$propHandlers["theme"] = function(value) {
        this.$editor.setTheme(value);
    };

    this.$propHandlers["newlinemode"] = function(value) {
        this.newlinemode = value || "auto";
        this.$editor.getSession().setNewLineMode(this.newlinemode);
    };

    this.$propHandlers["syntax"] = function(value) {
        this.$editor.session.setMode(this.getMode(value));
        this.$editor.session.syntax = value;
    };

    this.getMode = function(syntax) {
        syntax = (syntax || "text").toLowerCase();
        if (syntax.indexOf("/") == -1)
            syntax = "ace/mode/" + syntax;

        return syntax;
    };

    this.$propHandlers["activeline"] = function(value) {
        this.$editor.setHighlightActiveLine(value);
    };

    this.$propHandlers["gutterline"] = function(value) {
        if(this.$editor.setHighlightGutterLine)
            this.$editor.setHighlightGutterLine(value);
    };

    this.$propHandlers["selectstyle"] = function(value) {
        this.$editor.setSelectionStyle(value);
    };

    this.$propHandlers["showprintmargin"] = function(value, prop, initial) {
        this.$editor.setShowPrintMargin(value);
    };

    this.$propHandlers["printmargincolumn"] = function(value, prop, initial) {
        this.$editor.setPrintMarginColumn(value);
        if (!this.wrapmodeViewport) {
            this.$editor.getSession().setWrapLimitRange(this.wraplimitmin, value);
        }
    };

    this.$propHandlers["showinvisibles"] = function(value, prop, initial) {
        this.$editor.setShowInvisibles(value);
    };

    this.$propHandlers["showindentguides"] = function(value, prop, initial) {
        this.$editor.setDisplayIndentGuides(value);
    };

    this.$propHandlers["animatedscroll"] = function(value, prop, initial) {
        this.$editor.setAnimatedScroll(value);
    };

    this.$propHandlers["overwrite"] = function(value, prop, initial) {
        this.$editor.setOverwrite(value);
    };

    this.$propHandlers["readonly"] = function(value, prop, initial) {
        this.$editor.setReadOnly(value);
    };

    this.$propHandlers["tabsize"] = function(value, prop, initial) {
        this.$editor.getSession().setTabSize(parseInt(value, 10));
    };

    this.$propHandlers["folding"] = function(value, prop, initial) {
        this.$editor.setShowFoldWidgets(value);
        this.$editor.getSession().setFoldStyle(value ? "markbegin" : "manual");
    };

    this.$propHandlers["fadefoldwidgets"] = function(value, prop, initial) {
        if(this.$editor.setFadeFoldWidgets)
            this.$editor.setFadeFoldWidgets(value);
    };

    this.$propHandlers["softtabs"] = function(value, prop, initial) {
        this.$editor.getSession().setUseSoftTabs(value);
    };

    this.$propHandlers["scrollspeed"] = function(value, prop, initial) {
        this.$editor.setScrollSpeed(value || 2);
    };

    this.$propHandlers["gutter"] = function(value, prop, initial) {
        this.$editor.renderer.setShowGutter(value);
    };

    this.$propHandlers["fontsize"] = function(value, prop, initial) {
        this.$ext.style.fontSize = value + "px";
    };
    this.$propHandlers["wrapmode"] = function(value, prop, initial) {
        this.$editor.getSession().setUseWrapMode(value);
    };
    this.$propHandlers["wraplimitmin"] = function(value, prop, initial) {
        this.$editor.getSession().setWrapLimitRange(value, this.wraplimitmax);
    };
    this.$propHandlers["wraplimitmax"] = function(value, prop, initial) {
        this.$editor.getSession().setWrapLimitRange(this.wraplimitmin, value);
    };
    this.$propHandlers["wrapmodeViewport"] = function(value, prop, initial) {
        if (value === true)
            this.$editor.getSession().setWrapLimitRange(this.wraplimitmin, null);
        else {
            this.$editor.getSession().setWrapLimitRange(this.wraplimitmin, this.printmargincolumn);
        }
    };
    this.$propHandlers["highlightselectedword"] = function(value, prop, initial) {
        this.$editor.setHighlightSelectedWord(value);
    };
    this.$propHandlers["autohidehorscrollbar"] = function(value, prop, initial) {
        this.$editor.renderer.setHScrollBarAlwaysVisible(!value);
    };
    this.$propHandlers["behaviors"] = function(value, prop, initial) {
        this.$editor.setBehavioursEnabled(value);
    };
    this.$propHandlers["wrapbehaviors"] = function(value, prop, initial) {
        this.$editor.setWrapBehavioursEnabled(value);
    };

    var propModelHandler = this.$propHandlers["model"];
    this.$propHandlers["model"] = function(value) {
        propModelHandler.call(this, value);
    };

    this.addEventListener("xmlupdate", function(e){
        var id = e.xmlNode.getAttribute(ppc.xmldb.xmlIdTag);
        if (this.$cache[id]) {
            //@todo Update document
        }
    });

    this.addEventListener("keydown", function(e){
        if (e.keyCode == 9)
            return false;
    });

    /**** Public Methods ****/

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        return this.setProperty("value", value, false, true);
    };

    //@todo cleanup and put initial-message behaviour in one location
    this.clear = function(){
        this.$propHandlers["value"].call(this, "", null, true);
        this.$editor.resize(true);
        //this.$editor.renderer.updateFull(true);

        this.dispatchEvent("clear");//@todo this should work via value change
    };

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.$editor.getSession().getValue(); //@todo very inefficient
    };

    this.getDocument =
    this.getSession = function() {
        return this.$editor.getSession();
    };

    this.getSelection = function() {
        return this.$editor.getSession().getSelection();
    };

    this.getLastSearchOptions = function() {
        return this.$editor.getLastSearchOptions();
    };

    //#endif

    /**
     * Selects the text in this element.
     */
    this.select   = function(){

    };

    /**
     * Deselects the text in this element.
     */
    this.deselect = function(){
        this.$editor.clearSelection();
    };

    this.scrollTo = function(){ };

    this.getDefaults = function() {
        return this.$defaults;
    };

    /**** Private Methods *****/

    this.$focus = function(e){
        if (!this.$ext || this.$ext.disabled)
            return;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");

        this.$editor.focus();
    };

    this.syncValue = function() {
        var doc = this.$editor.getSession();
        if (!doc.cacheId || doc.cacheId == this.$getCacheKey(this.value)) {
            var value = this.getValue();
            if (this.value != value)
                this.setProperty("value", value);
                //this.change(value);
        }
    };

    this.$blur = function(e) {
        if (!this.$ext)
            return;

        // Removed because it was causing problems in some plugins by
        // reloading sessions upon the editor losing focus and it is unknown
        // what's the reasoning behind. Tests show no difference.
        // this.syncValue();

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);
        this.$editor.blur();
    };

    //@todo
    // this.addEventListener("keydown", function(e){}, true);

    /**** Init ****/

    this.$isTextInput = function(e){
        return true;
    };

    this.$draw = function(){
        //Build Main Skin
        this.$ext    = this.$getExternal();
        this.$input  = this.$getLayoutNode("main", "content", this.$ext);

        this.addEventListener("resize", function(e) {
            this.$editor.resize();
        });

        this.$editor = new Editor(new VirtualRenderer(this.$input), null);
        new MultiSelect(this.$editor);

        if (ppc.isTrue(this.getAttribute("globalcommands"))){
            if(this.$editor.keyBinding.setDefaultHandler && !ppc.isIphone) {
              // Don't remove the default handler in case of iOS devices, we might need it for
              // hardware keyboard to operate correctly in Ace
              this.$editor.keyBinding.setDefaultHandler(null);
            }
        }

        // read defaults...
        var ed  = this.$editor;

        var _self = this;
        ed.addEventListener("changeOverwrite", function(e) {
            _self.setProperty("overwrite", e.data);
        });

        ed.addEventListener("guttermousedown", function(e) {
            _self.dispatchEvent("guttermousedown", e);
        });

        ed.addEventListener("gutterdblclick", function(e) {
            _self.dispatchEvent("gutterdblclick", e);
        });
    };

    this.$loadAml = function(){
        var ed  = this.$editor,
            doc = ed.getSession();

        if (this.syntax === undefined)
            this.syntax = "text";
        if (this.tabsize === undefined)
            this.tabsize = doc.getTabSize(); //4
        if (this.softtabs === undefined)
            this.softtabs = doc.getUseSoftTabs(); //true
        if (this.scrollspeed === undefined)
            this.scrollspeed = ed.getScrollSpeed();
        if (this.selectstyle === undefined)
            this.selectstyle = ed.getSelectionStyle();//"line";

        //@todo this is a workaround for a bug in handling boolean properties in ppc.$setDynamicProperty
        this.activeline = ed.getHighlightActiveLine();//true;
        this.gutterline = ed.getHighlightGutterLine();//true;
        this.animatedscroll = ed.getAnimatedScroll();//true
        this.showindentguides = ed.getDisplayIndentGuides();//true
        this.autohidehorscrollbar = !ed.renderer.getHScrollBarAlwaysVisible();//true
        this.highlightselectedword = ed.getHighlightSelectedWord();
        this.behaviors = !ed.getBehavioursEnabled();
        this.wrapbehaviors = ed.getWrapBehavioursEnabled();
            
        if (this.readonly === undefined)
            this.readonly = ed.getReadOnly();//false;
        if (this.showinvisibles === undefined)
            this.showinvisibles = ed.getShowInvisibles();//false;
        if (this.showprintmargin === undefined)
            this.showprintmargin = ed.getShowPrintMargin();//false;
        if (this.printmargincolumn === undefined)
            this.printmargincolumn = ed.getPrintMarginColumn();//80;
        if (this.overwrite === undefined)
            this.overwrite = ed.getOverwrite();//false

        if (this.fontsize === undefined)
            this.fontsize = 12;
        var wraplimit = doc.getWrapLimitRange();
        if (this.wraplimitmin === undefined)
            this.wraplimitmin = 40;
        if (this.wraplimitmax === undefined)
            this.wraplimitmax = wraplimit.max;
        if (this.wrapmode === undefined)
            this.wrapmode = doc.getUseWrapMode(); //false
        if (this.gutter === undefined)
            this.gutter = ed.renderer.getShowGutter();
        if (this.folding === undefined)
            this.folding = true;
        if (this.newlinemode == undefined)
            this.newlinemode = "auto";
    };

// #ifdef __WITH_DATABINDING
}).call(ppc.codeeditor.prototype = new ppc.StandardBinding());
/* #else
}).call(ppc.textbox.prototype = new ppc.Presentation());
#endif*/

ppc.config.$inheritProperties["initial-message"] = 1;

ppc.aml.setElement("codeeditor", ppc.codeeditor);


ppc.codebox = function(struct, tagName) {
    this.$init(tagName || "codebox", ppc.NODE_VISIBLE, struct);
};

(function() {
    this.$isTextInput = function(e){
        return true;
    };
    this.$focussable = true; // This object can get the focus
    this.$childProperty = "value";
    this.value = "";

    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$input = this.$getLayoutNode("main", "input", this.$ext);
        this.$button = this.$getLayoutNode("main", "button", this.$ext);
        this.$inputInitFix = this.$getLayoutNode("main", "initialfix", this.$ext);

        this.addEventListener("resize", function(e) {
            this.ace.resize();
        });

        this.$input.style.textShadow = "none";
        var ace = this.createSingleLineAceEditor(this.$input);

        // disable unneded commands
        ace.commands.removeCommands(["find", "replace", "replaceall", "gotoline", "findnext", "findprevious"]);
        // todo is there a property for these?
        ace.commands.removeCommands(["indent", "outdent"]);

        this.$editor = this.ace = ace;
        ace.renderer.setPadding(0);
        this.ace.codebox = this;

        ace.on("focus", function() {
            dom.removeCssClass(ace.codebox.$ext, "tb_textboxInitial");

            if (ace.renderer.initialMessageNode) {
                ace.renderer.scroller.removeChild(ace.renderer.initialMessageNode);
                ace.renderer.initialMessageNode = null;
            }
        });

        function onBlur() {
            if (ace.$isFocused || ace.session.getValue())
                return;
            dom.addCssClass(ace.codebox.$ext, "tb_textboxInitial");

            if (ace.renderer.initialMessageNode)
                return;
            ace.renderer.initialMessageNode = document.createTextNode(ace.codebox["initial-message"] || "");
            ace.renderer.scroller.appendChild(ace.renderer.initialMessageNode);
        }
        ace.on("blur", onBlur);
        setTimeout(onBlur, 100);
        // todo should we do this here?
        // ace.on("resize", function(){ppc.layout.forceResize();});
        
        if (ppc.isTrue(this.getAttribute("clearbutton"))) {
            var _self = this;
            var visible = false;
            ace.renderer.on("afterRender", function() {
                var show = !!ace.getValue()
                if (visible != show) {
                    visible = show;
                    _self.$button.style.display = visible ? "block" : "";
                }
            });
            this.$button.addEventListener("click", function() {
                ace.setValue("");
            }, false)
        }
        this.$ext.addEventListener("mousedown", function() {
            ace.focus();
        }, false);
    };
    this.getValue = function() {
        return this.ace.getValue();
    };
    this.setValue = function(val) {
        return this.ace.setValue(val);
    };
    this.select = function() {
        return this.ace.selectAll();
    };
    this.$focus = function(e){
        if (!this.$ext || this.disabled)
            return;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");

        this.ace.focus();
    };
    this.$blur = function (){
        if (!this.$ext)
            return;

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);
        if (this.ace)
            this.ace.blur();
    };
    
    this.$enable  = function(){ this.ace.setReadOnly(false); };
    this.$disable = function(){ this.ace.setReadOnly(true); };

    this.execCommand = function(command) {
        this.ace.commands.exec(command, this.ace);
    };

    this.createSingleLineAceEditor = function(el) {
        var renderer = new VirtualRenderer(el);

        renderer.screenToTextCoordinates = function(x, y) {
            var pos = this.pixelToScreenCoordinates(x, y);
            return this.session.screenToDocumentPosition(
                Math.min(this.session.getScreenLength() - 1, Math.max(pos.row, 0)),
                Math.max(pos.column, 0)
            );
        };

        renderer.setOption("maxLines", 4);

        renderer.setStyle("ace_one-line");
        var editor = new Editor(renderer);
        new MultiSelect(editor);
        editor.session.setUndoManager(new UndoManager());

        editor.setHighlightActiveLine(false);
        editor.setShowPrintMargin(false);
        editor.renderer.setShowGutter(false);
        editor.renderer.setHighlightGutterLine(false);

        editor.$mouseHandler.$focusWaitTimout = 0;
        
        
        editor.setReadOnly = function(readOnly) {
            if (this.$readOnly != readOnly) {
                this.codebox.$ext.style.pointerEvents = readOnly ? "none" : "";
            }
            this.setOption("readOnly", readOnly);
        };

        return editor;
    },

    this.$loadAml = function(){
        if (typeof this["clearbutton"] == "undefined")
            this.$setInheritedAttribute("clearbutton");
        if (typeof this["initial-message"] == "undefined")
            this.$setInheritedAttribute("initial-message");
    };

}).call(ppc.codebox.prototype = new ppc.StandardBinding());
ppc.aml.setElement("codebox", ppc.codebox);

});
// #endif
