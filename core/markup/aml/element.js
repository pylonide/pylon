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

/**
 * Represents a single element within an AML node.
 *
 * @class apf.AmlElement
 * @baseclass
 * @inherits apf.AmlNode
 */

// #ifdef __WITH_AMLELEMENT
apf.AmlElement = function(struct, tagName){
    var $init = this.$init;
    this.$init = function(tagName, nodeFunc, struct){
        this.$supportedProperties = this.$supportedProperties.slice();
        
        var prop, p, q;
        p = this.$propHandlers;
        q = this.$propHandlers = {};
        for (prop in p)
            q[prop] = p[prop];
        
        p = this.$booleanProperties;
        q = this.$booleanProperties = {};
        for (prop in p)
            q[prop] = p[prop];
        
        return $init.call(this, tagName, nodeFunc, struct);
    };
    
    this.$init(function(tagName, nodeFunc, struct){
        this.$events            = {};
        this.$inheritProperties = {};
        
        /*
         * A node list containing all the attributes. This is implemented according to the
         * W3C specification.
         * 
         * For more information, see [[apf.AmlElement.getAttribute]] and [[apf.AmlElement.setAttribute]].
         *
         * #### Example
         * 
         * ```javascript
         *  for (var i = 0; i < obj.attributes.length; i++) {
         *      alert(obj.attributes.item(i));
         *  }
         * ```
         * @type {apf.AmlNamedNodeMap}
         */
        this.attributes = new apf.AmlNamedNodeMap(this); //@todo apf3.0 move to init?
        
        /**
         * Defines the purpose of this element. Possible values include:
         * - `apf.NODE_VISIBLE`:  This element has a GUI representation
         * - `apf.NODE_HIDDEN`:   This element does not display a GUI
         * @type {Number}
         */
        this.nodeFunc = nodeFunc;
        
        /**
         * The local name of this element
         * @type {String}
         */
        this.localName = tagName; //@todo
        
        //Parse struct to create attributes and child nodes
        if (struct) {
            var nodes, prop, i, l, attr;
            if (struct.childNodes) {
                nodes = struct.childNodes;
                delete struct.childNodes; //why delete?
            }
            
            //Attributes
            for (prop in struct){ 
                if (prop == "htmlNode") continue;
                
                attr = new apf.AmlAttr(this, prop, struct[prop]);
                
                //These exceptions should be generalized
                if (prop == "id")
                    this.$propHandlers["id"].call(this, this.id = struct.id);
                else if (prop == "hotkey")
                    this.$propHandlers["hotkey"].call(this, this.hotkey = struct.hotkey);
                else if (prop.substr(0, 2) == "on")
                    attr.$triggerUpdate();

                this.attributes.push(attr);
            }
            
            if (!this.ownerDocument) {
                this.ownerDocument = apf.document;
                this.prefix        = "a";
                this.namespaceURI  = apf.ns.aml;
                this.tagName       = tagName;
            }
            
            if (nodes) {
                this.childNodes = nodes;

                for (i = 0, l = nodes.length; i < l; i++) {
                    nodes[i].nextSibling = nodes[i + 1] || null;
                    nodes[i].previousSibling = nodes[i - 1] || null;
                    nodes[i].parentNode = this;
                }
                this.firstChild = nodes[0] || null;
                this.lastChild  = nodes[nodes.length - 1] || null;
            }

            //Temp hack
            this.$aml = apf.$emptyNode || (apf.$emptyNode = apf.getXml("<empty />"));
        }
    });
    
    if (tagName) //of typeof is not function and not true
        $init.call(this, tagName, apf.NODE_HIDDEN, struct);
};

