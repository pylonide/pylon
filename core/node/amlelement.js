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

var __AMLNODE__    = 1 << 15;
var __VALIDATION__ = 1 << 6;

// #ifdef __WITH_AMLNODE

/**
 * All elements inheriting from this {@link term.baseclass baseclass} are a aml component.
 *
 * @attribute {String} span     the number of columns this element spans. Only used inside a table element.
 * @attribute {String} margin   
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @event contextmenu Fires when the user requests a context menu. Either
 * using the keyboard or mouse.
 *   bubbles: yes
 *   cancellable:  Prevents the default contextmenu from appearing.
 *   object:
 *   {Number} x         the x coordinate where the contextmenu is requested on.
 *   {Number} y         the y coordinate where the contextmenu is requested on.
 *   {Event}  htmlEvent the html event object that triggered this event from being called.
 * @event focus       Fires when this element receives focus.
 * @event blur        Fires when this element loses focus.
 * @event keydown     Fires when this element has focus and the user presses a key on the keyboard.
 *   cancellable: Prevents the default key action.
 *   bubbles:
 *   object:
 *   {Boolean} ctrlKey   whether the ctrl key was pressed.
 *   {Boolean} shiftKey  whether the shift key was pressed.
 *   {Boolean} altKey    whether the alt key was pressed.
 *   {Number}  keyCode   which key was pressed. This is an ascii number.
 *   {Event}   htmlEvent the html event object that triggered this event from being called.
 */
