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
 * @inherits apf.StandardBinding
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @author      Fabian Jakobs (fabian AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.1
 */

if (!apf.hasRequireJS)
    apf.aml.setElement("codeeditor", apf.textbox);
else
    require.def("apf/elements/codeeditor",
        ["ace/Editor", "ace/VirtualRenderer", "ace/Document", "ace/UndoManager", "ace/Range"],
        function(Editor, VirtualRenderer, Document, UndoManager, Range) {

apf.codeeditor = function(struct, tagName) {
    this.$init(tagName || "codeeditor", apf.NODE_VISIBLE, struct);

    this.documents = [];
    this.$cache    = {};

    this.setProperty("overwrite", false);
    this.setProperty("line", 1);
    this.setProperty("col", 1)
};

(function() {
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
    );

    this.$focussable       = true; // This object can get the focus
    this.$childProperty    = "value";
    this.$isTextInput      = true;

    this.syntax            = "Text";
    this.tabsize           = 4;
    this.softtabs          = true;
    this.value             = "";
    this.selectstyle       = "line";
    this.multiline         = true;
    this.activeline        = true;
    this.caching           = true;
    this.readonly          = false;
    this.showinvisibles    = false;
    this.showprintmargin   = false;
    this.overwrite         = false;
    this.softtabs          = false;

    this.$booleanProperties["activeline"]       = true;
    this.$booleanProperties["caching"]          = true;
    this.$booleanProperties["readonly"]         = true;
    this.$booleanProperties["showinvisibles"]   = true;
    this.$booleanProperties["showprintmargin"]  = true;
    this.$booleanProperties["overwrite"]        = true;
    this.$booleanProperties["softtabs"]         = true;

    this.$supportedProperties.push("value", "syntax",
        "activeline", "selectstyle", "caching", "readonly", "showinvisibles",
        "showprintmargin", "printmargincolumn", "overwrite",
        "tabsize", "softtabs", "debugger");

    this.$getCacheKey = function(value) {
        if (typeof value == "string")
            var key = this.xmlRoot
                ? this.xmlRoot.getAttribute(apf.xmldb.xmlIdTag)
                : value;
        else
            key = value.getAttribute(apf.xmldb.xmlIdTag);
        
        return key;
    }
    
    this.clearCacheItem = function(xmlNode) {
        if (!this.caching)
            return;
        
        var key = this.$getCacheKey(xmlNode);
        if (key)
            delete this.$cache[key];
    }
    
    /**
     * @attribute {String} value the text of this element
     * @todo apf3.0 check use of this.$propHandlers["value"].call
     */
    this.$propHandlers["value"] = function(value){ //@todo apf3.0 add support for the range object as a value
        var doc, key,
            _self = this;

        if (this.caching)
            key = this.$getCacheKey(value);
        //Assuming document
        else if (value instanceof Document){
            doc = value;
        }

        if (!doc && key)
            doc = this.$cache[key];

        if (!doc) {
            if (value.nodeType) {
                apf.xmldb.addNodeListener(value.nodeType == 1
                    ? value : value.parentNode, this);
            }

            doc = new Document(typeof value == "string"
              ? value
              : (value.nodeType > 1 && value.nodeType < 5 //@todo replace this by a proper function
                    ? value.nodeValue
                    : value.firstChild && value.firstChild.nodeValue || ""));

            doc.setUndoManager(new UndoManager());

            if (key)
                this.$cache[key] = doc;
        }
        //@todo value can also be an xml node and should be updated in a similar fashion as above
        else if (typeof value == "string" && !doc.hasValue) {
            //@todo big hack!
            doc.setValue(value);
            doc.hasValue = true;
        }

        apf.queue.add("ce" + _self.$uniqueId, function() {
            _self.$getMode(_self.syntax, function(mode) {
                doc.setMode(mode);
            });
            doc.setTabSize(parseInt(_self.tabsize));
            doc.setUseSoftTabs(_self.softtabs);
            
            _self.$removeDocListeners && _self.$removeDocListeners();
            _self.$removeDocListeners = _self.$addDocListeners(doc);
            
            _self.$editor.setDocument(doc);            

            _self.$updateMarker();
            _self.$updateBreakpoints(doc);
        })
    };

    this.$addDocListeners = function(doc) {
        var self = this;
        var onCursorChange = function() {
            var cursor = doc.getSelection().getCursor();
            self.setProperty("line", cursor.row+1);
            self.setProperty("col", cursor.column+1);
        };

        doc.getSelection().addEventListener("changeCursor", onCursorChange);

        onCursorChange();

        return function() {
            doc.getSelection().removeEventListener("changeCursor", onCursorChange);
        };
    };

    this.$updateMarker = function() {
        if (this.$marker) {
            this.$editor.renderer.removeMarker(this.$marker);
            this.$marker = null;
        }

        if (!this.$debugger)
            return;

        var frame = this.$debugger.activeframe;
        if (!frame)
            return;

        var script = this.xmlRoot;
        if (script.getAttribute("scriptid") !== frame.getAttribute("scriptid"))
            return;

        var lineOffset = parseInt(script.getAttribute("lineoffset"));
        var row = parseInt(frame.getAttribute("line")) - lineOffset;
        var range = new Range(row, 0, row+1, 0);
        this.$marker = this.$editor.renderer.addMarker(range, "ace_step", "line");

        this.$editor.moveCursorTo(row, parseInt(frame.getAttribute("column")));
    };

    this.$updateBreakpoints = function(doc) {
        doc = doc || this.$editor.getDocument();

        doc.setBreakpoints([]);
        if (!this.$breakpoints)
            return;

        if (this.xmlRoot) {
            var scriptName = this.xmlRoot.getAttribute("scriptname");
            if (!scriptName)
                return;

            var breakpoints = this.$breakpoints.queryNodes("//breakpoint[@script='" + scriptName + "']"); 

            var rows = [];
            for (var i=0; i<breakpoints.length; i++) {
                rows.push(parseInt(breakpoints[i].getAttribute("line")) - parseInt(breakpoints[i].getAttribute("lineoffset")));
            }
            if (rows.length)
                doc.setBreakpoints(rows);
        }
    };

    this.$toggleBreakpoint = function(row) {
        this.$debugger.toggleBreakpoint(this.xmlRoot, row);
    };

    this.$propHandlers["syntax"] = function(value) {
        var _self = this;
        this.$getMode(value, function(mode) {
            _self.$editor.getDocument().setMode(mode);
        });
    };

    this.$modes = {};

    this.$getMode = function(syntax, callback) {
        syntax = syntax || "Text";
        if (syntax.indexOf("/") == -1)
            syntax = "ace/mode/" + syntax;
        if (this.$modes[syntax])
            return callback(this.$modes[syntax]);

        var _self = this;
        require([syntax], function(ModeClass) {
            // #ifdef __DEBUG
            if (typeof ModeClass != "function")
                return apf.console.error("Unkown sytax type: '" + syntax + "'");
            // #endif
            _self.$modes[syntax] = new ModeClass();
            callback(_self.$modes[syntax]);
        });
    };

    this.$propHandlers["activeline"] = function(value) {
        this.$editor.setHighlightActiveLine(value);
    };

    this.$propHandlers["selectstyle"] = function(value) {
        this.$editor.setSelectionStyle(value);
    };

    this.$propHandlers["showprintmargin"] = function(value, prop, initial) {
        this.$editor.setShowPrintMargin(value);
    };

    this.$propHandlers["printmargincolumn"] = function(value, prop, initial) {
        this.$editor.setPrintMarginColumn(value);
    };

    this.$propHandlers["showinvisibles"] = function(value, prop, initial) {
        this.$editor.setShowInvisibles(value);
    };

    this.$propHandlers["overwrite"] = function(value, prop, initial) {
        this.$editor.setOverwrite(value);
    };

    this.$propHandlers["readonly"] = function(value, prop, initial) {
        this.$editor.setReadOnly(value);
    };

    this.$propHandlers["tabsize"] = function(value, prop, initial) {
        this.$editor.getDocument().setTabSize(parseInt(value));
    };

    this.$propHandlers["softtabs"] = function(value, prop, initial) {
        this.$editor.getDocument().setUseSoftTabs(value);
    };

    this.$propHandlers["debugger"] = function(value, prop, inital) {
        if (this.$debugger) {           
            this.$breakpoints.removeEventListener("update", this.$onBreakpoint);
            this.$debugger.removeEventListener("prop.activeframe", this.$onChangeActiveFrame);
            this.$debugger.removeEventListener("break", this.$onChangeActiveFrame);
        }
        
        if (typeof value === "string") {
            //#ifdef __WITH_NAMESERVER
            this.$debugger = apf.nameserver.get("debugger", value);
            //#endif
        } else {
            this.$debugger = value;
        }

        if (!this.$debugger) {
            this.$breakpoints = null;
            this.$updateBreakpoints();
            this.$updateMarker();
            return;
        }
            
        this.$breakpoints = this.$debugger.$mdlBreakpoints;

        var self = this;
        self.$updateBreakpoints();
        this.$onBreakpoint = function() {
            self.$updateBreakpoints();
        }
        this.$breakpoints.addEventListener("update", this.$onBreakpoint);

        this.$updateMarker();
        this.$onChangeActiveFrame = function() {
            self.$updateMarker();
        }
        this.$debugger.addEventListener("prop.activeframe", this.$onChangeActiveFrame);
        this.$debugger.addEventListener("break", this.$onChangeActiveFrame);
    };

    var propModelHandler = this.$propHandlers["model"];
    this.$propHandlers["model"] = function(value) {
        propModelHandler.call(this, value);

        this.$updateMarker();
        this.$updateBreakpoints();
    };

    this.addEventListener("xmlupdate", function(e){
        var id = e.xmlNode.getAttribute(apf.xmldb.xmlIdTag);
        if (this.$cache[id]) {
            //@todo Update document
        }
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

        this.dispatchEvent("clear");//@todo this should work via value change
    }

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.$editor.getDocument().toString(); //@todo very inefficient
    };

    this.getDocument = function() {
        return this.$editor.getDocument();        
    };

    this.getSelection = function() {
        return this.$editor.getDocument().getSelection();        
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

    this.scrollTo = function(){

    }

    /**** Private Methods *****/

    this.$focus = function(e){
        if (!this.$ext || this.$ext.disabled)
            return;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");

        this.$editor.focus();
    };

    this.$blur = function(e){
        if (!this.$ext)
            return;

        if (this.value != this.getValue())
            this.change(this.getValue());

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);
        this.$editor.blur();
    };

    //@todo
    this.addEventListener("keydown", function(e){
        //this.$editor.
    }, true);

    /**** Init ****/

    this.$isTextInput = function(e){
        return true;
    };

    this.$draw = function(){
        //Build Main Skin
        this.$ext   = this.$getExternal();
        this.$input = this.$getLayoutNode("main", "content", this.$ext);

        this.addEventListener("resize", function(e){
            this.$editor.resize();
        });

        this.$editor = new Editor(new VirtualRenderer(this.$input));

        var self = this;
        this.$editor.addEventListener("changeOverwrite", function(e) {
            self.setProperty("overwrite", e.data);
        });

        this.$editor.addEventListener("gutterclick", function(e) {
            self.dispatchEvent("gutterclick", e);
        });

        this.$editor.addEventListener("gutterdblclick", function(e) {
            self.dispatchEvent("gutterdblclick", e);
            if (self.$debugger) {
                self.$toggleBreakpoint(e.row);
            }
        });

        apf.sanitizeTextbox(this.$editor.renderer.container.getElementsByTagName("textarea")[0]);
    };

// #ifdef __WITH_DATABINDING
}).call(apf.codeeditor.prototype = new apf.StandardBinding());
/* #else
}).call(apf.textbox.prototype = new apf.Presentation());
#endif*/

apf.config.$inheritProperties["initial-message"] = 1;

apf.aml.setElement("codeeditor", apf.codeeditor);

});
// #endif