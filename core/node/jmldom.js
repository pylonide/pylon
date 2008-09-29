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

__JMLDOM__ = 1 << 14;

// #ifdef __WITH_JMLDOM

/**
 * Baseclass adding the Document Object Model (DOM) API to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.JmlDom = function(tagName, parentNode, nodeFunc, jml, content){
    this.nodeType   = jpf.NODE_ELEMENT;
    this.$regbase   = this.$regbase | __JMLDOM__;
    this.childNodes = [];
    var _self       = this;
    
    if (!this.$domHandlers)
        this.$domHandlers = {"remove" : [], "insert" : [], 
            "reparent" : [], "removechild" : []};
    
    if (tagName) {
        this.parentNode = parentNode;
        this.jml        = jml;
        this.nodeFunc   = nodeFunc;
        this.tagName    = tagName;
        this.name       = jml && jml.getAttribute("id");
        this.content    = content;
    }
    
    /**
     * Adds a component to the end of the list of children of a specified parent component.
     * If the component already exists it is removed from current parent component, then added
     * to new parent component.
     *
     * @param  {JmlNode}  jmlNode  required  the component to insert as child of this component
     * @param  {Boolean}  noAlignUpdate  optional  true  Alignment rules are not updated
     *                                           false  default  Alignment rules are updated
     * @return  {JmlNode}  the appended node
     */
    this.appendChild = 
    
    /**
     * Inserts a component before another component in a list of children of a specified parent component.
     * If the component already exists it is removed from current parent component, then added
     * to new parent component.
     *
     * @param  {JmlNode}  jmlNode  required  the component to insert as child of this component
     * @param  {JmlNode}  beforeNode  required  the component before which <code>jmlNode</code> is inserted
     * @return  {JmlNode}  the appended node
     */
    this.insertBefore = function(jmlNode, beforeNode){
        //#ifdef __DEBUG
        if (!jmlNode || !jmlNode.hasFeature || !jmlNode.hasFeature(__JMLDOM__)){
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
     * Removes this component from the document hierarchy.
     *
     */
    this.removeNode = function(doOnlyAdmin){
        if (!this.parentNode) 
            return;
         
        //#ifdef __DEBUG
        if (!this.parentNode.childNodes.contains(this)) {
            throw new Error(jpf.formatErrorString(0, this, 
                "Removing node from parent",
                "The parameter Node is not a child of this Node.", this.jml));
        }
        //#endif
         
        this.parentNode.childNodes.remove(this);
        
        //If we're not loaded yet, just remove us from the jml to be parsed
        if (this.$jmlLoaded) {
            //this.parentNode.jml.removeChild(this.jml);

            if (this.oExt)
                this.oExt.parentNode.removeChild(this.oExt);
            
            //Signal myself
            var i, callbacks = this.$domHandlers["remove"];
            if (callbacks) {
                for (i = 0, l = callbacks.length; i < l; i++) {
                    callbacks[i].call(this, doOnlyAdmin);
                }
            }
            
            //Signal parent
            var i, callbacks = this.parentNode.$domHandlers["removechild"];
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
    
    this.removeChild = function(childNode) {
        childNode.removeNode();
    };
    
    /**
     * Returns a list of elements with the given tag name.
     * The subtree underneath the specified element is searched, excluding the element itself.
     *
     * @param  {String}  tagName  required  the tag name to look for. The special string "*" represents all elements.
     * @return  {Array}  containing any node matching the search string
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
     * Clone component: same skin, data, bindings connections etc
     * @notimplemented
     */
    this.cloneNode = function(deep){
        var jml = this.serialize(true, true, !deep);
        return jpf.document.createElement(jml);
    };
    
    this.serialize = function(returnXml, skipFormat, onlyMe){
        var node = this.jml.cloneNode(false);
        for (var name, i = 0; i < this.$supportedProperties.length; i++) {
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
    
    this.setAttribute = function(name, value) {
        this.jml.setAttribute(name, (value || "").toString());
        
        if (name.indexOf("on") === 0) {
            this.addEventListener(name, typeof value == "string" 
                ? new Function(value) 
                : value);
            return;
        }
        
        if (this.nodeFunc == jpf.NODE_VISIBLE && !this.oExt)
            return;
        
        if (jpf.dynPropMatch.test(value))
            this.setDynamicProperty(name, value);
        else
            this.setProperty(name, value);
    };
    
    this.removeAttribute = function(name){
        //Should deconstruct dynamic properties
        
        this.setProperty(name, null);
    };
    
    this.getAttribute = this.getProperty;
    
    /**** properties ****/
    
    //#ifdef __WITH_DOM_COMPLETE
    this.attributes = {
        getNamedItem    : function(name){
            return {
                nodeType  : 2,
                nodeName  : name,
                nodeValue : _self[name]
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
            return _self.$supportedProperties.length; //@todo incorrect
        },
        item            : function(i){
            if (!_self.$supportedProperties[i]) 
                return false;
            return this.getNamedItem(_self.$supportedProperties[i]);
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
        
        //#ifdef __WITH_DOM_COMPLETE
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
      && this.parentNode.hasFeature(__JMLDOM__))
        this.$setParent(this.parentNode);
};
// #endif
