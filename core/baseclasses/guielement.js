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

apf.__GUIELEMENT__ = 1 << 15;
apf.__VALIDATION__ = 1 << 6;

// #ifdef __WITH_GUIELEMENT

/**
 * All elements inheriting from this {@link term.baseclass baseclass} are a aml component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.Anchoring
 * @inherits apf.DelayedRender
 * @inherits apf.DragDrop
 * @inherits apf.Focussable
 * @inherits apf.Interactive
 * @inherits apf.Transaction
 * @inherits apf.Validation
 *
 * @attribute {String} span     the number of columns this element spans. Only used inside a table element.
 * @attribute {String} margin   
 * @todo attribute align
 *
 * @attribute {mixed} left the left position of this element. Depending
 * on the choosen layout method the unit can be pixels, a percentage or an
 * expression.
 *
 * @attribute {mixed} top the top position of this element. Depending
 * on the choosen layout method the unit can be pixels, a percentage or an
 * expression.
 *
 * @attribute {mixed} right the right position of this element. Depending
 * on the choosen layout method the unit can be pixels, a percentage or an
 * expression.
 *
 * @attribute {mixed} bottom the bottom position of this element. Depending
 * on the choosen layout method the unit can be pixels, a percentage or an
 * expression.
 *
 * @attribute {mixed} width the different between the left edge and the
 * right edge of this element. Depending on the choosen layout method the
 * unit can be pixels, a percentage or an expression.
 * Remarks:
 * When used as a child of a grid element the width can also be set as '*'. 
 * This will fill the rest space.
 *
 * @attribute {mixed} height the different between the top edge and the
 * bottom edge of this element. Depending on the choosen layout method the
 * unit can be pixels, a percentage or an expression.
 * Remarks:
 * When used as a child of a grid element the height can also be set as '*'. 
 * This will fill the rest space.
 *
 * @event resize Fires when the element changes width or height. 
 * 
 * @event contextmenu Fires when the user requests a context menu. Either
 * using the keyboard or mouse.
 *   bubbles: yes
 *   cancelable:  Prevents the default contextmenu from appearing.
 *   object:
 *   {Number} x         the x coordinate where the contextmenu is requested on.
 *   {Number} y         the y coordinate where the contextmenu is requested on.
 *   {Event}  htmlEvent the html event object that triggered this event from being called.
 * @event focus       Fires when this element receives focus.
 * @event blur        Fires when this element loses focus.
 * @event keydown     Fires when this element has focus and the user presses a key on the keyboard.
 *   cancelable: Prevents the default key action.
 *   bubbles:
 *   object:
 *   {Boolean} ctrlKey   whether the ctrl key was pressed.
 *   {Boolean} shiftKey  whether the shift key was pressed.
 *   {Boolean} altKey    whether the alt key was pressed.
 *   {Number}  keyCode   which key was pressed. This is an ascii number.
 *   {Event}   htmlEvent the html event object that triggered this event from being called.
 */
apf.GuiElement = function(){
    this.$init(true);
};

