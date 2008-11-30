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

var __WITH_JMLDOM__ = 1 << 14;

// #ifdef __WITH_JMLDOM

/**
 * Baseclass adding the Document Object Model (DOM) to this element. The DOM
 * is the primary method for accessing and manipulating an xml document. This 
 * includes html documents and jml documents. Every element in the javeline
 * markup language can be manipulated using the W3C DOM. <strong> This means
 * that every element and attribute you can set in the xml format, can be 
 * changed, set, removed reparented, etc runtime. This offers a great deal of 
 * flexibility. Well known methods
 * from this specification are .appendChild .removeChild .setAttribute and
 * insertBefore to name a few. Javeline PlatForm aims to implement DOM1 
 * completely and parts of DOM2. Which should be extended in the future to fully
 * implement DOM Level 2. For more information see http://www.w3.org/DOM/.
 * Example:
 * Javeline Markup Language
 * <code>
 *  <j:window id="winExample" title="Example">
 *      <j:button id="tstButton" />
 *  </j:window>
 * </code>
 * Document Object Model in javascript
 * <code>
 *  //The following line is only there for completeness sake. In fact jpf
 *  //automatically adds a reference in javascript called winExample based
 *  //on the is it has.
 *  var winExample = jpf.document.getElementById("winExample"); 
 *  winExample.setAttribute("icon", "icoFolder.gif");
 *  winExample.setAttribute("left", "100");
 * 
 *  var lblNew = jpf.document.createElement("label");
 *  winExample.appendChild(lblNew);
 *  lblNew.setAttribute("caption", "Example");
 * 
 *  tstButton.setAttribute("caption", "Click me");
 * </code>
 * That would be the same as having the following jml:
 * <code>
 *  <j:window id="winExample" 
 *    title = "Example" 
 *    icon  = "icoFolder.gif" 
 *    left  = "100">
 *      <j:label caption="Example" />
 *      <j:button id="tstButton" caption="Click me"/>
 *  </j:window>
 * </code>
 * Remarks:
 * Because the W3C DOM is native to all modern browsers the internet is full
 * of tutorials and documentation for this API. If you need more information
 * it's a good idea to search for tutorials online.
 *
 * @constructor
 * @baseclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.JmlDom = function(tagName, parentNode, nodeFunc, jml, content){
    /**
     * {Number} nodeType the type of node within the document.
     *   Possible values:
     *   jpf.NODE_ELEMENT                
     *   jpf.NODE_ATTRIBUTE              
     *   jpf.NODE_TEXT                   
     *   jpf.NODE_CDATA_SECTION          
     *   jpf.NODE_ENTITY_REFERENCE       
     *   jpf.NODE_ENTITY                 
     *   jpf.NODE_PROCESSING_INSTRUCTION 
     *   jpf.NODE_COMMENT                
     *   jpf.NODE_DOCUMENT               
     *   jpf.NODE_DOCUMENT_TYPE          
     *   jpf.NODE_DOCUMENT_FRAGMENT      
     *   jpf.NODE_NOTATION               
     */
    this.nodeType      = jpf.NODE_ELEMENT;
    this.$regbase      = this.$regbase | __WITH_JMLDOM__;
    
    /**
     * {NodeList} childNodes containing all the child nodes of this element.
     */
    this.childNodes    = [];
    var _self          = this;
    
    if (!this.$domHandlers)
        this.$domHandlers = {"remove" : [], "insert" : [], 
            "reparent" : [], "removechild" : []};
    
    /**
     * {JMLDocument} ownerDocument the document of this application
     */
    if (jpf.document)
        this.ownerDocument = jpf.document;
    
    if (tagName) {
        //#ifdef __USE_TOSTRING
        /**
         * Returns a string representation of this object.
         */
        this.toString = function(){
            return "[Element Node, <" + (this.prefix || "j") + ":" + this.tagName 
                + " /> : " + (this.name || this.uniqueId || "") + "]";
        };
        //#endif
        
        /**
         * {JmlNode} the parent in the tree of this element.
         */
        this.parentNode = parentNode;
        this.$jml        = jml;
        /**
         * {Number} nodeFunc the function of this element
         * Possible values:
         * jpf.NODE_VISIBLE     this element has a gui representation
         * jpf.NODE_HIDDEN      this element does not display a gui
         */
        this.nodeFunc   = nodeFunc;
        
        /**
         * {String} tagName the name of the class of this element
         */
        this.tagName    = tagName;
        
        /**
         * {String} name the unique name of this element if any. This is set by the id attribute and is synonymous with the id property.
         */
        this.name       = jml && jml.getAttribute("id");
        
        /**
         * {mixed} content special content for this object
         */
        this.content    = content;
    }
    
    /**
     * Appends an element to the end of the list of children of this element.
     * If the element was already a child of another element it is removed from 
     * that parent before adding it this element.
     *
     * @param  {JmlNode}  jmlNode  the element to insert as child of this element.
     * @return  {JmlNode}  the appended node
     * @method
     */
    this.appendChild = 
    
    /**
     * Inserts an element before another element in the list of children of this 
     * element. * If the element was already a child of another element it is 
     * removed from that parent before adding it this element.
     *
     * @param  {JmlNode}  jmlNode     the element to insert as child of this element.
     * @param  {JmlNode}  beforeNode  the element which determines the insertion position of the element.
     * @return  {JmlNode}  the inserted node
     */
    this.insertBefore = function(jmlNode, beforeNode){
        //#ifdef __DEBUG
        if (!jmlNode || !jmlNode.hasFeature || !jmlNode.hasFeature(__WITH_JMLDOM__)){
            throw new Error(jpf.formatErrorString(1072, this, 
                "Insertbefore DOM operation", 
                "Node is not a jml dom node"));
        }
        //#endif

        var isMoveWithinParent = jmlNode.parentNode == this;
        var oldParentHtmlNode  = jmlNode.pHtmlNode;
        if (jmlNode.parentNode)
            jmlNode.removeNode(isMoveWithinParent);
        jmlNode.parentNode = this;
        
        var index;
        if (beforeNode) {
            index = this.childNodes.indexOf(beforeNode);
            if (index < 0) {
                //#ifdef __DEBUG
                throw new Error(jpf.formatErrorString(1072, this, 
                    "Insertbefore DOM operation", 
                    "Before node is not a child of the parent node specified"));
                //#endif
                
                return false;
            }
            
            jmlNode.nextSibling = beforeNode;
            jmlNode.previousSibling = beforeNode.previousSibling;
            beforeNode.previousSibling = jmlNode;
            if (jmlNode.previousSibling)
                jmlNode.previousSibling.nextSibling = jmlNode;
        }
        
        if (index)
            this.childNodes = this.childNodes.slice(0, index).concat(jmlNode,
                this.childNodes.slice(index));
        else {
            index = this.childNodes.push(jmlNode) - 1;

            jmlNode.nextSibling = null;
            if (index > 0) {
                jmlNode.previousSibling = this.childNodes[index - 1];
                jmlNode.previousSibling.nextSibling = jmlNode;
            }
            else
                jmlNode.previousSibling = null;
        }
        
        this.firstChild = this.childNodes[0];
        this.lastChild  = this.childNodes[this.childNodes.length - 1];
        
        function triggerUpdate(){
            jmlNode.pHtmlNode = _self.canHaveChildren 
                ? _self.oInt 
                : document.body;
            
            //Signal Jml Node
            var i, callbacks = jmlNode.$domHandlers["reparent"];
            for (i = 0, l = callbacks.length; i < l; i++) {
                if (callbacks[i])
                    callbacks[i].call(jmlNode, beforeNode, 
                        _self, isMoveWithinParent, oldParentHtmlNode);
            }
            
            //Signal myself
            callbacks = _self.$domHandlers["insert"];
            for (i = 0, l = callbacks.length; i < l; i++) {
                if (callbacks[i]) 
                    callbacks[i].call(_self, jmlNode, 
                        beforeNode, isMoveWithinParent);
            }
            
            if (jmlNode.oExt) {
                jmlNode.pHtmlNode.insertBefore(jmlNode.oExt, 
                    beforeNode && beforeNode.oExt || null);
            }
        }
        
        //If we're not loaded yet, just append us to the jml to be parsed
        if (!this.$jmlLoaded) {
            jmlNode.$reappendToParent = triggerUpdate;
            
            return;
        }
        
        triggerUpdate();
    };
    
    /**
     * Removes this element from the document hierarchy.
     *
     */
    this.removeNode = function(doOnlyAdmin){
        if (!this.parentNode || !this.parentNode.childNodes) 
            return;
         
        //#ifdef __DEBUG
        if (!this.parentNode.childNodes.contains(this)) {
            throw new Error(jpf.formatErrorString(0, this, 
                "Removing node from parent",
                "The parameter Node is not a child of this Node.", this.$jml));
        }
        //#endif
         
        this.parentNode.childNodes.remove(this);
        
        //If we're not loaded yet, just remove us from the jml to be parsed
        if (this.$jmlLoaded) {
            //this.parentNode.$jml.removeChild(this.$jml);

            if (this.oExt && this.oExt.parentNode)
                this.oExt.parentNode.removeChild(this.oExt);
            
            //Signal myself
            var i, l, callbacks = this.$domHandlers["remove"];
            if (callbacks) {
                for (i = 0, l = callbacks.length; i < l; i++) {
                    callbacks[i].call(this, doOnlyAdmin);
                }
            }
            
            //Signal parent
            callbacks = (this.parentNode.$domHandlers || {})["removechild"];
            if (callbacks) {
                for (i = 0, l = callbacks.length; i < l; i++) {
                    callbacks[i].call(this.parentNode, this, doOnlyAdmin);
                }
            }
        }
        
        if (this.parentNode.firstChild == this)
            this.parentNode.firstChild = this.nextSibling;
        if (this.parentNode.lastChild == this)
            this.parentNode.lastChild = this.previousSibling;
        
        if (this.nextSibling)
            this.nextSibling.previousSibling = this.previousSibling;
        if (this.previousSibling)
            this.previousSibling.nextSibling = this.nextSibling;
            
        this.pHtmlNode       = 
        this.parentNode      = 
        this.previousSibling = 
        this.nextSibling     = null;
        
        return this;
    };
    
    /** 
     * Removes a child from the node list of this element.
     */
    this.removeChild = function(childNode) {
        childNode.removeNode();
    };
    
    /**
     * Returns a list of elements with the given tag name.
     * The subtree below the specified element is searched, excluding the 
     * element itself.
     *
     * @method
     * @param  {String}  tagName  the tag name to look for. The special string "*" represents any tag name.
     * @return  {NodeList}  containing any node matching the search string
     */
    this.getElementsByTagName = function(tagName, norecur){
        tagName = tagName.toLowerCase();
        for (var result = [], i = 0; i < this.childNodes.length; i++) {
            if (this.childNodes[i].tagName == tagName || tagName == "*") 
                result.push(this.childNodes[i]);
            if (!norecur) 
                result = result.concat(this.childNodes[i].getElementsByTagName(tagName));
        }
        return result;
    };
    
    /**
     * Clones this element, creating an exact copy of it but does not insert
     * it in the document hierarchy.
     * @param {Boolean} deep wether the element's are cloned recursively.
     * @return {JmlNode} the cloned element.
     */
    this.cloneNode = function(deep){
        var jml = this.serialize(true, true, !deep);
        return jpf.document.createElement(jml);
    };
    
    /**
     * Serializes this element to a string. The string created can be put into
     * a parser to recreate a copy of this node and it's children.
     * @return {String} the string representation of this element. 
     */
    this.serialize = function(returnXml, skipFormat, onlyMe){
        var node = this.$jml.cloneNode(false);
        for (var name, i = 0; i < (this.$supportedProperties || []).length; i++) {
            name = this.$supportedProperties[i];
            if (this.getProperty(name) !== undefined)
                node.setAttribute(name, String(this.getProperty(name)).toString());
        }
        
        if (!onlyMe) {
            var l, nodes = this.childNodes;
            for (i = 0, l = nodes.length; i < l; i++) {
                node.appendChild(nodes[i].serialize(true));
            }
        }
        
        return returnXml 
            ? node
            : (skipFormat
                ? node.xml || node.serialize()
                : jpf.formatXml(node.xml || node.serialize()));
    };
    
    /**
     * Sets an attribute on this element.
     * @param {String} name the name of the attribute to which the value is set
     * @param {String} value the new value of the attribute.
     */
    this.setAttribute = function(name, value) {
        if (this.$jml)
            this.$jml.setAttribute(name, (value || "").toString());
        
        if (name.indexOf("on") === 0) { //@todo this is bollocks. Should remove previous set onxxx
            this.addEventListener(name, typeof value == "string" 
                ? new Function(value) 
                : value);
            return;
        }
        
        if (this.nodeFunc == jpf.NODE_VISIBLE && !this.oExt)
            return;
        
        if (jpf.dynPropMatch.test(value))
            this.setDynamicProperty(name, value);
        else if (this.setProperty)
            this.setProperty(name, value);
        else 
            this[name] = value;
    };
    
    /**
     * Removes an attribute from this element
     * @param {String} name the name of the attribute to remove.
     */
    this.removeAttribute = function(name){
        //Should deconstruct dynamic properties
        
        this.setProperty(name, null);
    };
    
    /**
     * Retrieves the value of an attribute of this element
     * @param {String} name the name of the attribute for which to return the value.
     * @return {String} the value of the attribute or null if none was found with the name specified.
     * @method
     */
    this.getAttribute = this.getProperty || function(name){
        return this[name];
    };
    
    /**
     * Retrieves the attribute node for a given name
     * @param {String} name the name of the attribute to find.
     * @return {JmlNode} the attribute node or null if none was found with the name specified.
     */
    this.getAttributeNode = function(name){
        return this.attributes.getNamedItem(name);
    }
    
    /**** Xpath support ****/
    
    //#ifdef __WITH_JMLDOM_XPATH
    /**
     * Queries the jml dom using the W3C xPath query language and returns a node 
     * list. This is not an official API call but can be useful in certain cases.
     * see {@link document#evaluate}
     * @param {String}  sExpr        the xpath expression to query the jml DOM tree with.
     * @param {JmlNode} contextNode  the element that serves as the starting point of the search. Defaults to this element.
     * @returns {NodeList} list of found nodes.
     */
    this.selectNodes = function(sExpr, contextNode){
        return jpf.XPath.selectNodes(sExpr, 
            contextNode || (this.nodeType == 9 ? this.documentElement : this));
    };
    
    /**
     * Queries the jml dom using the W3C xPath query language and returns a single 
     * node. This is not an official API call but can be useful in certain cases.
     * see {@link document#evaluate}
     * @param {String}  sExpr        the xpath expression to query the jml DOM tree with.
     * @param {JmlNode} contextNode  the element that serves as the starting point of the search. Defaults to this element.
     * @returns {JmlNode} the first node that matches the query.
     */
    this.selectSingleNode  = function(sExpr, contextNode){
        return jpf.XPath.selectNodes(sExpr, 
            contextNode || (this.nodeType == 9 ? this.documentElement : this))[0];
    };
    // #endif
    
    /**** properties ****/
    
    //#ifdef __WITH_JMLDOM_FULL
    /**
     * {NodeList} list of all attributes
     */
    this.attributes = {
        getNamedItem    : function(name){
            return {
                nodeType  : 2,
                nodeName  : name,
                nodeValue : _self[name] || ""
            }
        },
        setNamedItem    : function(node){
            //#ifdef __DEBUG
            if (!node || node.nodeType != 2) {
                throw new Error(jpf.formatError(0, _self, 
                    "Setting attribute",
                    "Invalid node passed to setNamedItem"));
            }
            //#endif
            
            _self.setAttribute(node.name, node.value);
        },
        removeNamedItem : function(name){
            //#ifdef __DEBUG
            if (!_self[name]) {
                throw new Error(jpf.formatError(0, _self, 
                    "Removing attribute",
                    "Attribute isn't set"));
            }
            //#endif
            
            _self.removeAttribute(name);
        },
        length          : function(){
            return _self.$jml && _self.$jml.attributes.length
                || (_self.$supportedProperties || {length:0}).length; //@todo incorrect
        },
        item            : function(i){
            if (_self.$jml && _self.$jml.attributes)
                return _self.$jml.attributes[i];
                
            var collection = _self.$supportedProperties;
            if (!collection[i]) 
                return false;
            return this.getNamedItem(collection[i]);
        }
    };
    //#endif
    
    this.nodeValue    = "";
    this.namespaceURI = jpf.ns.jpf;
    
    this.$setParent = function(pNode){
        if (pNode && pNode.childNodes.indexOf(this) > -1)
            return;
        
        this.parentNode = pNode;
        var nodes = this.parentNode.childNodes;
        var id = nodes.push(this) - 1;
        
        //#ifdef __WITH_JMLDOM_FULL
        if (id === 0)
            this.parentNode.firstChild = this;
        else {
            var n = nodes[id - 1];
            if (n) {
                n.nextSibling = this;
                this.previousSibling = n || null;
            }
            this.parentNode.lastChild = this;
        }
        //#endif
    };

    if (this.parentNode && this.parentNode.hasFeature
      && this.parentNode.hasFeature(__WITH_JMLDOM__))
        this.$setParent(this.parentNode);
};
// #endif