apf.AmlElement = function(){
    //#ifdef __USE_TOSTRING
    /**
     * Returns a string representation of this element.
     *
     * @return  {String}  a representation of this element
     */
    this.toString = function(){
        return "[Element Node, <" + (this.prefix || "a") + ":" + this.tagName
            + " /> : " + (this.name || this.uniqueId || "") + "]";
    };
    //#endif

    this.$regbase = this.$regbase | __AMLNODE__;
    var _self     = this;

    /**** Convenience functions for gui nodes ****/

    if (this.nodeFunc == apf.NODE_VISIBLE) {

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
            this.setProperty("width", value);
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
            this.setProperty("height", value);
            return this;
        };

        /**
         * Sets the left position of this element. Depending on the choosen
         * layout method the unit can be pixels, a percentage or an expression.
         * Call-chaining is supported.
         * @param {Number} value the new left position of this element.
         */
        this.setLeft   = function(value){
            this.setProperty("left", value);
            return this;
        };

        /**
         * Sets the top position of this element. Depending on the choosen
         * layout method the unit can be pixels, a percentage or an expression.
         * Call-chaining is supported.
         * @param {Number} value the new top position of this element.
         */
        this.setTop    = function(value){
            this.setProperty("top", value);
            return this;
        };

        this.$noAlignUpdate = false;
        if (!this.show)
            /**
             * Makes the elements visible. Call-chaining is supported.
             */
            this.show = function(s){
                this.$noAlignUpdate = s;
                this.setProperty("visible", true);
                this.$noAlignUpdate = false;
                return this;
            };
        if (!this.hide)
            /**
             * Makes the elements invisible. Call-chaining is supported.
             */
            this.hide = function(s){
                this.$noAlignUpdate = s;
                this.setProperty("visible", false);
                this.$noAlignUpdate = false;
                return this;
            };

        /**
         * Retrieves the calculated width in pixels for this element
         */
        this.getWidth  = function(){
            return (this.oExt || {}).offsetWidth;
        };

        /**
         * Retrieves the calculated height in pixels for this element
         */
        this.getHeight = function(){
            return (this.oExt || {}).offsetHeight;
        };

        /**
         * Retrieves the calculated left position in pixels for this element
         * relative to the offsetParent.
         */
        this.getLeft   = function(){
            return (this.oExt || {}).offsetLeft;
        };

        /**
         * Retrieves the calculated top position in pixels for this element
         * relative to the offsetParent.
         */
        this.getTop    = function(){
            return (this.oExt || {}).offsetTop;
        };

        /**** Disabling ****/

        /**
         * Activates the functions of this element. Call-chaining is supported.
         */
        this.enable  = function(){
            this.setProperty("disabled", false);
            return this;
        };

        /**
         * Deactivates the functions of this element.
         * Call-chaining is supported.
         */
        this.disable = function(){
            this.setProperty("disabled", true);
            return this;
        };

        /**** z-Index ****/

        /**
         * Moves this element to the lowest z ordered level.
         * Call-chaining is supported.
         */
        this.sendToBack = function(){
            this.setProperty("zindex", 0);
            return this;
        };

        /**
         * Moves this element to the highest z ordered level.
         * Call-chaining is supported.
         */
        this.bringToFront  = function(){
            this.setProperty("zindex", apf.all.length + 1);
            return this;
        };

        /**
         * Moves this element one z order level deeper.
         * Call-chaining is supported.
         */
        this.sendBackwards = function(){
            this.setProperty("zindex", this.zindex - 1);
            return this;
        };

        /**
         * Moves this element one z order level higher.
         * Call-chaining is supported.
         */
        this.bringForward  = function(){
            this.setProperty("zindex", this.zindex + 1);
            return this;
        };

        //#endif

        /**** Focussing ****/

        //#ifdef __WITH_FOCUS
        if (this.$focussable) {
            /**
             * Sets the position in the list that determines the sequence
             * of elements when using the tab key to move between them.
             * Call-chaining is supported.
             * @param {Number} tabindex the position in the list
             */
            this.setTabIndex = function(tabindex){
                apf.window.$removeFocus(this);
                apf.window.$addFocus(this, tabindex);
                return this;
            };

            /**
             * Gives this element the focus. This means that keyboard events
             * are send to this element.
             */
            this.focus = function(noset, e, nofix){
                if (!noset) {
                    if (this.isWindowContainer) {
                        apf.window.$focusLast(this, e, true);
                    }
                    else {
                        apf.window.$focus(this, e);

                        //#ifdef __WITH_WINDOW_FOCUS
                        if (!nofix && apf.hasFocusBug)
                            apf.window.$focusfix();
                        //#endif
                    }

                    return this;
                }

                if (this.$focus)
                    this.$focus(e);

                this.dispatchEvent("focus", apf.extend({
                    srcElement : this,
                    bubbles    : true
                }, e));
                return this;
            };

            /**
             * Removes the focus from this element.
             * Call-chaining is supported.
             */
            this.blur = function(noset, e){
                //#ifdef __WITH_POPUP
                if (apf.popup.isShowing(this.uniqueId))
                    apf.popup.forceHide(); //This should be put in a more general position
                //#endif
                
                if (this.$blur)
                    this.$blur(e);

                if (!noset)
                    apf.window.$blur(this);

                this.dispatchEvent("blur", apf.extend({
                    srcElement : this,
                    bubbles    : !e || !e.cancelBubble
                }, e));
                return this;
            };

            /**
             * Determines whether this element has the focus
             * @returns {Boolean} indicating whether this element has the focus
             */
            this.hasFocus = function(){
                return apf.window.focussed == this || this.isWindowContainer
                    && (apf.window.focussed || {}).$focusParent == this;
            };
        }
        /* #else
        this.hasFocus = function(){}
        #endif */
    }

    /**** Load AML ****/

    // #ifdef __WITH_AMLDOM
    if (!this.hasFeature(__WITH_AMLDOM__))
        this.implement(apf.AmlDom); /** @inherits apf.AmlDom */
    // #endif

    /**
     * @private
     */
    this.$events = {};
    this.loadAml = function(x, pAmlNode, ignoreBindclass, id){
        this.name = x.getAttribute("id");
        if (this.name)
            apf.setReference(this.name, this);

        if (!x)
            x = this.$aml;

        // #ifdef __WITH_AMLDOM
        if (this.parentNode || pAmlNode)
            this.$setParent(this.parentNode || pAmlNode);
        // #endif

        this.$aml = x;

        //Drawing, Skinning, Positioning and Editing
        if (this.nodeFunc != apf.NODE_HIDDEN) {
            /* #ifdef __WITH_EDITMODE
            this.implement(apf.EditMode); // @inherits apf.EditMode
            if(apf.getInheritedAttribute(x, "editmode") == "true")
                this.enableEditing();
            #endif */

            if (this.$loadSkin)
                this.$loadSkin();

            if (this.$draw)
                this.$draw();

            if (id)
                this.oExt.setAttribute("id", id);

            var pTagName = x.parentNode && x.parentNode[apf.TAGNAME] || "";
            //#ifdef __JTABLE
            if (pTagName == "table") {
                //#ifdef __WITH_ANCHORING
                this.implement(apf.Anchoring);
                //#endif

                this.$propHandlers["width"]  =
                this.$propHandlers["height"] =
                this.$propHandlers["span"]   = this.parentNode.$updateTrigger;
            }
            else
            //#endif

            //#ifdef __WITH_ALIGNMENT
            if (x.getAttribute("align")
              || x.parentNode && x.parentNode.nodeType == 1
              && "vbox|hbox".indexOf(pTagName) > -1) { //@todo temp
                this.implement(apf.Alignment); /** @inherits apf.Alignment */
                //@todo temporarily disabled, hopefully it doesnt cause drawing problems
                //this.oExt.style.display = "none";
                this.enableAlignment();
            }
            else
            //#endif

            //#ifdef __WITH_ANCHORING
            if (this.$positioning != "basic") {
                this.implement(apf.Anchoring); /** @inherits apf.Anchoring */
                this.enableAnchoring();
            }
            /* #else
            {
                this.$supportedProperties.push("width", "left", "top", "height");
            }
            #endif*/

            if (this.visible === undefined && !x.getAttribute("visible"))
                this.visible = true;

            this.$drawn = true;
        }
        else if (this.$draw)
            this.$draw();

        // #ifdef __DEBUG
        if (this.nodeFunc == apf.NODE_VISIBLE) {
            if (apf.debug && this.oExt && this.oExt.nodeType)
                this.oExt.setAttribute("uniqueId", this.uniqueId);
        }
        // #endif

        if (!ignoreBindclass) { //Is this still needed?
            if (!this.hasFeature(__DATABINDING__) && x.getAttribute("smartbinding")) {
                this.implement(apf.DataBinding);
                this.$xmlUpdate = this.$load = function(){};
            }
        }

        /**** Properties and Attributes ****/

        // #ifdef __WITH_OFFLINE_STATE
        var offlineLookup;
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled)
            offlineLookup = apf.offline.state.getAll(this);
        // #endif

        //Parse all attributes
        this.$noAlignUpdate = true;
        var value, name, type, l, a, i, attr = x.attributes;
        for (i = 0, l = attr.length; i < l; i++) {
            a     = attr[i];
            value = a.nodeValue;
            name  = a.nodeName;

            //#ifdef __WITH_LANG_SUPPORT
            if (/^\$(.*)\$$/.test(value)) {
                this.$isMultiLang[name] = [RegExp.$1, apf.language.addElement(RegExp.$1, {
                    amlNode: this,
                    prop : name
                })];
            }else
            //#endif
            //#ifdef __WITH_PROPERTY_BINDING
            if (value && apf.dynPropMatch.test(value)) {
                apf.AmlParser.stateStack.push({
                    node  : this,
                    name  : name,
                    value : value
                });
            } else
            //#endif
            {
                //#ifdef __WITH_PROPERTY_BINDING
                if (name == "disabled") {
                    apf.AmlParser.stateStack.push({
                        node  : this,
                        name  : name,
                        value : value
                    });
                }
                //#endif

                if (a.nodeName.indexOf("on") === 0) {
                    this.addEventListener(name, (this.$events[name] = new Function('event', value)));
                    continue;
                }

                //#ifdef __WITH_OFFLINE_STATE
                if (offlineLookup) {
                    value = offlineLookup[name] || value
                        || this.defaults && this.defaults[name];
                    delete offlineLookup[name];
                }
                /* #else
                if (!value)
                    value = this.defaults && this.defaults[name] || value;
                #endif */

                if (this.$booleanProperties[name])
                    value = apf.isTrue(value);

                this[name] = value;
                (this.$propHandlers && this.$propHandlers[name]
                  || apf.AmlElement.propHandlers[name] || apf.K).call(this, value, name)
            }
        }

        //#ifdef __WITH_OFFLINE_STATE
        for (name in offlineLookup) {
            value = offlineLookup[name];
            (this.$propHandlers && this.$propHandlers[name]
                  || apf.AmlElement.propHandlers[name] || apf.K).call(this, value, name);
        }
        //#endif
        
        //#ifdef __WITH_APP_DEFAULTS
        //Get defaults from the defaults tag in appsettings
        if (apf.appsettings.defaults[this.tagName]) {
            var d = apf.appsettings.defaults[this.tagName];
            for (i = 0, l = d.length; i < l; i++) {
                name = d[i][0], value = d[i][1];
                if (this[name] === undefined) {
                    if (this.$booleanProperties[name])
                        value = apf.isTrue(value);

                    this[name] = value;
                    (this.$propHandlers && this.$propHandlers[name]
                      || apf.AmlElement.propHandlers[name] || apf.K)
                        .call(this, value, name);
                }
            }
        }
        //#endif

        this.$noAlignUpdate = false;

        //#ifdef __WITH_FOCUS
        if (this.$focussable && this.focussable === undefined)
            apf.AmlElement.propHandlers.focussable.call(this);
        //#endif

        // isSelfLoading is set when AML is being inserted
        if (this.$loadAml && !this.$isSelfLoading)
            this.$loadAml(x);

        //Process AML Handlers
        for (i = this.$amlLoaders.length - 1; i >= 0; i--)
            this.$amlLoaders[i].call(this, x);

        this.$amlLoaded = true;

        return this;
    };

    this.$handlePropSet = function(prop, value, force){
        //#ifdef __WITH_PROPERTY_BINDING
        if (!force && !this.hasFeature(__MULTISELECT__) && this.xmlRoot && this.bindingRules
          && this.bindingRules[prop] && !this.ruleTraverse) {
            return apf.setNodeValue(this.getNodeFromRule(
                prop.toLowerCase(), this.xmlRoot, null, null, true),
                value, !this.$onlySetXml);
        }
        //#endif
        /*#ifndef __WITH_PROPERTY_BINDING
        if(!force && prop == "value" && this.xmlRoot
          && this.bindingRules[this.mainBind] && !this.ruleTraverse)
            return apf.setNodeValue(this.getNodeFromRule(this.mainBind,
                this.xmlRoot, null, null, true), value, !this.$onlySetXml);
        #endif */

        if (this.$booleanProperties[prop])
            value = apf.isTrue(value);

        this[prop] = value;

        if(this.$onlySetXml)
            return;

        return (this.$propHandlers && this.$propHandlers[prop]
            || apf.AmlElement.propHandlers[prop]
            || apf.K).call(this, value, force, prop);
    };

    /**
     * Replaces the child aml elements with new aml.
     * @param {mixed}       amlDefNode  the aml to be loaded. This can be a string or a parsed piece of xml.
     * @param {HTMLElement} oInt        the html parent of the created aml elements.
     * @param {AMLElement}  oIntAML     the aml parent of the created aml elements.
     */
    this.replaceMarkup = function(amlDefNode, options) {
        //#ifdef __DEBUG
        apf.console.info("Remove all children from element");
        //#endif

        if (!options) options = {};

        if (!options.oIntAML)
            options.oIntAML = this.$aml;
        if (!options.oInt)
            options.oInt = this.oInt;
        options.clear = true;
        
        //Remove All the childNodes
        for (var i = this.childNodes.length - 1; i >= 0; i--) {
            var oItem = this.childNodes[i];
            /*var nodes = oItem.childNodes;
            for (var k = 0; k < nodes.length; k++)
                if (nodes[k].destroy)
                    nodes[k].destroy(true);

            if (oItem.$aml && oItem.$aml.parentNode)
                oItem.$aml.parentNode.removeChild(oItem.$aml);*/

            if (oItem.destroy)
                oItem.destroy(true);

            if (oItem.oExt != this.oInt)
                apf.destroyHtmlNode(oItem.oExt);
        }
        
        var nodes = options.oIntAML.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--)
            options.oIntAML.removeChild(nodes[i]);
        
        this.childNodes.length = 0;
        this.oInt.innerHTML = "<div class='loading'>loading...</div>";

        //Do an insertMarkup
        this.insertMarkup(amlDefNode, options);
    };

    /**
     * Inserts new aml into this element.
     * @param {mixed}       amlDefNode  the aml to be loaded. This can be a string or a parsed piece of xml.
     * @param {HTMLElement} oInt        the html parent of the created aml elements.
     * @param {AMLElement}  oIntAML     the aml parent of the created aml elements.
     */
    this.insertMarkup = function(amlDefNode, options){
        //#ifdef __DEBUG
        apf.console.info("Loading sub markup from external source");
        //#endif

        //#ifdef __WITH_OFFLINE
        if (typeof apf.offline != "undefined" && !apf.offline.onLine)
            return false; //it's the responsibility of the dev to check this
        //#endif

        var callback = function(data, state, extra){
            if (state != apf.SUCCESS) {
                var oError;

                oError = new Error(apf.formatErrorString(1019, _self,
                    "Loading extra aml from datasource",
                    "Could not load AML from remote resource \n\n"
                    + extra.message));

                if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                    return true;

                throw oError;
            }

            //#ifdef __DEBUG
            apf.console.info("Runtime inserting aml");
            //#endif

            if (options.clear)
                options.oInt.innerHTML = "";

            var aml = options.oIntAml || _self.$aml;
            if (aml.insertAdjacentHTML)
                aml.insertAdjacentHTML(aml.getAttribute("insert") || "beforeend",
                    (typeof data != "string" && data.length) ? data[0] : data);
            else {
                if (typeof data == "string")
                    data = apf.getAmlDocFromString(data.indexOf("<a:application") > -1
                      ? data 
                      : "<a:application xmlns:a='" + apf.ns.aml +"'>" 
                          + data + "</a:application>", true).documentElement;

                if (aml.ownerDocument.importNode) {
                    var doc = aml.ownerDocument;
                    for (var i = data.childNodes.length - 1; i >= 0; i--)
                        aml.insertBefore(doc.importNode(data.childNodes[i], true), aml.firstChild);
                }
                else
                    for (var i = data.childNodes.length - 1; i >= 0; i--)
                        aml.insertBefore(data.childNodes[i], aml.firstChild);
            }

            apf.AmlParser.parseMoreAml(aml, options.oInt || _self.oInt, _self,
                (options.isHidden && (options.oInt || _self.oInt).style.offsetHeight)
                ? true : false);
            
            if (options.callback)
                options.callback({
                    data    : data,
                    amlNode : this
                })
        }

        if (typeof amlDefNode == "string") {
            //Process Instruction
            if (apf.datainstr[amlDefNode.split(":")[0]]){
                return apf.getData(amlDefNode, null, {
                    ignoreOffline : true
                }, callback);
            }
            //Aml string
            else
                amlDefNode = apf.getAmlDocFromString(amlDefNode);
        }

        //Xml Node is assumed
        return callback(amlDefNode, apf.SUCCESS);
    };

    if (
      //#ifdef __WITH_DATABINDING
      this.hasFeature(__DATABINDING__) &&
      //#endif
      !this.hasFeature(__MULTISELECT__) && !this.change) {

        /**
         * Changes the value of this element.
         * @action
         * @param  {String} [string] the new value of this element.
         */
        this.change = function(value){
            // #ifdef __WITH_VALIDATION
            if (this.errBox && this.errBox.visible && this.isValid())
                this.clearError();
            // #endif

            // #ifdef __WITH_DATABINDING
            //Not databound
            if ((!this.createModel || !this.$aml || !this.$aml.getAttribute("ref")) && !this.xmlRoot) {
            // #endif
                if (value === this.value 
                  || this.dispatchEvent("beforechange", {value : value}) === false)
                    return false;

                this.setProperty("value", value);
                return this.dispatchEvent("afterchange", {value : value});
            // #ifdef __WITH_DATABINDING
            }
            
            if (this.value === value)
                return false;

            this.executeActionByRuleSet("change", this.mainBind, this.xmlRoot, value);
            // #endif
        };
    }

    //#ifdef __WITH_CONTEXTMENU
    if (this.hasFeature(__DATABINDING__)) {
        this.addEventListener("contextmenu", function(e){
            if (!this.contextmenus) return;

            var contextmenu;
            var xmlNode = this.hasFeature(__MULTISELECT__)
                ? this.selected
                : this.xmlRoot;

            var i, isRef, sel, menuId;
            for (var i = 0; i < this.contextmenus.length; i++) {
                isRef = (typeof this.contextmenus[i] == "string");
                if (!isRef)
                    sel = "self::" + String(this.contextmenus[i].getAttribute("select"))
                        .split("|").join("self::");

                if (isRef || xmlNode && xmlNode.selectSingleNode(sel || ".")
                  || !xmlNode && !sel) {
                    menuId = isRef
                        ? this.contextmenus[i]
                        : this.contextmenus[i].getAttribute("menu")

                    // #ifdef __DEBUG
                    if (!self[menuId]) {
                        throw new Error(apf.formatErrorString(0, this,
                            "Showing contextmenu",
                            "Could not find contextmenu by name: '" + menuId + "'"),
                            this.$aml);
                    }
                    // #endif

                    self[menuId].display(e.x, e.y, null, this, xmlNode);

                    e.returnValue = false;//htmlEvent.
                    e.cancelBubble = true;
                    break;
                }
            }

            //IE6 compatiblity
            /*
            @todo please test that disabling this is OK
            if (!apf.appsettings.disableRightClick) {
                document.oncontextmenu = function(){
                    document.oncontextmenu = null;
                    e.cancelBubble = true;
                    return false;
                }
            }*/
        });
    }
    else {
        this.addEventListener("contextmenu", function(e){
            if (!this.contextmenus)
                return;

            var menuId = typeof this.contextmenus[0] == "string"
                ? this.contextmenus[0]
                : this.contextmenus[0].getAttribute("menu")

            // #ifdef __DEBUG
            if (!self[menuId]) {
                throw new Error(apf.formatErrorString(0, this,
                    "Showing contextmenu",
                    "Could not find contextmenu by name: '" + menuId + "'",
                    this.$aml));
            }
            // #endif

            self[menuId].display(e.x, e.y, null, this);

            e.returnValue = false;//htmlEvent.
            e.cancelBubble = true;
        });
    }
    //#endif
};