(function(){
    this.$regbase    = this.$regbase | apf.__GUIELEMENT__;
    
    this.$focussable = apf.KEYBOARD_MOUSE; // Each GUINODE can get the focus by default
    this.visible     = 2; //default value;
    
    /*this.minwidth   = 5;
    this.minheight  = 5;
    this.maxwidth   = 10000;
    this.maxheight  = 10000;*/
    
    //#ifdef __WITH_KEYBOARD
    this.$booleanProperties["disable-keyboard"] = true;
    //#endif
    this.$booleanProperties["visible"]          = true;
    this.$booleanProperties["focussable"]       = true;
    
    //#ifdef __WITH_INTERACTIVE
    this.$supportedProperties.push("draggable", "resizable");
    //#endif
    this.$supportedProperties.push(
        "focussable", "zindex", "disabled", "tabindex",
        "disable-keyboard", "contextmenu", "visible", "autosize", 
        "loadaml", "actiontracker", "alias",
        "width", "left", "top", "height", "tooltip"
    );

    this.$setLayout = function(type, insert){
        if (!this.$drawn || !this.$pHtmlNode)
            return false;

        if (this.parentNode) {
            // #ifdef __AMLTABLE
            if (this.parentNode.localName == "table") {
                if (this.$disableCurrentLayout)
                    this.$disableCurrentLayout();
                this.parentNode.register(this, insert);
                this.$disableCurrentLayout = null;
                return type == "table";
            }else
            // #endif

            // #ifdef __AMLVBOX || __AMLHBOX
            if ("vbox|hbox".indexOf(this.parentNode.localName) > -1) {
                if (this.$disableCurrentLayout)
                    this.$disableCurrentLayout();
                this.parentNode.register(this, insert);
                this.$disableCurrentLayout = null;
                return type == this.parentNode.localName;
            } //else
            // #endif
        }
        
        // #ifdef __WITH_ANCHORING
        if (!this.$anchoringEnabled) {
            if (this.$disableCurrentLayout)
                this.$disableCurrentLayout();
            this.$enableAnchoring();
            this.$disableCurrentLayout = this.$disableAnchoring;
        }
        return type == "anchoring";
        // #endif
    }
    
    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget == this 
          && "vbox|hbox|table".indexOf(this.parentNode.localName) == -1) {
            this.$setLayout();
        }
    }); 

    this.implement(
        //#ifdef __WITH_ANCHORING
        apf.Anchoring
        //#endif
        //#ifdef __WITH_CONTENTEDITABLE
        ,apf.ContentEditable
        //#endif
        //#ifdef __WITH_LIVEEDIT
        ,apf.LiveEdit
        //#endif
    );
    
    /**** Convenience functions for gui nodes ****/

    //#ifdef __WITH_CONVENIENCE_API

    /**** Geometry ****/

    /**
     * Sets the different between the left edge and the right edge of this
     * element. Depending on the choosen layout method the unit can be
     * pixels, a percentage or an expression.
     * Call-chaining is supported.
     * @param {Number} value the new width of this element.
     */
    this.setWidth = function(value){
        this.setProperty("width", value, false, true);
        return this;
    };

    /**
     * Sets the different between the top edge and the bottom edge of this
     * element. Depending on the choosen layout method the unit can be
     * pixels, a percentage or an expression.
     * Call-chaining is supported.
     * @param {Number} value the new height of this element.
     */
    this.setHeight = function(value){
        this.setProperty("height", value, false, true);
        return this;
    };

    /**
     * Sets the left position of this element. Depending on the choosen
     * layout method the unit can be pixels, a percentage or an expression.
     * Call-chaining is supported.
     * @param {Number} value the new left position of this element.
     */
    this.setLeft   = function(value){
        this.setProperty("left", value, false, true);
        return this;
    };

    /**
     * Sets the top position of this element. Depending on the choosen
     * layout method the unit can be pixels, a percentage or an expression.
     * Call-chaining is supported.
     * @param {Number} value the new top position of this element.
     */
    this.setTop    = function(value){
        this.setProperty("top", value, false, true);
        return this;
    };

    if (!this.show) {
        /**
         * Makes the elements visible. Call-chaining is supported.
         */
        this.show = function(){
            this.setProperty("visible", true, false, true);
            return this;
        };
    }

    if (!this.hide) {
        /**
         * Makes the elements invisible. Call-chaining is supported.
         */
        this.hide = function(){
            this.setProperty("visible", false, false, true);
            return this;
        };
    }

    /**
     * Retrieves the calculated width in pixels for this element
     */
    this.getWidth  = function(){
        return (this.$ext || {}).offsetWidth;
    };

    /**
     * Retrieves the calculated height in pixels for this element
     */
    this.getHeight = function(){
        return (this.$ext || {}).offsetHeight;
    };

    /**
     * Retrieves the calculated left position in pixels for this element
     * relative to the offsetParent.
     */
    this.getLeft   = function(){
        return (this.$ext || {}).offsetLeft;
    };

    /**
     * Retrieves the calculated top position in pixels for this element
     * relative to the offsetParent.
     */
    this.getTop    = function(){
        return (this.$ext || {}).offsetTop;
    };

    /**** Disabling ****/

    /**
     * Activates the functions of this element. Call-chaining is supported.
     */
    this.enable  = function(){
        this.setProperty("disabled", false, false, true);
        return this;
    };

    /**
     * Deactivates the functions of this element.
     * Call-chaining is supported.
     */
    this.disable = function(){
        this.setProperty("disabled", true, false, true);
        return this;
    };

    /**** z-Index ****/

    /**
     * Moves this element to the lowest z ordered level.
     * Call-chaining is supported.
     */
    this.sendToBack = function(){
        this.setProperty("zindex", 0, false, true);
        return this;
    };

    /**
     * Moves this element to the highest z ordered level.
     * Call-chaining is supported.
     */
    this.bringToFront  = function(){
        this.setProperty("zindex", apf.all.length + 1, false, true);
        return this;
    };

    /**
     * Moves this element one z order level deeper.
     * Call-chaining is supported.
     */
    this.sendBackwards = function(){
        this.setProperty("zindex", this.zindex - 1, false, true);
        return this;
    };

    /**
     * Moves this element one z order level higher.
     * Call-chaining is supported.
     */
    this.bringForward  = function(){
        this.setProperty("zindex", this.zindex + 1, false, true);
        return this;
    };

    //#endif
    
    this.hasFocus = function(){}

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var x = this.$aml;

        // will $pHtmlNode be deprecated soon?
        // check used to be:
        //if (!this.$pHtmlNode && this.parentNode)
        if (this.parentNode) {
            if (this.localName == "item" 
              && this.parentNode.hasFeature(apf.__MULTISELECT__)) //special case for item nodes, using multiselect rendering
                this.$pHtmlNode = this.parentNode.$container;
            else
                this.$pHtmlNode = this.parentNode.$int; //@todo apf3.0 change this in the mutation events
        }

        if (!this.$pHtmlNode) //@todo apf3.0 retry on DOMNodeInserted
            return;
        
        this.$pHtmlDoc  = this.$pHtmlNode.ownerDocument || document;

        if (this.$initSkin)
            this.$initSkin(x);

        if (this.$draw)
            this.$draw();

        if (e.id)
            this.$ext.setAttribute("id", e.id);

        if (typeof this.visible == "undefined")
            this.visible = true;

        // #ifdef __DEBUG
        if (apf.debug && this.$ext && this.$ext.nodeType)
            this.$ext.setAttribute("uniqueId", this.$uniqueId);
        // #endif

        //#ifdef __WITH_FOCUS
        if (this.$focussable && typeof this.focussable == "undefined")
            apf.GuiElement.propHandlers.focussable.call(this);
        //#endif
        
        this.$drawn = true;
    }, true);
    
    var f = function(e){
        if (!this.$pHtmlNode) //@todo apf3.0 retry on DOMInsert or whatever its called
            return;
        
        this.$setLayout(); //@todo apf3.0 moving an element minwidth/height should be recalced
        
        //@todo apf3.0 set this also for skin change
        if (this.$ext) {
            var hasPres = (this.hasFeature(apf.__PRESENTATION__)) || false;
            var type        = this.$isLeechingSkin ? this.localName : "main";
            if (this.minwidth == undefined)
                this.minwidth   = apf.getCoord(hasPres && parseInt(this.$getOption(type, "minwidth")), 0);
            if (this.minheight == undefined)
                this.minheight  = apf.getCoord(hasPres && parseInt(this.$getOption(type, "minheight")), 0);
            if (this.maxwidth == undefined)
                this.maxwidth   = apf.getCoord(hasPres && parseInt(this.$getOption(type, "maxwidth")), 10000);
            if (this.maxheight == undefined)
                this.maxheight  = apf.getCoord(hasPres && parseInt(this.$getOption(type, "maxheight")), 10000);

            //--#ifdef __WITH_CONTENTEDITABLE
            //@todo slow??
            var diff = apf.getDiff(this.$ext);
            this.$ext.style.minWidth = Math.max(0, this.minwidth - diff[0]) + "px";
            this.$ext.style.minHeight = Math.max(0, this.minheight - diff[1]) + "px";
            this.$ext.style.maxWidth = Math.max(0, this.maxwidth - diff[0]) + "px";
            this.$ext.style.maxHeight = Math.max(0, this.maxheight - diff[1]) + "px";
            
            if (this.$altExt && apf.isGecko) {
                this.$altExt.style.minHeight = this.$ext.style.minHeight;
                this.$altExt.style.maxHeight = this.$ext.style.maxHeight;
                this.$altExt.style.minWidth = this.$ext.style.minWidth;
                this.$altExt.style.maxWidth = this.$ext.style.maxWidth;
            }
            //--#endif
        }
        
        if (this.$loadAml)
            this.$loadAml(this.$aml); //@todo replace by event
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", f);
    this.addEventListener("$skinchange", f);
    
    //#ifdef __WITH_LAYOUT
    var f;
    this.addEventListener("$event.resize", f = function(c){
        apf.layout.setRules(this.$ext, "resize", "var o = apf.all[" + this.$uniqueId + "];\
            if (o) o.dispatchEvent('resize');", true);

        apf.layout.queue(this.$ext);
        //apf.layout.activateRules(this.$ext);
        this.removeEventListener("$event.resize", f);
    });
    //#endif

    //#ifdef __AMLCONTEXTMENU
    this.addEventListener("contextmenu", function(e){
        // #ifdef __WITH_CONTENTEDITABLE
        if (this.editable) { //@todo when the event system is done proper this should be handled in ce2.js
            e.returnValue  = false;
            e.cancelBubble = true;
            return false;
        }
        // #endif
        
        if (!this.contextmenus) return;
        
        if (this.hasFeature(apf.__DATABINDING__)) {
            var contextmenu;
            var xmlNode = this.hasFeature(apf.__MULTISELECT__)
                ? this.selected
                : this.xmlRoot;

            var i, l, m, isRef, sel, menuId, cm, result;
            for (i = 0, l = this.contextmenus.length; i < l; i++) {
                isRef  = (typeof (cm = this.contextmenus[i]) == "string");
                result = null;
                if (!isRef && cm.match && xmlNode) {//@todo apf3.0 cache this statement
                    result = (cm.cmatch || (cm.cmatch = apf.lm.compile(cm.match, {
                        xpathmode  : 3,
                        injectself : true
                    })))(xmlNode)
                }

                if (isRef || xmlNode && result || !cm.match) { //!xmlNode && 
                    menuId = isRef
                        ? cm
                        : cm.menu

                    if (!self[menuId]) {
                        // #ifdef __DEBUG
                        throw new Error(apf.formatErrorString(0, this,
                            "Showing contextmenu",
                            "Could not find contextmenu by name: '" + menuId + "'"),
                            this.$aml);
                        // #endif
                        
                        return;
                    }

                    self[menuId].display(e.x, e.y, null, this, xmlNode);

                    e.returnValue  = false;//htmlEvent.
                    e.cancelBubble = true;
                    break;
                }
            }

            //IE6 compatiblity
            /*
            @todo please test that disabling this is OK
            if (!apf.config.disableRightClick) {
                document.oncontextmenu = function(){
                    document.oncontextmenu = null;
                    e.cancelBubble = true;
                    return false;
                }
            }*/
        }
        else {
            menuId = typeof this.contextmenus[0] == "string"
                ? this.contextmenus[0]
                : this.contextmenus[0].getAttribute("menu")

            if (!self[menuId]) {
                // #ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, this,
                    "Showing contextmenu",
                    "Could not find contextmenu by name: '" + menuId + "'",
                    this.$aml));
                // #endif
                
                return;
            }

            self[menuId].display(e.x, e.y, null, this);

            e.returnValue = false;//htmlEvent.
            e.cancelBubble = true;
        }
    });
    //#endif
}).call(apf.GuiElement.prototype = new apf.AmlElement());