(function(){
    /**
     * A number specifying the type of node within the document.
     * @type {Number}
     */
    this.nodeType = this.NODE_ELEMENT;
    this.canHaveChildren = true;
    
    this.$propHandlers = {
        /**
         * @attribute {String} id The identifier of this element. When set, this
         * identifier is the name of the variable in JavaScript to access this
         * element directly. This identifier is also the way to get a reference to
         * this element using `apf.document.getElementById()`.
         * 
         * #### Example
         *
         * ```xml
         *  <a:bar id="barExample" />
         *  <a:script>
         *      alert(barExample);
         *  </a:script>
         * ```
         */
        "id": function(value){
            //#ifdef __DEBUG
            if (value == "apf") {
                throw new Error(apf.formatErrorString(0, this, 
                    "Setting Name of Element",
                    "Cannot set name of element to 'apf'"));
            }
            //#endif
            
            if (this.name == value || !value)
                return;
    
            if (self[this.name] == this) {
                self[this.name] = null;
                //#ifdef __WITH_NAMESERVER
                apf.nameserver.remove(this.localName, this);
                apf.nameserver.remove("all", this);
                //#endif
            }
    
            //#ifdef __DEBUG
            if (self[value])
                throw new Error("ID collision of APF element: '" + value + "'");
            //#endif
    
            if (!self[value] || !self[value].hasFeature) {
                try {
                    self[value] = this;
                }
                catch(ex) {
                    // #ifdef __DEBUG
                    var error = true;
                    // #endif
                }
            }
            // #ifdef __DEBUG
            if (error && value in self) {
                apf.console.warn("trying to set a value in the global scope with "
                                + "a reserved name '" + value + "'.\nNothing wrong "
                                + "with that, except that you will not be able to "
                                + "reference\nthe object from the global scope in JS.")
            }
            // #endif
            
            //@todo dispatch event for new name creation.
            //@todo old name disposal
            //#ifdef __WITH_NAMESERVER
            apf.nameserver.register(this.localName, value, this)
            apf.nameserver.register("all", value, this)
            //#endif
            
            this.name = value;
        }
    };
    
    this.$booleanProperties   = {};
    this.$inheritProperties   = {};
    this.$supportedProperties = [];
    
    /**
     * Returns a list of elements with the given tag name.
     *
     * The subtree below the specified element is searched, excluding the
     * element itself.
     *
     * @param  {String}  tagName  The tag name to look for. The special string "*" represents any tag name.
     * @param {Boolean} [norecur] If specified, defines whether or not to check recursively
     * @return  {NodeList}  Contains any nodes matching the search string
     */
    this.getElementsByTagName = function(tagName, norecur){
        tagName = tagName.toLowerCase();
        var node, i, l,
            nodes  = this.childNodes,
            result = [];
        for (i = 0, l = nodes.length; i < l; i++) {
            if ((node = nodes[i]).nodeType != 1)
                continue;
            
            if (node.tagName == tagName || tagName == "*")
                result.push(node);

            if (!norecur && node.nodeType == 1)
                result = result.concat(node.getElementsByTagName(tagName));
        }
        
        return result;
    };

    /**
     * Returns a list of elements with the given tag name and the specified namespace URI.
     *
     * The subtree below the specified element is searched, excluding the
     * element itself.
     *
     * @param  {String}  namespaceURI  The namespace URI name to look for.
     * @param  {String}  localName  The tag name to look for. The special string "*" represents any tag name.
     * @param {Boolean} [norecur] If specified, defines whether or not to check recursively
     * @return  {NodeList}  Contains any nodes matching the search string
     */    
    this.getElementsByTagNameNS = function(namespaceURI, localName, norecur){
        localName = localName.toLowerCase();
        var node, i, l,
            nodes  = this.childNodes,
            result = [];
        for (i = 0, l = nodes.length; i < l; i++) {
            if ((node = nodes[i]).nodeType != 1)
                continue;

            if (node.namespaceURI == namespaceURI && (node.localName == localName || localName == "*"))
                result.push(node);

            if (!norecur && node.nodeType == 1)
                result = result.concat(node.getElementsByTagNameNS(namespaceURI, localName));
        }
        
        return result;
    };

    /**
     * Sets an attribute on this element.
     * @chainable
     * @param {String} name The name of the attribute to which the value is set
     * @param {String} value The new value of the attribute.
     * @param {Boolean} [noTrigger] If specified, does not emit events 
     * [[apf.AmlNode@DOMNodeInsertedIntoDocument]] and [[apf.AmlNode@DOMNodeInserted]].
     */
    this.setAttribute = function(name, value, noTrigger) {
        name = name.toLowerCase();
        
        var a = this.attributes.getNamedItem(name);
        if (!a) {
            this.attributes.push(a = new apf.AmlAttr(this, name, value));
        
            if (!this.$amlLoaded && name != "id" && name != "hotkey")
                return;
            
            if (noTrigger)
                a.$setValue(value);
            else {
                //@todo apf3.0 domattr
                a.dispatchEvent("DOMNodeInsertedIntoDocument", {
                    relatedNode : this
                });
                
                //@todo apf3.0 domattr
                a.dispatchEvent("DOMNodeInserted", {
                    relatedNode : this,
                    bubbles     : true
                });
            }

            return;
        }

        var oldValue = a.nodeValue;
        a.$setValue(value);
        
        if (noTrigger || !this.$amlLoaded)
            return;
        
        //@todo apf3.0 domattr
        a.$triggerUpdate(null, oldValue);
    };
    
    //@todo apf3.0 domattr
    this.setAttributeNode = function(attrNode){
        this.attributes.setNamedItem(attrNode);
    };
    
    this.setAttributeNS = function(namespaceURI, name, value){
        return this.setAttribute(name, value);
    };
    
    //@todo apf3.0 domattr
    this.hasAttribute = function(name){
        return this.getAttributeNode(name) ? true : false;
    };
    
    //@todo
    this.hasAttributeNS = function(namespaceURI, name){
        return this.hasAttribute(name);
    };
    
    /**
     * Removes an attribute from this element. 
     * @chainable
     * @param {String} name The name of the attribute to remove.
     * @returns {apf.AmlElement} The modified element.
     */
    this.removeAttribute = function(name){ //@todo apf3.0 domattr
        this.attributes.removeNamedItem(name);
        return this;
    };
    
    //@todo apf3.0 domattr
    this.removeAttributeNS = function(namespaceURI, name){
        return this.removeAttribute(name);
    };
    
    //@todo apf3.0 domattr
    this.removeAttributeNode = function(attrNode){
        this.attributes.removeNamedItem(attrNode.name); //@todo this should probably be slightly different.
    };

    /**
     * Retrieves the value of an attribute of this element.
     *
     * @param  {String}  name       The name of the attribute for which to return the value.
     * @param  {Boolean} [inherited] if specified, takes into consideration that the attribute is inherited
     * @return {String} The value of the attribute, or `null` if none was found with the name specified.
     */
    this.getAttribute = function(name, inherited){
        var item = this.attributes.getNamedItem(name);
        return item ? (inherited 
            ? item.inheritedValue || item.nodeValue 
            : item.nodeValue) : null;
    };
    
    /**
     * Retrieves the attribute node for a given name
     *
     * @param {String} name The name of the attribute to find.
     * @return {apf.AmlNode} The attribute node, or `null` if none was found with the name specified.
     */
    this.getAttributeNode = function(name){
        return this.attributes.getNamedItem(name);
    };

    this.getBoundingClientRect = function(){
        return new apf.AmlTextRectangle(this);
    };
    
    //@todo
    this.querySelector = function(){
        // here we should use: http://code.google.com/p/css2xpath/source/browse/trunk/src/css2xpath.js
    };
    
    //@todo
    this.querySelectorAll = function(){
        // here we should use: http://code.google.com/p/css2xpath/source/browse/trunk/src/css2xpath.js
    };
    
    //@todo
    this.scrollIntoView = function(){
        
    };
    
    /**
     * Replaces the child AML elements with new AML.
     * @param {Mixed}       amlDefNode  The AML to be loaded. This can be a string or a parsed piece of XML.
     * @param {HTMLElement} oInt        The HTML parent of the created AML elements.
     */
    this.replaceMarkup = function(amlDefNode, options) {
        //#ifdef __DEBUG
        apf.console.info("Remove all children from element");
        //#endif

        if (!options)
            options = {};

        if (!options.$intAML)
            options.$intAML = this.$aml;
        if (!options.$int)
            options.$int = this.$int;
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

            if (oItem.$ext != this.$int)
                apf.destroyHtmlNode(oItem.$ext);
        }
        
        this.childNodes.length = 0;
        
        if(options.noLoadingMsg !== false)
            this.$int.innerHTML = "<div class='loading'>loading...</div>";

        //Do an insertMarkup
        this.insertMarkup(amlDefNode, options);
    };

    /**
     * Inserts new AML into this element.
     * @param {Mixed}       amlDefNode  The AML to be loaded. This can be a string or a parsed piece of XML.
     * @param {Object}      options     Additional options to pass. It can include the following properties:
     *                                  - callback ([[Function]]): A function to call once the insertion completes.
     *                                  - clear ([[Boolean]]): If set, the AML has the attribute "clear" attached to it
     */
    this.insertMarkup = function(amlDefNode, options){
        //#ifdef __DEBUG
        apf.console.info("Loading sub markup from external source");
        //#endif

        //#ifdef __WITH_OFFLINE
        if (typeof apf.offline != "undefined" && !apf.offline.onLine)
            return false; //it's the responsibility of the dev to check this
        //#endif

        var _self   = this;
        var include = new apf.XiInclude();
        
        if (amlDefNode.trim().charAt(0) == "<")
            amlDefNode = apf.getXml(amlDefNode);
        
        include.setAttribute("href", amlDefNode);
        if (options && options.clear)
            include.setAttribute("clear", true);
        include.options  = options;
        include.callback = function(){
            _self.dispatchEvent("afteramlinserted", {src: amlDefNode});
            options && options.callback && options.callback();
            setTimeout(function(){
                include.destroy(true, true);
            });
        };
        this.appendChild(include);
    };
    
    //@todo prefix only needs on top element
    this.serialize = function(shallow){
        if (shallow || !this.firstChild) {
            return "<" 
                + (this.prefix 
                  ? this.prefix + ":" + this.localName + " xmlns:" 
                    + this.prefix + "=\"" + this.namespaceURI + "\""
                  : this.localName) + (this.attributes && this.attributes.length ? " " : "")
                + (this.attributes && this.attributes.join(" ") || "")
                + "/>";
        }
        else {
            var str = ["<" 
                + (this.prefix 
                  ? this.prefix + ":" + this.localName + " xmlns:" 
                    + this.prefix + "=\"" + this.namespaceURI + "\""
                  : this.localName) + (this.attributes && this.attributes.length ? " " : "")
                + (this.attributes && this.attributes.join(" ") || "")
                + ">"];
            
            for (var i = this.firstChild; i; i = i.nextSibling)
                str.push(i.serialize());
            
            return str.join("") + "</" + (this.prefix ? this.prefix 
                + ":" + this.localName : this.localName) + ">";
        }
    };
    
    this.$setInheritedAttribute = function(prop){
        var value, node = this, isInherit = false;
        
        value = node.getAttribute(prop);
        if (!value) {
            node = node.parentNode;
            
            //Second argument fetches special inheritance value, if any
            while (node && node.nodeType == 1 && !(value = node.getAttribute(prop, true))) {
                node = node.parentNode;
            }
            
            isInherit = true;
        }
        
        if (!value && apf.config && prop)
            value = apf.config[prop];
    
        if (value) {
            //#ifdef __WITH_PROPERTY_BINDING
            //Remove any bounds if relevant
            this.$clearDynamicProperty(prop);
            //#endif
        }
        
        if (isInherit)
            this.$inheritProperties[prop] = 2;
        
        if (value) {
            //#ifdef __WITH_PROPERTY_BINDING
            if (typeof value == "string" 
              && (value.indexOf("{") > -1 || value.indexOf("[") > -1)) {
                this.$setDynamicProperty(prop, value);
            }
            else 
            //#endif
                this.setProperty(prop, value, false, false, 2);
        }
        
        return value;
    };
    
    //@todo in proper W3C implementation this needs to change
    //@todo this won't work with a combo of remove/append
    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget != this || e.$isMoveWithinParent || !e.$oldParent)
            return;

        //Check inherited attributes for reparenting
        /*
            States:
                    -1 Set
             undefined Pass through
                     2 Inherited
                     3 Semi-inherited
                    10 Dynamic property
        */
        var vOld, vNew;
        var aci = apf.config.$inheritProperties;
        for (var prop in aci) {
            vOld = apf.getInheritedAttribute(e.$oldParent, prop);
            vNew = apf.getInheritedAttribute(this.parentNode, prop);
            
            //Property has changed, lets recursively set it on inherited nodes
            if (vOld != vNew) {
                //@todo code duplication from class.js
                (function recur(nodes) {
                    var i, l, node, n;
                    for (i = 0, l = nodes.length; i < l; i++) {
                        node = nodes[i];
                        if (node.nodeType != 1 && node.nodeType != 7)
                            continue;

                        //Pass through
                        n = node.$inheritProperties[prop];
                        if (aci[prop] == 1 && !n)
                            recur(node.childNodes);
                        
                        //Set inherited property
                        //@todo why are dynamic properties overwritten??
                        else if(!(n < 0)) {//Will also pass through undefined - but why??? @todo seems inefficient
                            if (n == 3) {
                                var sameValue = node[prop];
                                node[prop] = null;
                            }
                            node.setProperty(prop, n != 3
                                ? vNew
                                : sameValue, false, false, n); //This is recursive already
                        }
                    }
                })([this]);
            }
        }
    });
    
    this.$handlePropSet = function(prop, value, force){
        if (this.$booleanProperties[prop])
            value = apf.isTrue(value);

        //#ifdef __DEBUG
        if (typeof this[prop] == "function") {
            throw new Error("Could not set property/attribute '" + prop
                + "' which has the same name as a method on this object: '"
                + this.toString() + "'");
        }
        //#endif

        this[prop] = value;

        var handler;
        return (handler = this.$propHandlers && this.$propHandlers[prop]
          || this.nodeFunc == apf.NODE_VISIBLE && apf.GuiElement && apf.GuiElement.propHandlers[prop] || null)
          && handler.call(this, value, prop, force);
    };
    
    //var aci = apf.config.$inheritProperties; << UNUSED
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var a, i, l, attr = this.attributes;

        // #ifdef __WITH_OFFLINE_STATE
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled) {
            var offlineLookup = apf.offline.state.getAll(this);
            for (i in offlineLookup) {
                a = attr.getNamedItem(i);
                if (a) 
                    a.$setValue(offlineLookup[i]);
                else {
                    this.attributes.push(
                        new apf.AmlAttr(this, i, offlineLookup[i]))
                }
            }
        }
        // #endif

        //#ifdef __WITH_NAMESERVER
        //#ifdef __WITH_APP_DEFAULTS
        //Get defaults from the defaults element if it exists
        var defs = apf.nameserver.getAll("defaults_" + this.localName);
        if (defs.length) {
            for (var j = 0, jl = defs.length; j < jl; j++) {
                var d = defs[j].attributes, di;
                for (i = 0, l = d.length; i < l; i++) {
                    a = attr.getNamedItem((di = d[i]).nodeName);
                    if (a) {
                        if (a.value)//specified 
                            continue;
                        
                        a.$setValue(di.nodeValue);
                        this.$inheritProperties[di.nodeName] = 2;
                    }
                    else {
                        this.attributes.push(
                            new apf.AmlAttr(this, di.nodeName, di.nodeValue));
                        this.$inheritProperties[di.nodeName] = 2;
                    }
                }
            }
        }
        //#endif
        //#endif

        //Set all attributes
        for (i = 0, l = attr.length; i < l; i++) {
            attr[i].dispatchEvent("DOMNodeInsertedIntoDocument");
        }
    }, true);
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.$amlLoaded = true;
    });
}).call(apf.AmlElement.prototype = new apf.AmlNode());
// #endif