/**
 * @for apf.amlNode
 * @private
 */
apf.AmlElement.propHandlers = {
    /**
     * @attribute {String} id the identifier of this element. When set this
     * identifier is the name of the variable in javascript to access this
     * element directly. This identifier is also the way to get a reference to
     * this element using apf.document.getElementById.
     * Example:
     * <code>
     *  <a:bar id="barExample" />
     *  <a:script>
     *      alert(barExample);
     *  </a:script>
     * </code>
     */
    "id": function(value){
        if (this.name == value)
            return;

        if (self[this.name] == this)
            self[this.name] = null;

        apf.setReference(value, this);
        this.name = value;
    },

    //#ifdef __WITH_FOCUS
    /**
     * @attribute {Boolean} focussable whether this element can receive the focus.
     * The focussed element receives keyboard event.s
     */
    "focussable": function(value){
        if (typeof value == "undefined")
            this.focussable = true;

        if (this.focussable) {
            apf.window.$addFocus(this, this.tabindex
                || this.$aml.getAttribute("tabindex"));
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
        this.oExt.style.zIndex = value;
    },

    /**
     * @attribute {Boolean} visible whether this element is shown.
     */
    "visible": function(value){
        if (this.tagName == "modalwindow") 
            return; // temp fix

        if (apf.isFalse(value) || typeof value == "undefined") {
            this.oExt.style.display = "none";
            
            if (this.$hide && !this.$noAlignUpdate)
                this.$hide();

            if (apf.window.focussed == this || this.canHaveChildren
              && apf.isChildOf(this, apf.window.focussed, false)) {
                if (apf.appsettings.allowBlur)
                    this.blur();
                else
                    apf.window.moveNext();
            }
        }
        else if (apf.isTrue(value)) {
            // #ifdef __WITH_DELAYEDRENDER
            if (this.hasFeature(__DELAYEDRENDER__))
                this.$render();
            // #endif
            
            this.oExt.style.display = "block"; //Some form of inheritance detection

            if (this.$show && !this.$noAlignUpdate)
                this.$show();
            
            if (apf.layout && this.oInt) //apf.hasSingleRszEvent)
                apf.layout.forceResize(this.oInt);//this.oInt
        }
    },

    /**
     * @attribute {Boolean} disabled whether this element's functions are active.
     * For elements that can contain other apf.NODE_VISIBLE elements this
     * attribute applies to all it's children.
     */
    "disabled": function(value){
        //For child containers we only disable its children
        if (this.canHaveChildren) {
            //@todo Fix focus here first.. else it will jump whilst looping
            value = this.disabled = apf.isTrue(value);

            function loopChildren(nodes){
                for (var node, i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];
                    if (node.nodeFunc == apf.NODE_VISIBLE) {
                        if (value && node.disabled != -1)
                            node.$disabled = node.disabled || false;
                        node.setProperty("disabled", value ? -1 : null);
                    }

                    if (node.childNodes.length)
                        loopChildren(node.childNodes);
                }
            }
            loopChildren(this.childNodes);

            //this.disabled = undefined;
            if (this.isWindowContainer)
                return;
        }

        if (value == -1) {
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
            if (apf.window.focussed == this) {
                apf.window.moveNext(true); //@todo should not include window
                if (apf.window.focussed == this)
                    this.$blur();
            }

            if (this.hasFeature(__PRESENTATION__))
                this.$setStyleClass(this.oExt, this.baseCSSname + "Disabled");

            if (this.$disable)
                this.$disable();

            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-disabled");
            this.dispatchEvent("xforms-readonly");
            //#endif

            this.disabled = value;
        }
        else {
            if (this.hasFeature(__DATABINDING__) && apf.appsettings.autoDisable
              & !this.isBoundComplete())
                return false;

            this.disabled = false;

            if (apf.window.focussed == this)
                this.$focus();

            if (this.hasFeature(__PRESENTATION__))
                this.$setStyleClass(this.oExt, null, [this.baseCSSname + "Disabled"]);

            if (this.$enable)
                this.$enable();

            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-enabled");
            this.dispatchEvent("xforms-readwrite");
            //#endif
        }
    },

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
     * @attribute {mixed} left the left position of this element. Depending
     * on the choosen layout method the unit can be pixels, a percentage or an
     * expression.
     */
    "left": function(value){
        if ("absolute|relative|fixed".indexOf(apf.getStyle(this.oExt, "position")) == -1)
            this.oExt.style.position = "absolute";
        this.oExt.style.left = value + "px";
    },

    /**
     * @attribute {mixed} top the top position of this element. Depending
     * on the choosen layout method the unit can be pixels, a percentage or an
     * expression.
     */
    "top": function(value){
        if ("absolute|relative|fixed".indexOf(apf.getStyle(this.oExt, "position")) == -1)
            this.oExt.style.position = "absolute";
        this.oExt.style.top = value + "px";
    },

    /**
     * @attribute {mixed} right the right position of this element. Depending
     * on the choosen layout method the unit can be pixels, a percentage or an
     * expression.
     */
    "right": function(value){
        if ("absolute|relative|fixed".indexOf(apf.getStyle(this.oExt, "position")) == -1)
            this.oExt.style.position = "absolute";
        this.oExt.style.right = value + "px";
    },

    /**
     * @attribute {mixed} bottom the bottom position of this element. Depending
     * on the choosen layout method the unit can be pixels, a percentage or an
     * expression.
     */
    "bottom": function(value){
        if ("absolute|relative|fixed".indexOf(apf.getStyle(this.oExt, "position")) == -1)
            this.oExt.style.position = "absolute";
        this.oExt.style.bottom = value + "px";
    },

    /**
     * @attribute {mixed} width the different between the left edge and the
     * right edge of this element. Depending on the choosen layout method the
     * unit can be pixels, a percentage or an expression.
     * Remarks:
     * When used as a child of a grid element the width can also be set as '*'. 
     * This will fill the rest space.
     */
    "width": function(value){
        this.oExt.style.width = Math.max(0, value
            - apf.getWidthDiff(this.oExt)) + "px";
    },

    /**
     * @attribute {mixed} height the different between the top edge and the
     * bottom edge of this element. Depending on the choosen layout method the
     * unit can be pixels, a percentage or an expression.
     * Remarks:
     * When used as a child of a grid element the height can also be set as '*'. 
     * This will fill the rest space.
     */
    "height": function(value){
        this.oExt.style.height = Math.max(0,
            value - apf.getHeightDiff(this.oExt)) + "px";
    },

    //#ifdef __WITH_ALIGNMENT
    "align": function(value){
        //#ifdef __WITH_ANCHORING
        if (this.disableAnchoring)
            this.disableAnchoring();
        //#endif

        if (!this.hasFeature(__ALIGNMENT__)) {
            this.implement(apf.Alignment);
            this.oExt.style.display = "none";
            this.enableAlignment();
        }
    },
    //#endif

    /**
     * @attribute {String} contextmenu the name of the menu element that will
     * be shown when the user right clicks or uses the context menu keyboard
     * shortcut.
     * Example:
     * <code>
     *  <a:menu id="mnuExample" />
     *
     *  <a:list contextmenu="mnuExample" />
     *  <a:bar contextmenu="mnuExample" />
     * </code>
     */
    "contextmenu": function(value){
        this.contextmenus = [value];
    },

    //#ifdef __WITH_INTERACTIVE
    "resizable": function(value){
        this.implement(apf.Interactive);
        this.$propHandlers["resizable"].apply(this, arguments);
    },

    "draggable": function(value){
        this.implement(apf.Interactive);
        this.$propHandlers["draggable"].apply(this, arguments);
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
        if (!value)
            this.$at = null;
        else if (value.tagName == "actiontracker")
            this.$at = value;
        else {
            this.$at = typeof value == "string" && self[value]
              ? apf.AmlParser.getActionTracker(value)
              : apf.setReference(value,
                  apf.nameserver.register("actiontracker",
                      value, new apf.actiontracker()));
            if (!this.$at.name)
                this.$at.name = value;
        }
    },
    //#endif
    
    // #ifdef __WITH_DELAYEDRENDER
    "render": function(value) {
        if (!this.hasFeature(__DELAYEDRENDER__)) {
            this.implement(apf.DelayedRender);
        
            this.visible = false;
            this.oExt.style.display = "none";
        }
    },
    //#endif
    
    //#ifdef __WITH_TRANSACTION
    /**
     * @attribute {Boolean} transaction Whether this element provides transaction
     * support for all it's children.
     * @see baseclass.transaction
     */
    "transaction" : function(value){
        if (!value)
            return;
        
        /**
         * @inherits apf.DataBinding
         * @inherits apf.Transaction
         */
        if (!this.hasFeature(__DATABINDING__)) {
            this.implement(apf.DataBinding);

            if (this.actions)
                this.$propHandlers["actions"].call(this, this.actions);
            else if (!this.$aml.getAttribute("actions"))
                this.smartBinding = true;
        }
         
        if (!this.hasFeature(__TRANSACTION__))
            this.implement(apf.Transaction);
    },
    //#endif

    //Load subAML
    /**
     * @attribute {String} aml the {@link term.datainstruction data instruction} 
     * that loads new aml as children of this element.
     */
    "aml": function(value){
        //Clear??
        this.insertMarkup(value);
        this.$isSelfLoading = true;
    },

    //#ifdef __WITH_CONTENTEDITABLE
    "contenteditable": function(value) {
        this.implement(apf.ContentEditable);
        if (!this.hasFeature(__VALIDATION__))
            this.implement(apf.Validation);
        this.$propHandlers["contenteditable"].apply(this, arguments);
    }
    //#endif
   
    //#ifdef __WITH_ALIAS
    /**
     * @attribute {String} alias the alternative name for this element. The 
     * alias attribute can be set on another element. Only one element can have
     * the alias at one time. This way it's easy to use different elements in
     * the same function (for instance a thumbail and a datagrid) while keeping
     * all the binding rules and events on the active element.
     * @experimental
     */
    ,"alias" : function(value){
        if (!value) //@todo think about whether this has more meaning
            return;

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
                },
                
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
            apf.makeClass(cg);
            apf.setReference(value, cg);

            var events = {}, events_capture = {};
            cg.addEventListener = function(eventName, callback, useCapture){
                var ev = useCapture ? events_capture : events;
                (ev[eventName] || (ev[eventName] = [])).pushUnique(callback);
                this.active.addEventListener(eventName, callback, useCapture);
            }
            cg.removeEventListener = function(eventName, callback, useCapture){
                var ev = useCapture ? events_capture : events;
                (ev[eventName] || (ev[eventName] = [])).remove(callback);
                this.active.addEventListener(eventName, callback, useCapture);
            }
            cg.dispatchEvent = function(eventName, options){
                this.active.dispatchEvent(eventName, options);
            }
        }
        
        cg.set(this);
    }
    //#endif
};

// #endif