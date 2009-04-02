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

var __JMLNODE__    = 1 << 15;
var __VALIDATION__ = 1 << 6;

// #ifdef __WITH_JMLNODE

/**
 * Baseclass for jml elements.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.JmlElement = function(){
    //#ifdef __USE_TOSTRING
    /**
     * Returns a string representation of this element.
     *
     * @return  {String}  a representation of this element
     */
    this.toString = function(){
        return "[Element Node, <" + (this.prefix || "j") + ":" + this.tagName
            + " /> : " + (this.name || this.uniqueId || "") + "]";
    };
    //#endif

    this.$regbase = this.$regbase | __JMLNODE__;
    var _self     = this;

    /**** Convenience functions for gui nodes ****/

    if (this.nodeFunc == jpf.NODE_VISIBLE) {

        //#ifdef __WITH_CONVENIENCE_API

        /**** Geometry ****/

        /**
         * Sets the different between the left edge and the right edge of this
         * element. Depending on the choosen layout method the unit can be
         * pixels, a percentage or an expression.
         * @param {Number} value the new width of this element.
         */
        this.setWidth = function(value){
            this.setProperty("width", value);
        };

        /**
         * Sets the different between the top edge and the bottom edge of this
         * element. Depending on the choosen layout method the unit can be
         * pixels, a percentage or an expression.
         * @param {Number} value the new height of this element.
         */
        this.setHeight = function(value){
            this.setProperty("height", value);
        };

        /**
         * Sets the left position of this element. Depending on the choosen
         * layout method the unit can be pixels, a percentage or an expression.
         * @param {Number} value the new left position of this element.
         */
        this.setLeft   = function(value){
            this.setProperty("left", value);
        };

        /**
         * Sets the top position of this element. Depending on the choosen
         * layout method the unit can be pixels, a percentage or an expression.
         * @param {Number} value the new top position of this element.
         */
        this.setTop    = function(value){
            this.setProperty("top", value);
        };

        this.$noAlignUpdate = false;
        if (!this.show)
            /**
             * Makes the elements visible
             */
            this.show = function(s){
                this.$noAlignUpdate = s;
                this.setProperty("visible", true);
                this.$noAlignUpdate = false;
            };
        if (!this.hide)
            /**
             * Makes the elements invisible
             */
            this.hide = function(s){
                this.$noAlignUpdate = s;
                this.setProperty("visible", false);
                this.$noAlignUpdate = false;
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
         * Activates the functions of this element.
         */
        this.enable  = function(){
            this.setProperty("disabled", false);
        };

        /**
         * Deactivates the functions of this element.
         */
        this.disable = function(){
            this.setProperty("disabled", true);
        };

        /**** z-Index ****/

        /**
         * Moves this element to the lowest z ordered level.
         */
        this.sendToBack = function(){
            this.setProperty("zindex", 0);
        };

        /**
         * Moves this element to the highest z ordered level.
         */
        this.bringToFront  = function(){
            this.setProperty("zindex", jpf.all.length + 1);
        };

        /**
         * Moves this element one z order level deeper.
         */
        this.sendBackwards = function(){
            this.setProperty("zindex", this.zindex - 1);
        };

        /**
         * Moves this element one z order level higher.
         */
        this.bringForward  = function(){
            this.setProperty("zindex", this.zindex + 1);
        };

        //#endif

        /**** Focussing ****/

        //#ifdef __WITH_FOCUS
        if (this.$focussable) {
            /**
             * Sets the position in the list that determines the sequence
             * of elements when using the tab key to move between them.
             * @param {Number} tabindex the position in the list
             */
            this.setTabIndex = function(tabindex){
                jpf.window.$removeFocus(this);
                jpf.window.$addFocus(this, tabindex);
            };

            /**
             * Gives this element the focus. This means that keyboard events
             * are send to this element.
             */
            this.focus = function(noset, e, nofix){
                if (!noset) {
                    if (this.isWindowContainer) {
                        jpf.window.$focusLast(this, e, true);
                    }
                    else {
                        jpf.window.$focus(this, e);

                        //#ifdef __WITH_WINDOW_FOCUS
                        if (!nofix && jpf.hasFocusBug)
                            jpf.window.$focusfix();
                        //#endif
                    }

                    return;
                }

                if (this.$focus)
                    this.$focus(e);

                this.dispatchEvent("focus", {
                    srcElement : this,
                    bubbles    : true
                });
            };

            /**
             * Removes the focus from this element.
             */
            this.blur = function(noset, e){
                //#ifdef __WITH_POPUP
                if (jpf.popup.isShowing(this.uniqueId))
                    jpf.popup.forceHide(); //This should be put in a more general position
                //#endif
                
                if (this.$blur)
                    this.$blur(e);

                if (!noset)
                    jpf.window.$blur(this);

                this.dispatchEvent("blur", {
                    srcElement : this,
                    bubbles    : !e || !e.cancelBubble
                });
            };

            /**
             * Determines whether this element has the focus
             * @returns {Boolean} indicating whether this element has the focus
             */
            this.hasFocus = function(){
                return jpf.window.focussed == this || this.isWindowContainer
                    && (jpf.window.focussed || {}).$focusParent == this;
            };
        }
        /* #else
        this.hasFocus = function(){}
        #endif */
    }

    /**** Load JML ****/

    // #ifdef __WITH_JMLDOM
    if (!this.hasFeature(__WITH_JMLDOM__))
        this.inherit(jpf.JmlDom); /** @inherits jpf.JmlDom */
    // #endif

    /**
     * @private
     */
    this.loadJml = function(x, pJmlNode, ignoreBindclass, id){
        this.name = x.getAttribute("id");
        if (this.name)
            jpf.setReference(this.name, this);

        if (!x)
            x = this.$jml;

        // #ifdef __WITH_JMLDOM
        if (this.parentNode || pJmlNode)
            this.$setParent(this.parentNode || pJmlNode);
        // #endif

        this.$jml = x;

        //Drawing, Skinning, Positioning and Editing
        if (this.nodeFunc != jpf.NODE_HIDDEN) {
            /* #ifdef __WITH_EDITMODE
            this.inherit(jpf.EditMode); // @inherits jpf.EditMode
            if(jpf.xmldb.getInheritedAttribute(x, "editmode") == "true")
                this.enableEditing();
            #endif */

            // #ifdef __WITH_LANG_SUPPORT && !__WITH_EDITMODE
            this.inherit(jpf.MultiLang); /** @inherits jpf.MultiLang */
            // #endif

            if (this.$loadSkin)
                this.$loadSkin();

            if (this.$draw)
                this.$draw();

            if (id)
                this.oExt.setAttribute("id", id);

            var pTagName = x.parentNode && x.parentNode[jpf.TAGNAME] || "";
            //#ifdef __WITH_GRID
            if (pTagName == "grid") {
                //#ifdef __WITH_ANCHORING
                this.inherit(jpf.Anchoring);
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
                this.inherit(jpf.Alignment); /** @inherits jpf.Alignment */
                this.oExt.style.display = "none";
                this.enableAlignment();
            }
            else
            //#endif

            //#ifdef __WITH_ANCHORING
            if (this.$positioning != "basic") {
                this.inherit(jpf.Anchoring); /** @inherits jpf.Anchoring */
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
        if (this.nodeFunc == jpf.NODE_VISIBLE) {
            if (jpf.debug && this.oExt.nodeType)
                this.oExt.setAttribute("uniqueId", this.uniqueId);
        }
        // #endif

        if (!ignoreBindclass) { //Is this still needed?
            if (!this.hasFeature(__DATABINDING__) && x.getAttribute("smartbinding")) {
                this.inherit(jpf.DataBinding);
                this.$xmlUpdate = this.$load = function(){};
            }
        }

        /**** Properties and Attributes ****/

        // #ifdef __WITH_OFFLINE_STATE
        var offlineLookup;
        if (typeof jpf.offline != "undefined" && jpf.offline.state.enabled)
            offlineLookup = jpf.offline.state.getAll(this);
        // #endif

        //Parse all attributes
        this.$noAlignUpdate = true;
        var value, name, type, l, a, i, attr = x.attributes;
        for (i = 0, l = attr.length; i < l; i++) {
            a     = attr[i];
            value = a.nodeValue;
            name  = a.nodeName;

            //#ifdef __WITH_PROPERTY_BINDING
            if (value && jpf.dynPropMatch.test(value)) {
                jpf.JmlParser.stateStack.push({
                    node  : this,
                    name  : name,
                    value : value
                });
            } else
            //#endif
            {
                //#ifdef __WITH_PROPERTY_BINDING
                if (name == "disabled") {
                    jpf.JmlParser.stateStack.push({
                        node  : this,
                        name  : name,
                        value : value
                    });
                }
                //#endif

                if (a.nodeName.indexOf("on") === 0) {
                    this.addEventListener(name, new Function('event', value));
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
                    value = jpf.isTrue(value);

                this[name] = value;
                (this.$propHandlers && this.$propHandlers[name]
                  || jpf.JmlElement.propHandlers[name] || jpf.K).call(this, value)
            }
        }

        //#ifdef __WITH_OFFLINE_STATE
        for (name in offlineLookup) {
            value = offlineLookup[name];
            (this.$propHandlers && this.$propHandlers[name]
                  || jpf.JmlElement.propHandlers[name] || jpf.K).call(this, value);
        }
        //#endif

        //#ifdef __WITH_APP_DEFAULTS
        //Get defaults from the defaults tag in appsettings
        if (jpf.appsettings.defaults[this.tagName]) {
            d = jpf.appsettings.defaults[this.tagName];
            for (i = 0, l = d.length; i < l; i++) {
                name = d[i][0], value = d[i][1];
                if (this[name] === undefined) {
                    if (this.$booleanProperties[name])
                        value = jpf.isTrue(value);

                    this[name] = value;
                    (this.$propHandlers && this.$propHandlers[name]
                      || jpf.JmlElement.propHandlers[name] || jpf.K)
                        .call(this, value, name);
                }
            }
        }
        //#endif

        this.$noAlignUpdate = false;

        //#ifdef __WITH_FOCUS
        if (this.$focussable && this.focussable === undefined)
            jpf.JmlElement.propHandlers.focussable.call(this);
        //#endif

        // isSelfLoading is set when JML is being inserted
        if (this.$loadJml && !this.$isSelfLoading)
            this.$loadJml(x);

        //Process JML Handlers
        for (i = this.$jmlLoaders.length - 1; i >= 0; i--)
            this.$jmlLoaders[i].call(this, x);

        this.$jmlLoaded = true;

        return this;
    };

    this.$handlePropSet = function(prop, value, force){
        //#ifdef __WITH_PROPERTY_BINDING
        if (!force && !this.hasFeature(__MULTISELECT__) && this.xmlRoot && this.bindingRules
          && this.bindingRules[prop] && !this.ruleTraverse) {
            return jpf.xmldb.setNodeValue(this.getNodeFromRule(
                prop.toLowerCase(), this.xmlRoot, null, null, true),
                value, !this.$onlySetXml);
        }
        //#endif
        /*#ifndef __WITH_PROPERTY_BINDING
        if(!force && prop == "value" && this.xmlRoot
          && this.bindingRules[this.mainBind] && !this.ruleTraverse)
            return jpf.xmldb.setNodeValue(this.getNodeFromRule(this.mainBind,
                this.xmlRoot, null, null, true), value, !this.$onlySetXml);
        #endif */

        if (this.$booleanProperties[prop])
            value = jpf.isTrue(value);

        this[prop] = value;

        if(this.$onlySetXml)
            return;

        return (this.$propHandlers && this.$propHandlers[prop]
            || jpf.JmlElement.propHandlers[prop]
            || jpf.K).call(this, value, force, prop);
    };

    /**
     * Replaces the child jml elements with new jml.
     * @param {mixed}       jmlDefNode  the jml to be loaded. This can be a string or a parsed piece of xml.
     * @param {HTMLElement} oInt        the html parent of the created jml elements.
     * @param {JMLElement}  oIntJML     the jml parent of the created jml elements.
     */
    this.replaceJml = function(jmlDefNode, oInt, oIntJML, isHidden){
        //#ifdef __DEBUG
        jpf.console.info("Remove all jml from element");
        //#endif

        //Remove All the childNodes
        for (var i = 0; i < this.childNodes.length; i++) {
            var oItem = this.childNodes[i];
            var nodes = oItem.childNodes;
            for (var k = 0; k < nodes.length; k++)
                if (nodes[k].destroy)
                    nodes[k].destroy();

            if (oItem.$jml && oItem.$jml.parentNode)
                oItem.$jml.parentNode.removeChild(oItem.$jml);

            oItem.destroy();

            if (oItem.oExt != this.oInt)
                jpf.removeNode(oItem.oExt);
        }
        this.childNodes.length = 0;
        this.oExt.innerHTML = "";

        //Do an insertJml
        this.insertJml(jmlDefNode, oInt, oIntJML, isHidden);
    };

    /**
     * Inserts new jml into this element.
     * @param {mixed}       jmlDefNode  the jml to be loaded. This can be a string or a parsed piece of xml.
     * @param {HTMLElement} oInt        the html parent of the created jml elements.
     * @param {JMLElement}  oIntJML     the jml parent of the created jml elements.
     */
    this.insertJml = function(jmlDefNode, oInt, oIntJml, isHidden){
        //#ifdef __DEBUG
        jpf.console.info("Loading sub jml from external source");
        //#endif

        //#ifdef __WITH_OFFLINE
        if (typeof jpf.offline != "undefined" && !jpf.offline.onLine)
            return false; //it's the responsibility of the dev to check this
        //#endif

        var callback = function(data, state, extra){
            if (state != jpf.SUCCESS) {
                var oError;

                //#ifdef __DEBUG
                oError = new Error(jpf.formatErrorString(1019, _self,
                    "Loading extra jml from datasource",
                    "Could not load JML from remote resource \n\n"
                    + extra.message));
                //#endif

                if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                    return true;

                throw oError;
            }
            
            //#ifdef __DEBUG
            jpf.console.info("Runtime inserting jml");
            //#endif

            var jml = oIntJml || _self.$jml;
            if (jml.insertAdjacentHTML)
                jml.insertAdjacentHTML(jml.getAttribute("insert") || "beforeend",
                    (typeof data != "string" && data.length) ? data[0] : data);
            else {
                if (typeof data == "string")
                    data = jpf.xmldb.getXml("<j:jml xmlns:j='"
                        + jpf.ns.jml +"'>" + data + "</j:jml>");
                for (var i = data.childNodes.length - 1; i >= 0; i--)
                    jml.insertBefore(data.childNodes[i], jml.firstChild);
            }

            jpf.JmlParser.parseMoreJml(jml, oInt || _self.oInt, _self,
                (isHidden && (oInt || _self.oInt).style.offsetHeight)
                ? true : false);
        }

        if (typeof jmlDefNode == "string") {
            //Process Instruction
            if (jpf.datainstr[jmlDefNode]){
                return jpf.getData(jmlDefNode, null, {
                    ignoreOffline : true
                }, callback);
            }
            //Jml string
            else
                jmlDefNode = jpf.xmldb.getXml(jmlDefNode);
        }

        //Xml Node is assumed
        return callback(jmlDefNode, jpf.SUCCESS);
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
            if ((!this.createModel || !this.$jml.getAttribute("ref")) && !this.xmlRoot) {
            // #endif
                if (value === this.value 
                  || this.dispatchEvent("beforechange", {value : value}) === false)
                    return;

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

    if (this.setValue && !this.clear) {
        /**
         * Clears the data loaded into this element resetting it's value.
         */
        this.clear = function(nomsg){
            if (this.$setClearMessage) {
                if (!nomsg)
                    this.$setClearMessage(this.emptyMsg, "empty");
                else if (this.$removeClearMessage)
                    this.$removeClearMessage();
            }

            //this.setValue("")
            this.value = -99999; //force resetting

            this.$propHandlers && this.$propHandlers["value"]
                ? this.$propHandlers["value"].call(this, "")
                : this.setValue("");
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
                        throw new Error(jpf.formatErrorString(0, this,
                            "Showing contextmenu",
                            "Could not find contextmenu by name: '" + menuId + "'"),
                            this.$jml);
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
            if (!jpf.appsettings.disableRightClick) {
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
                throw new Error(jpf.formatErrorString(0, this,
                    "Showing contextmenu",
                    "Could not find contextmenu by name: '" + menuId + "'",
                    this.$jml));
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
 * @for jpf.jmlNode
 * @private
 */
jpf.JmlElement.propHandlers = {
    /**
     * @attribute {String} id the identifier of this element. When set this
     * identifier is the name of the variable in javascript to access this
     * element directly. This identifier is also the way to get a reference to
     * this element using jpf.document.getElementById.
     * Example:
     * <pre class="code">
     *  <j:bar id="barExample" />
     *  <j:script>
     *      alert(barExample);
     *  </j:script>
     * </pre>
     */
    "id": function(value){
        if (this.name == value)
            return;

        if (self[this.name] == this)
            self[this.name] = null;

        jpf.setReference(value, this);
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
            jpf.window.$addFocus(this, this.tabindex
                || this.$jml.getAttribute("tabindex"));
        }
        else {
            jpf.window.$removeFocus(this);
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

        if (jpf.isFalse(value) || typeof value == "undefined") {
            this.oExt.style.display = "none";
            
            if (this.$hide && !this.$noAlignUpdate)
                this.$hide();

            if (jpf.window.focussed == this
              || this.canHaveChildren
              && jpf.xmldb.isChildOf(this, jpf.window.focussed, false)) {
                if (jpf.appsettings.allowBlur)
                    this.blur();
                else
                    jpf.window.moveNext();
            }
        }
        else if (jpf.isTrue(value)) {
            this.oExt.style.display = "block"; //Some form of inheritance detection

            if (this.$show && !this.$noAlignUpdate)
                this.$show();
            
            if (jpf.hasSingleRszEvent)
                jpf.layout.forceResize();//this.oInt
        }
    },

    /**
     * @attribute {Boolean} disabled whether this element's functions are active.
     * For elements that can contain other jpf.NODE_VISIBLE elements this
     * attribute applies to all it's children.
     */
    "disabled": function(value){
        //For child containers we only disable its children
        if (this.canHaveChildren) {
            //@todo Fix focus here first.. else it will jump whilst looping

            function loopChildren(nodes){
                for (var node, i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];
                    if (node.nodeFunc == jpf.NODE_VISIBLE) {
                        if (value)
                            node.$disabled = node.disabled;
                        node.setProperty("disabled", value ? -1 : null);
                    }

                    if (node.childNodes.length)
                        loopChildren(node.childNodes);
                }
            }
            loopChildren(this.childNodes);

            //this.disabled = undefined;
            return;
        }

        if (value == -1) {
            value = true;
        }
        else if (typeof this.$disabled == "boolean") {
            if (value === null) {
                value = this.$disabled;
                this.$disabled = null;
            }
            else {
                this.$disabled = value;
                return;
            }
        }

        if (jpf.isTrue(value)) {
            this.disabled = false;
            if (jpf.window.focussed == this) {
                jpf.window.moveNext(true); //@todo should not include window
                if (jpf.window.focussed == this)
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

            this.disabled = true;
        }
        else {
            if (this.hasFeature(__DATABINDING__) && jpf.appsettings.autoDisable
              & !this.isBoundComplete())
                return false;

            this.disabled = false;

            if (jpf.window.focussed == this)
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
        this.disableKeyboard = jpf.isTrue(value);
    },

    /**
     * @attribute {mixed} left the left position of this element. Depending
     * on the choosen layout method the unit can be pixels, a percentage or an
     * expression.
     */
    "left": function(value){
        this.oExt.style.position = "absolute";
        this.oExt.style.left = value + "px";
    },

    /**
     * @attribute {mixed} top the top position of this element. Depending
     * on the choosen layout method the unit can be pixels, a percentage or an
     * expression.
     */
    "top": function(value){
        this.oExt.style.position = "absolute";
        this.oExt.style.top = value + "px";
    },

    /**
     * @attribute {mixed} right the right position of this element. Depending
     * on the choosen layout method the unit can be pixels, a percentage or an
     * expression.
     */
    "right": function(value){
        this.oExt.style.position = "absolute";
        this.oExt.style.right = value + "px";
    },

    /**
     * @attribute {mixed} bottom the bottom position of this element. Depending
     * on the choosen layout method the unit can be pixels, a percentage or an
     * expression.
     */
    "bottom": function(value){
        this.oExt.style.position = "absolute";
        this.oExt.style.bottom = value + "px";
    },

    /**
     * @attribute {mixed} width the different between the left edge and the
     * right edge of this element. Depending on the choosen layout method the
     * unit can be pixels, a percentage or an expression.
     */
    "width": function(value){
        this.oExt.style.width = Math.max(0, value
            - jpf.getWidthDiff(this.oExt)) + "px";
    },

    /**
     * @attribute {mixed} height the different between the top edge and the
     * bottom edge of this element. Depending on the choosen layout method the
     * unit can be pixels, a percentage or an expression.
     */
    "height": function(value){
        this.oExt.style.height = Math.max(0,
            value - jpf.getHeightDiff(this.oExt)) + "px";
    },

    //#ifdef __WITH_ALIGNMENT
    "align": function(value){
        //#ifdef __WITH_ANCHORING
        if (this.disableAnchoring)
            this.disableAnchoring();
        //#endif

        if (!this.hasFeature(__ALIGNMENT__)) {
            this.inherit(jpf.Alignment);
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
     * <pre class="code">
     *  <j:menu id="mnuExample" />
     *
     *  <j:list contextmenu="mnuExample" />
     *  <j:bar contextmenu="mnuExample" />
     * </pre>
     */
    "contextmenu": function(value){
        this.contextmenus = [value];
    },

    //#ifdef __WITH_INTERACTIVE
    "resizable": function(value){
        this.inherit(jpf.Interactive);
        this.$propHandlers["resizable"].apply(this, arguments);
    },

    "draggable": function(value){
        this.inherit(jpf.Interactive);
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
     * <pre class="code">
     *  <j:list actiontracker="newAT" />
     *
     *  <j:bar actiontracker="someAT">
     *      <j:textbox />
     *      <j:textbox />
     *  </j:bar>
     * </pre>
     */
    "actiontracker": function(value){
        if (!value)
            this.$at = null;
        else if (value.tagName == "actiontracker")
            this.$at = value;
        else {
            this.$at = typeof value == "string" && self[value]
                ? jpf.JmlParser.getActionTracker(value)
                : jpf.setReference(value,
                    jpf.nameserver.register("actiontracker",
                        value, new jpf.actiontracker()));
        }
    },
    //#endif
    
    //#ifdef __WITH_TRANSACTION
    /**
     * @attribute {Boolean} center centers the window relative to it's parent's
     * containing rect when shown.
     */
    "transaction" : function(value){
        /**
         * @inherits jpf.DataBinding
         * @inherits jpf.Transaction
         */
        if (!this.hasFeature(__DATABINDING__)) {
            this.inherit(jpf.DataBinding);
            this.smartBinding = true;
        }
         
        if (!this.hasFeature(__TRANSACTION__))
            this.inherit(jpf.Transaction);
    },
    //#endif

    //Load subJML
    /**
     * @attribute {String} the data instruction that loads new jml as children
     * of this element.
     */
    "jml": function(value){
        //Clear??
        this.insertJml(value);
        this.$isSelfLoading = true;
    }
   
    //#ifdef __WITH_ALIAS
    ,"alias" : function(value){
        if (!value) //@todo think about wether this has more meaning
            return;

        var cg = jpf.nameserver.get("alias", value);
        if (!cg) {
            cg = jpf.nameserver.register("alias", value, {
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
                
                set : function(jmlNode){
                    if (this.active == jmlNode)
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
                    
                    this.active = jmlNode;
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
                    
                    jmlNode.$alias = this;
                }
            });
            jpf.makeClass(cg);
            jpf.setReference(value, cg);

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

//#ifdef __WITH_DEBUG_WIN
document.onkeydown = function(e){
    if (!e) e = event;
    if (e.keyCode == 120 || e.ctrlKey && e.altKey && e.keyCode == 68) {
        if (!jpf.debugwin.resPath)
            jpf.debugwin.init();
        jpf.debugwin.activate();
    }
};
//#endif
