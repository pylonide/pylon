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
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.1
 */
apf.codeeditor = function(struct, tagName){
    this.$init(tagName || "codeeditor", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
        //#ifdef __WITH_XFORMS
        //,apf.XForms
        //#endif
    );

    this.$editable         = true;
    this.$focussable       = true; // This object can get the focus
    this.$childProperty    = "value";

    //this.realtime          = false;
    this.value             = "";
    this.isContentEditable = true;
    this.multiline         = false;

    /**
     * @attribute {Boolean} realtime whether the value of the bound data is
     * updated as the user types it, or only when this element looses focus or
     * the user presses enter.
     */
    this.$booleanProperties["realtime"]    = true;
    this.$supportedProperties.push("value", "realtime");

    /**
     * @attribute {String} value the text of this element
     * @todo apf3.0 check use of this.$propHandlers["value"].call
     */
    this.$propHandlers["value"] = function(value, prop, initial){
        if (!this.$int || !initial && this.getValue() == value)
            return;

        // Set Value
        /*if (!initial && !value) //@todo apf3.x research the use of clear
            this.clear();
        else {*/
            this.$int.innerHTML = value
                .replace(/ /g, "&nbsp;")
                .replace(/</g, "&lt;")
                .replace(/\n/g, "<br />")
        //}
    };

    /**
     * @attribute {String} initial-message the message displayed by this element
     * when it doesn't have a value set. This property is inherited from parent
     * nodes. When none is found it is looked for on the appsettings element.
     */
    this.$propHandlers["initial-message"] = function(value){
        if (value) {
            //#ifdef __WITH_WINDOW_FOCUS
            if (apf.hasFocusBug)
                this.$int.onblur();
            //#endif
            
            //this.$propHandlers["value"].call(this, value, null, true);
        }
        
        if (!this.value)
            this.clear();
    };

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
        if (this["initial-message"]) {
            this.$propHandlers["value"].call(this, this["initial-message"], null, true);
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Initial");
        }
        else {
            this.$propHandlers["value"].call(this, "", null, true);
        }
        
        this.dispatchEvent("clear");//@todo this should work via value change
    }

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        var v = this.isHTMLBox ? this.$int.innerHTML : this.$int.value;
        return v == this["initial-message"] ? "" : v.replace(/\r/g, "");
    };
    
    //#endif

    /**
     * Selects the text in this element.
     */
    this.select   = function(){ 
        try {
            this.$int.select(); 
        }
        catch(e){}
    };

    /**
     * Deselects the text in this element.
     */
    this.deselect = function(){ this.$int.deselect(); };

    /**** Private Methods *****/

    this.addEventListener("$clear", function(){
        this.value = "";//@todo what about property binding?
        
        if (this["initial-message"] && apf.document.activeElement != this) {
            this.$propHandlers["value"].call(this, this["initial-message"], null, true);
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Initial");
        }
        else {
            this.$propHandlers["value"].call(this, "");
        }
        
        if (!this.$int.tagName.toLowerCase().match(/input|textarea/i)) {
            if (apf.hasMsRangeObject) {
                try {
                    var range = document.selection.createRange();
                    range.moveStart("sentence", -1);
                    //range.text = "";
                    range.select();
                }
                catch(e) {}
            }
        }
        
        this.dispatchEvent("clear"); //@todo apf3.0
    });

    this.$keyHandler = function(key, ctrlKey, shiftKey, altKey, e){
        if (this.$button && key == 27) {
            this.clear();
            this.blur();
        }
        
        if (this.dispatchEvent("keydown", {
            keyCode   : key,
            ctrlKey   : ctrlKey,
            shiftKey  : shiftKey,
            altKey    : altKey,
            htmlEvent : e}) === false)
                return false;

        // @todo: revisit this IF statement - dead code?
        if (false && apf.isIE && (key == 86 && ctrlKey || key == 45 && shiftKey)) {
            var text = window.clipboardData.getData("Text");
            if ((text = this.dispatchEvent("keydown", {
                text : this.onpaste(text)}) === false))
                    return false;
            if (!text)
                text = window.clipboardData.getData("Text");

            this.$int.focus();
            var range = document.selection.createRange();
            range.text = "";
            range.collapse();
            range.pasteHTML(text.replace(/\n/g, "<br />").replace(/\t/g, "&nbsp;&nbsp;&nbsp;"));

            return false;
        }
    };

    var fTimer;
    this.$focus = function(e){
        if (!this.$ext || this.$ext.disabled)
            return;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");

        if (this["initial-message"] && this.$int.value == this["initial-message"]) {
            this.$propHandlers["value"].call(this, "", null, true);
            apf.setStyleClass(this.$ext, "", [this.$baseCSSname + "Initial"]);
        }
    };

    this.$blur = function(e){
        return;
        if (!this.$ext)
            return;
        
        if (!this.realtime)
            this.change(this.getValue());

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);

        if (this["initial-message"] && this.$int.value == "") {
            this.$propHandlers["value"].call(this, this["initial-message"], null, true);
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Initial");
        }

        clearInterval(fTimer);
    };

    /**** Init ****/
    
    this.addEventListener("$load", function(){
        if (!this.viewport.limit)
            this.viewport.limit = 1;
    });
    
    this.clear = function(nomsg, do_event){
        if (this.clearSelection)
            this.clearSelection(!do_event);

        this.documentId = this.xmlRoot = this.cacheId = null;

        if (!nomsg) {
            this.viewport.offset = 0;
            this.viewport.length = 0;
            this.viewport.sb.update();
    
            this.$setClearMessage(this["empty-message"]);
        }
        else if(this.$removeClearMessage)
           this.$removeClearMessage();
        
        this.viewport.cache = null;
    };

    this.viewport = {
        offset : 0,
        limit  : 2,
        length : 0,
        host   : this,
        cache  : null,
        
        inited : false,
        draw : function(){
            this.inited = true;
            var l = this.length = 388;
            
            this.sb = new apf.scrollbar({htmlNode: this.host.$pHtmlNode});
            this.sb.overflow = "scroll";
            
            var limit = this.limit; this.limit = 0;
            
            var _self = this.host, vp = this;
            this.sb.attach(this.host.$int, this, function(timed, pos){
                if (vp.sb.realtime || !timed) {
                    vp.change(l * pos, vp.limit, false);
                }
                else {
                    clearTimeout(this.virtualVTimer);
                    this.virtualVTimer = $setTimeout(function(){
                        vp.change(Math.round(vp.length * pos), vp.limit, false);
                    }, 300);
                }
            });
        },
        
        findNewLimit : function(scrollTop){
            this.limit = 50;
        },
        
        /**
         *  @todo   This method should be optimized by checking if there is
         *          overlap between the new offset and the old one
         */
        change : function(offset, limit, updateScrollbar, noScroll){
            var offsetN;

            if (offset < 0) 
                offset = 0;
            
            var s;
            var nl = (s = this.host.value.split("\n")).length;
            if (offset > nl - this.limit - 1) 
                offsetN = Math.floor(nl - this.limit - 1);
            else 
                offsetN = Math.floor(offset);
                
            if (!limit)
                limit = this.limit;
            
            //var offsetN = Math.floor(offset);

            this.cache   = null;
            var diff     = offsetN - this.offset,
                oldLimit = this.limit;
            if (diff * diff >= this.limit*this.limit) //there is no overlap
                diff = false;
            this.offset = offsetN;
            
            if (diff > 0) { //get last node before resize
                var lastNode = this.host.$int.lastChild;
                if (lastNode.nodeType != 1)
                    lastNode = lastNode.previousSibling;
            }
            
            /*if (limit && this.limit != limit)
                this.resize(limit, updateScrollbar);
            else */
            if (updateScrollbar) {
                this.sb.$curValue = this.offset / (this.length - this.limit - 1);
                this.sb.updatePos();
            }

            //this.viewport.prepare();
            
            this.host.$propHandlers["value"].call(this.host, (s.slice(offset, offset+limit) || []).join("\n"));
        }
    };
    
    //this.viewport.sb.parentNode = new apf.Class().$init();
    //this.viewport.sb.parentNode.$int = this.$pHtmlNode;
    //this.viewport.sb.dispatchEvent("DOMNodeInsertedIntoDocument");
    
    this.$isInViewport = function(xmlNode, struct){
    };
    
    this.scrollTo = function(xmlNode, last){
        var sPos = {};
        this.$isInViewport(xmlNode, sPos);
        this.viewport.change(sPos.position + (last ? this.viewport.limit - 1 : 0));
    };
    
    this.$draw = function(){
        var _self = this;
        
        //Build Main Skin
        this.$ext = this.$getExternal(null, null, function(oExt){
            oExt.setAttribute("onmousedown", "this.host.dispatchEvent('mousedown', {htmlEvent : event});");
            oExt.setAttribute("onmouseup",   "this.host.dispatchEvent('mouseup', {htmlEvent : event});");
            oExt.setAttribute("onclick",     "this.host.dispatchEvent('click', {htmlEvent : event});");
        });
        this.$int    = this.$getLayoutNode("main", "content", this.$ext);
        
        this.viewport.host = this;
        this.viewport.draw();
        
        //#ifdef __WITH_LAYOUT
        apf.layout.setRules(this.$int, "scrollbar", "\
            var s = apf.all[" + this.viewport.sb.$uniqueId + "];\
            s.update();\
        ", true);
        apf.layout.queue(this.$int);
        //#endif
        
        this.$int.onselectstart = function(e){
            if (!e) e = event;
            e.cancelBubble = true;
        }
        this.$int.host = this;

        this.$int.onkeydown = function(e){
            e = e || window.event;
            
            return false;

            //Change
            if (!_self.realtime) {
                var value = _self.getValue();
                if (e.keyCode == 13 && value != this.value)
                    _self.change(value);
            }
            else if (apf.isWebkit && _self.xmlRoot && _self.getValue() != this.value) //safari issue (only old??)
                $setTimeout("var o = apf.lookup(" + _self.$uniqueId + ");\
                    o.change(o.getValue())");

            if (_self.multiline == "optional" && e.keyCode == 13 && !e.shiftKey
              || e.ctrlKey && (e.keyCode == 66 || e.keyCode == 73
              || e.keyCode == 85)) {
                e.returnValue = false;
                return false;
            }

            return _self.$keyHandler(e.keyCode, e.ctrlKey,
                e.shiftKey, e.altKey, e);
        };

        this.$int.onkeyup = function(e){
            if (!e)
                e = event;

            var keyCode = e.keyCode;
            
            if (_self.$button)
                _self.$button.style.display = this.value ? "block" : "none";

            if (_self.realtime) {
                $setTimeout(function(){
                    var v;
                    if ((v = _self.getValue()) != _self.value)
                        _self.change(v); 
                    _self.dispatchEvent("keyup", {keyCode : keyCode});//@todo
                });
            }
            else {
                _self.dispatchEvent("keyup", {keyCode : keyCode});//@todo
            }
        };

        if (!this.$int.tagName.toLowerCase().match(/input|textarea/)) {
            this.isHTMLBox = true;

            this.$int.unselectable    = "Off";
            this.$int.contentEditable = true;
            this.$int.style.width     = "1px";

            this.$int.select = function(){
                var r = document.selection.createRange();
                r.moveToElementText(this);
                r.select();
            }
        };

        this.$int.deselect = function(){
            if (!document.selection) return;

            var r = document.selection.createRange();
            r.collapse();
            r.select();
        };
    };

    this.$loadAml = function() {
        if (typeof this["initial-message"] == "undefined")
            this.$setInheritedAttribute("initial-message");

        if (typeof this.realtime == "undefined")
            this.$setInheritedAttribute("realtime");
    }

    this.addEventListener("DOMNodeRemovedFromDocument", function(){
        if (this.$button)
            this.$button.onmousedown = null;
        
        if (this.$int) {
            this.$int.onkeypress     =
            this.$int.onmouseup      =
            this.$int.onmouseout     =
            this.$int.onmousedown    =
            this.$int.onkeydown      =
            this.$int.onkeyup        =
            this.$int.onselectstart  = null;
        }
    });
// #ifdef __WITH_DATABINDING
}).call(apf.codeeditor.prototype = new apf.StandardBinding());
/* #else
}).call(apf.textbox.prototype = new apf.Presentation());
#endif*/

apf.config.$inheritProperties["initial-message"] = 1;
apf.config.$inheritProperties["realtime"]        = 1;

apf.aml.setElement("codeeditor",  apf.codeeditor);
// #endif