/**
 * @for apf.amlNode
 * @private
 */
apf.GuiElement.propHandlers = {
    //#ifdef __WITH_FOCUS
    /**
     * @attribute {Boolean} focussable whether this element can receive the focus.
     * The focussed element receives keyboard event.s
     */
    "focussable": function(value){
        this.focussable = typeof value == "undefined" || value;

        if (!this.hasFeature(apf.__FOCUSSABLE__)) //@todo should this be on the prototype
            this.implement(apf.Focussable);

        if (this.focussable) {
            apf.window.$addFocus(this, this.tabindex);
        }
        else {
            apf.window.$removeFocus(this);
        }
    },
    //#endif

    /**
     * @attribute {Number} zindex the z ordered layer in which this element is
     * drawn.
     */
    "zindex": function(value){
        this.$ext.style.zIndex = value;
    },

    /**
     * @attribute {Boolean} visible whether this element is shown.
     */
    "visible": function(value){
        if (apf.isFalse(value) || typeof value == "undefined") {
            if (this.$ext)
                this.$ext.style.display = "none";
            
            if (apf.document.activeElement == this || this.canHaveChildren == 2
              && apf.isChildOf(this, apf.document.activeElement, false)) {
                if (apf.config.allowBlur && this.hasFeature(apf.__FOCUSSABLE__))
                    this.blur();
                else
                    apf.window.moveNext();
            }
            
            this.visible = false;
        }
        else { //if (apf.isTrue(value)) default
            if (this.$ext) {
                this.$ext.style.display = ""; //Some form of inheritance detection
                if (!this.$ext.offsetHeight)
                    this.$ext.style.display = this.$display || "block";
            }
            
            //#ifdef __WITH_LAYOUT
            if (apf.layout && this.$int) //apf.hasSingleRszEvent)
                apf.layout.forceResize(this.$int);//this.$int
            //#endif
            
            this.visible = true;
        }
    },

    /**
     * @attribute {Boolean} disabled whether this element's functions are active.
     * For elements that can contain other apf.NODE_VISIBLE elements this
     * attribute applies to all it's children.
     */
    "disabled": function(value){
        if (!this.$drawn) {
            var _self     = this;
            //this.disabled = false;

            apf.queue.add("disable" + this.$uniqueId, function(e){
                _self.disabled = value;
                apf.GuiElement.propHandlers.disabled.call(_self, value);
            });
            return;
        }
        else
            apf.queue.remove("disable" + this.$uniqueId);

        //For child containers we only disable its children
        if (this.canHaveChildren) {
            //@todo Fix focus here first.. else it will jump whilst looping
            if (value != -1)
                value = this.disabled = apf.isTrue(value);

            var nodes = this.childNodes;
            for (var node, i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];
                if (node.nodeFunc == apf.NODE_VISIBLE) {
                    if (value && node.disabled != -1)
                        node.$disabled = node.disabled || false;
                    node.setProperty("disabled", value ? -1 : false);
                }
            }

            //this.disabled = undefined;
            if (this.$isWindowContainer)
                return;
        }

        if (value == -1 || value == false) {
            //value = true;
        }
        else if (typeof this.$disabled == "boolean") {
            if (value === null) {
                value = this.$disabled;
                this.$disabled = null;
            }
            else {
                this.$disabled = value || false;
                return;
            }
        }

        if (apf.isTrue(value) || value == -1) {
            this.disabled = false;
            if (apf.document.activeElement == this) {
                apf.window.moveNext(true); //@todo should not include window
                if (apf.document.activeElement == this)
                    this.$blur();
            }

            if (this.hasFeature(apf.__PRESENTATION__))
                this.$setStyleClass(this.$ext, this.$baseCSSname + "Disabled");

            if (this.$disable)
                this.$disable();

            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-disabled");
            this.dispatchEvent("xforms-readonly");
            //#endif

            this.disabled = value;
        }
        else {
            if (this.hasFeature(apf.__DATABINDING__) && apf.config.autoDisable
              && !(!this.$bindings || this.xmlRoot))
                return false;

            this.disabled = false;

            if (apf.document.activeElement == this)
                this.$focus();

            if (this.hasFeature(apf.__PRESENTATION__))
                this.$setStyleClass(this.$ext, null, [this.$baseCSSname + "Disabled"]);

            if (this.$enable)
                this.$enable();

            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-enabled");
            this.dispatchEvent("xforms-readwrite");
            //#endif
        }
    },

    /**
     * @attribute {Boolean} enables whether this element's functions are active.
     * For elements that can contain other apf.NODE_VISIBLE elements this
     * attribute applies to all it's children.
     */
    "enabled" : function(value){
       this.setProperty("disabled", !value);
    },

    /**
     * @attribute {Boolean} disable-keyboard whether this element receives
     * keyboard input. This allows you to disable keyboard independently from
     * focus handling.
     */
    "disable-keyboard": function(value){
        this.disableKeyboard = apf.isTrue(value);
    },
    
    /**
     * @attribute {String}  tooltip  the text displayed when a user hovers with 
     * the mouse over the element.
     */
    "tooltip" : function(value){
        this.$ext.setAttribute("title", value + (this.hotkey ? " (" + this.hotkey + ")" : ""));
    },
    
    //#ifdef __AMLCONTEXTMENU
    /**
     * @attribute {String} contextmenu the name of the menu element that will
     * be shown when the user right clicks or uses the context menu keyboard
     * shortcut.
     * Example:
     * <code>
     *  <a:menu id="mnuExample">
     *      <a:item>test</a:item>
     *      <a:item>test2</a:item>
     *  </a:menu>
     *   
     *  <a:list 
     *    contextmenu = "mnuExample" 
     *    width       = "200" 
     *    height      = "150" />
     *  <a:bar 
     *    contextmenu = "mnuExample" 
     *    width       = "200" 
     *    height      = "150" />
     * </code>
     */
    "contextmenu": function(value){
        this.contextmenus = [value];
    },
    //#endif

    //#ifdef __WITH_DATABINDING
    /**
     * @attribute {String} actiontracker the name of the actiontracker that
     * is used for this element and it's children. If the actiontracker doesn't
     * exist yet it is created.
     * Example:
     * In this example the list uses a different actiontracker than the two
     * textboxes which determine their actiontracker based on the one that
     * is defined on the bar.
     * <code>
     *  <a:list actiontracker="newAT" />
     *
     *  <a:bar actiontracker="someAT">
     *      <a:textbox />
     *      <a:textbox />
     *  </a:bar>
     * </code>
     */
    "actiontracker": function(value){
        if (!value) {
            this.$at = null;
        }
        else if (value.localName == "actiontracker") {
            this.$at = value;
        }
        else {
            //#ifdef __WITH_NAMESERVER
            this.$at = typeof value == "string" && self[value]
              ? apf.nameserver.get("actiontracker", value) || self[value].getActionTracker()
              : apf.setReference(value,
                  apf.nameserver.register("actiontracker",
                      value, new apf.actiontracker()));

            if (!this.$at.name)
                this.$at.name = value;
            //#endif
        }
    },
    //#endif
    
    //Load subAML
    /**
     * @attribute {String} aml the {@link term.datainstruction data instruction} 
     * that loads new aml as children of this element.
     */
    "aml": function(value){
        this.replaceMarkup(value);
    }

    /**
     * @attribute {String} sets this aml element to be editable
     * that loads new aml as children of this element.
     */
    //#ifdef __WITH_CONTENTEDITABLE
    /*"editable": function(value){
        this.implement(apf.ContentEditable);
        this.$propHandlers["editable"].apply(this, arguments);
    },*/
    // #endif
   
    //#ifdef __WITH_ALIAS
    /**
     * @attribute {String} alias the alternative name for this element. The 
     * alias attribute can be set on another element. Only one element can have
     * the alias at one time. This way it's easy to use different elements in
     * the same function (for instance a thumbail and a datagrid) while keeping
     * all the binding rules and events on the active element.
     * @experimental
     */
    //@todo rewrite this completely...
    ,"alias" : function(value){
        if (!value) //@todo think about whether this has more meaning
            return;
        //#ifdef __WITH_NAMESERVER
        var cg = apf.nameserver.get("alias", value);
        if (!cg) {
            cg = apf.nameserver.register("alias", value, {
                name  : value,
                props : {},
                $handlePropSet : function(prop, value, forceOnMe){
                    if (prop == "alias") return;
                    
                    this.props[prop] = value;
                    this[prop] = value;
                    
                    if (!forceOnMe)
                        this.active.setProperty(prop, value);
                },
                
                $propchange : function(e){
                    cg.setProperty(e.name, e.value, null, true);
                },
                
                /* should go via property binding 
                data : [],
                connect : function(o, dataOnly, xpath, type, noselect){
                    this.data.push([o, dataOnly, xpath, type, noselect]);
                    
                    if (this.active)
                        this.active.connect(o, dataOnly, xpath, type, noselect);
                },
                
                disconnect : function(o, type){
                    for (var data, i = 0, l = this.data.length; i < l; i++) {
                        if (this.data[i][0] == o && this.data[i][3] == type)
                            this.data.removeIndex(i);
                    }
                    
                    if (this.active)
                        this.active.disconnect(o, type);
                },*/
                
                set : function(amlNode){
                    if (this.active == amlNode)
                        return;
                    
                    //Unset active one
                    if (this.active) {
                        //Unset event listeners
                        for (var name in events) {
                            var ev = events[name];
                            for (var i = 0; i < ev.length; i++) {
                                this.active.removeEventListener(name, ev[i]);
                            }
                        }
                        for (var name in events_capture) {
                            var ev = events_capture[name];
                            for (var i = 0; i < ev.length; i++) {
                                this.active.removeEventListener(name, ev[i], true);
                            }
                        }

                        //Unset property listener
                        this.active.removeEventListener("propertychange", this.$propchange);

                        //Unset data connections
                        for (var i = 0, l = this.data.length; i < l; i++)
                            this.active.disconnect(this.data[i][0], this.data[i][3]);

                        this.active.setProperty("alias", false);
                    }
                    
                    this.active = amlNode;
                    //Set event listeners
                    for (var name in events) {
                        var ev = events[name];
                        for (var i = 0; i < ev.length; i++) {
                            this.active.addEventListener(name, ev[i]);
                        }
                    }
                    for (var name in events_capture) {
                        var ev = events_capture[name];
                        for (var i = 0; i < ev.length; i++) {
                            this.active.addEventListener(name, ev[i], true);
                        }
                    }

                    //Set properties
                    for (var prop in this.props)
                        this.setProperty(prop, this.active[prop]);
                    
                    //Set property listener
                    this.active.addEventListener("propertychange", this.$propchange);
                    
                    //Set data connections
                    for (var i = 0, l = this.data.length; i < l; i++)
                        this.active.connect.apply(this.active, this.data[i]);
                    
                    amlNode.$alias = this;
                }
            });
            //apf.makeClass(cg);
            apf.setReference(value, cg);

            var events = {}, events_capture = {};
            cg.addEventListener = function(eventName, callback, useCapture){
                var ev = useCapture ? events_capture : events;
                (ev[eventName] || (ev[eventName] = [])).pushUnique(callback);
                this.active.addEventListener(eventName, callback, useCapture);
            };

            cg.removeEventListener = function(eventName, callback, useCapture){
                var ev = useCapture ? events_capture : events;
                (ev[eventName] || (ev[eventName] = [])).remove(callback);
                this.active.addEventListener(eventName, callback, useCapture);
            };

            cg.dispatchEvent = function(eventName, options){
                this.active.dispatchEvent(eventName, options);
            };
        }
        
        cg.set(this);
        //#endif
    }
    //#endif
};

// #endif