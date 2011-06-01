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

apf.__AMLNODE__ = 1 << 14;

// #ifdef __WITH_AMLNODE

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have Document Object Model (DOM) support. The DOM
 * is the primary method for accessing and manipulating an xml document. This
 * includes html documents and aml documents. Every element in the ajax.org
 * markup language can be manipulated using the W3C DOM. This means
 * that every element and attribute you can set in the xml format, can be
 * changed, set, removed reparented, etc runtime. This offers a great deal of
 * flexibility. Well known methods
 * from this specification are .appendChild .removeChild .setAttribute and
 * insertBefore to name a few. Ajax.org Platform aims to implement DOM1
 * completely and parts of DOM2. Which should be extended in the future to fully
 * implement DOM Level 2. For more information see {@link http://www.w3.org/DOM/} 
 * or {@link http://www.w3schools.com/dom/default.asp}.
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:window id="winExample" title="Example" visible="true">
 *      <a:button id="tstButton" />
 *  </a:window>
 * </code>
 * Document Object Model in javascript
 * <code>
 *  //The following line is only there for completeness sake. In fact apf
 *  //automatically adds a reference in javascript called winExample based
 *  //on the id it has.
 *  var winExample = apf.document.getElementById("winExample");
 *  winExample.setAttribute("title", "Example");
 *  winExample.setAttribute("icon", "icoFolder.gif");
 *  winExample.setAttribute("left", "100");
 *
 *  var lblNew = apf.document.createElement("label");
 *  winExample.appendChild(lblNew);
 *  lblNew.setAttribute("caption", "Example");
 *
 *  tstButton.setAttribute("caption", "Click me");
 * </code>
 * That would be the same as having the following aml:
 * <code>
 *  <a:window id="winExample"
 *    title   = "Example"
 *    icon    = "icoFolder.gif"
 *    left    = "100"
 *    visible = "true">
 *      <a:button id="tstButton" caption="Click me"/>
 *      <a:label caption="Example" />
 *  </a:window>
 * </code>
 * Remarks:
 * Because the W3C DOM is native to all modern browsers the internet is full
 * of tutorials and documentation for this API. If you need more information
 * it's a good idea to search for tutorials online.
 *
 * @event DOMNodeInserted
 * @event DOMNodeInsertedIntoDocument
 * @event DOMNodeRemoved
 * @event DOMNodeRemovedFromDocument
 *
 * @constructor
 * @baseclass
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.5
 */
apf.AmlNode = function(){
    this.$init(function(){
        /**
         * Nodelist containing all the child nodes of this element.
         */
        this.childNodes = []; //@todo AmlNodeList
    });
};

(function() {

    //#ifdef __USE_TOSTRING
    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        if (this.nodeName)
            return "[" + this.nodeName.uCaseFirst() + " Node]";
        
        return "[" + this.localName.uCaseFirst() + " Element Node, <" 
            + (this.prefix ? this.prefix + ":" : "") + this.localName + " "
            + this.attributes.join(" ")
            + " /> : " + (this.name || this.$uniqueId || "") + "]";
    };
    //#endif
    
    /**
     * Number specifying the type of node within the document.
     */
    this.$regbase = this.$regbase | apf.__AMLNODE__;
    
    /**
     * Constant for a dom element node.
     * @type {Number}
     */
    this.NODE_ELEMENT                = 1;
    /**
     * Constant for a dom attribute node.
     * @type {Number}
     */
    this.NODE_ATTRIBUTE              = 2;
    /**
     * Constant for a dom text node.
     * @type {Number}
     */
    this.NODE_TEXT                   = 3;
    /**
     * Constant for a dom cdata section node.
     * @type {Number}
     */
    this.NODE_CDATA_SECTION          = 4;
    /**
     * Constant for a dom entity reference node.
     * @type {Number}
     */
    this.NODE_ENTITY_REFERENCE       = 5;
    /**
     * Constant for a dom entity node.
     * @type {Number}
     */
    this.NODE_ENTITY                 = 6;
    /**
     * Constant for a dom processing instruction node.
     * @type {Number}
     */
    this.NODE_PROCESSING_INSTRUCTION = 7;
    /**
     * Constant for a dom comment node.
     * @type {Number}
     */
    this.NODE_COMMENT                = 8;
    /**
     * Constant for a dom document node.
     * @type {Number}
     */
    this.NODE_DOCUMENT               = 9;
    /**
     * Constant for a dom document type node.
     * @type {Number}
     */
    this.NODE_DOCUMENT_TYPE          = 10;
    /**
     * Constant for a dom document fragment node.
     * @type {Number}
     */
    this.NODE_DOCUMENT_FRAGMENT      = 11;
    /**
     * Constant for a dom notation node.
     * @type {Number}
     */
    this.NODE_NOTATION               = 12;
    
    //#ifndef __PACKAGED
    /**
     * the parent in the tree of this element.
     */
    if (!this.parentNode)
        this.parentNode = null;
    
    /**
     * Returns the node immediately preceding the specified one in its parent's 
     * childNodes list, null if the specified node is the first in that list. 
     */
    this.previousSibling = null;
    
    /**
     * Returns the node immediately following the specified one in its parent's 
     * childNodes list, or null if the specified node is the last node in that 
     * list. 
     */
    this.nextSibling = null;
    
    /**
     * Returns the node's first child in the tree, or null if the node is 
     * childless. If the node is a Document, it returns the first node in the 
     * list of its direct children.
     */
    this.firstChild = null;
    
    /**
     * Returns the node's last child in the tree, or null if the node is 
     * childless. If the node is a Document, it returns the last node in the 
     * list of its direct children.
     */
    this.lastChild = null;
    //#endif

    /**
     * The document node of this application
     */
    this.ownerDocument = null;

    /**
     * Returns the value of the current node. 
     */
    this.nodeValue = "";
    
    /**
     * The namespace URI of the node, or null if it is unspecified (read-only). 
     * When the node is a document, it returns the XML namespace for the current 
     * document.
     */
    this.namespaceURI = "";
    
    /**
     * @todo
     */
    //this.baseURI = alsdjlasdj
    
    /**
     * @todo
     */
    //this.prefix = asdkljahqsdkh
        
    /**
     * Appends an element to the end of the list of children of this element.
     * If the element was already a child of another element it is removed from
     * that parent before adding it this element.
     *
     * @param  {AmlNode}  amlNode  the element to insert as child of this element.
     * @return  {AmlNode}  the appended node
     * @method
     */
    this.appendChild =

    /**
     * Inserts an element before another element in the list of children of this
     * element. * If the element was already a child of another element it is
     * removed from that parent before adding it this element.
     *
     * @param  {AmlNode}  amlNode     the element to insert as child of this element.
     * @param  {AmlNode}  beforeNode  the element which determines the insertion position of the element.
     * @return  {AmlNode}  the inserted node
     */
    this.insertBefore = function(amlNode, beforeNode, noHtmlDomEdit){
        //#ifdef __DEBUG
        if (!amlNode || !amlNode.hasFeature || !amlNode.hasFeature(apf.__AMLNODE__)){
            throw new Error(apf.formatErrorString(1072, this,
                "Insertbefore DOM operation",
                "Invalid argument passed. Expecting an AmlElement."));
        }
        //#endif

        if (this.nodeType == this.NODE_DOCUMENT) {
            if (this.childNodes.length) {
                throw new Error(apf.formatErrorString(0, this,
                    "Insertbefore DOM operation",
                    "Only one top level element is allowed in an AML document."));
            }
            else this.documentElement = amlNode; //@todo apf3.0 removal
        }
        
        if (this == amlNode) {
            throw new Error(apf.formatErrorString(0, this,
                "Insertbefore DOM operation",
                "Cannot append node as a child of itself."));
        }

        if (amlNode.nodeType == this.NODE_DOCUMENT_FRAGMENT) {
            var nodes = amlNode.childNodes.slice(0);
            for (var i = 0, l = nodes.length; i < l; i++) {
                this.insertBefore(nodes[i], beforeNode);
            }
            return amlNode;
        }
        
        var isMoveWithinParent = amlNode.parentNode == this,
            oldParentHtmlNode  = amlNode.$pHtmlNode,
            oldParent          = amlNode.parentNode,
            index              = -1,
            _self              = this;
        
        if (beforeNode) {
            index = this.childNodes.indexOf(beforeNode);
            if (index < 0) {
                //#ifdef __DEBUG
                if (beforeNode == this)
                    throw new Error(apf.formatErrorString(1072, this,
                        "Insertbefore DOM operation",
                        "Before node is the same node as inserted node"));
                else 
                    throw new Error(apf.formatErrorString(1072, this,
                        "Insertbefore DOM operation",
                        "Before node is not a child of the parent node specified"));
                //#endif

                return false;
            }
        }

        if (!amlNode.ownerDocument)
            amlNode.ownerDocument = this.ownerDocument || apf.ownerDocument;

        if (amlNode.parentNode)
            amlNode.removeNode(isMoveWithinParent, noHtmlDomEdit);
        amlNode.parentNode = this;

        if (beforeNode)
            index = this.childNodes.indexOf(beforeNode);

        if (beforeNode) {
            amlNode.nextSibling = beforeNode;
            amlNode.previousSibling = beforeNode.previousSibling;
            beforeNode.previousSibling = amlNode;
            if (amlNode.previousSibling)
                amlNode.previousSibling.nextSibling = amlNode;
        }

        if (index >= 0) {
            this.childNodes = this.childNodes.slice(0, index).concat(amlNode,
                this.childNodes.slice(index));
        }
        else {
            index = this.childNodes.push(amlNode) - 1;

            amlNode.nextSibling = null;
            if (index > 0) {
                amlNode.previousSibling = this.childNodes[index - 1];
                amlNode.previousSibling.nextSibling = amlNode;
            }
            else {
                amlNode.previousSibling = null;
            }
        }

        this.firstChild = this.childNodes[0];
        this.lastChild  = this.childNodes[this.childNodes.length - 1];

        //@todo fix event struture, fix tree events
        var initialAppend = !amlNode.$amlLoaded;
        function triggerUpdate(){
            amlNode.$pHtmlNode = _self.canHaveChildren ? _self.$int : document.body;

            //@todo this is a hack, a good solution should be found
            /*var iframelist;
            var containsIframe = (amlNode.$ext && amlNode.$ext.nodeType == 1 
              && (iframelist = amlNode.$ext.getElementsByTagName("iframe")).length > 0
              && apf.findHost(iframelist[0].parentNode) == amlNode);*/

            var nextNode = beforeNode;
            if (!initialAppend && !noHtmlDomEdit && amlNode.$ext && !amlNode.$coreHtml) {
                nextNode = beforeNode;
                while (nextNode && !(nextNode.$altExt || nextNode.$ext)) {
                    nextNode = nextNode.nextSibling;
                }
                
                amlNode.$pHtmlNode.insertBefore(amlNode.$altExt || amlNode.$ext,
                    nextNode && (nextNode.$altExt || nextNode.$ext) || null);
            }
            
            //Signal node and all it's ancestors
            amlNode.dispatchEvent("DOMNodeInserted", {
                $beforeNode         : beforeNode,
                relatedNode         : _self,
                $isMoveWithinParent : isMoveWithinParent,
                $oldParentHtmlNode  : oldParentHtmlNode,
                $oldParent          : oldParent,
                bubbles             : true
            });
            
            if (initialAppend && !noHtmlDomEdit && beforeNode && amlNode.$ext && !amlNode.$coreHtml) {
                nextNode = beforeNode;
                while (nextNode && !(nextNode.$altExt || nextNode.$ext)) {
                    nextNode = nextNode.nextSibling;
                }
                
                amlNode.$pHtmlNode.insertBefore(amlNode.$altExt || amlNode.$ext,
                    nextNode && (nextNode.$altExt || nextNode.$ext) || null);
            }
        }

        var doc = this.nodeType == this.NODE_DOCUMENT ? this : this.ownerDocument;
        if (!doc || doc.$domParser.$shouldWait)
            return amlNode;

        if (this.nodeType == this.NODE_DOCUMENT_FRAGMENT)
            return; //We don't update the tree if this is a doc fragment

        //@todo review this...
        if (initialAppend && !amlNode.render) { // && (nNodes = node.childNodes).length ??
            (this.ownerDocument || this).$domParser.$continueParsing(amlNode, {delay: true});
        }

        triggerUpdate();
        return amlNode;
    };

    /**
     * Removes this element from the document hierarchy. Call-chaining is
     * supported.
     *
     */
    this.removeNode = function(doOnlyAdmin, noHtmlDomEdit){
        //#ifdef __DEBUG
        if (doOnlyAdmin && typeof doOnlyAdmin != "boolean") {
            throw new Error(apf.formatErrorString(0, this,
                "Removing node from parent",
                "Invalid DOM Call. removeNode() does not take any arguments."));
        }
        //#endif

        if (!this.parentNode || !this.parentNode.childNodes)
            return this;

        //#ifdef __DEBUG
        if (!this.parentNode.childNodes.contains(this)) {
            /*throw new Error(apf.formatErrorString(0, this,
                "Removing node from parent",
                "Passed node is not a child of this node.", this.$aml));*/
            return false;
        }
        //#endif

        this.parentNode.childNodes.remove(this);

        //If we're not loaded yet, just remove us from the aml to be parsed
        if (this.$amlLoaded && !apf.isDestroying) {
            //this.parentNode.$aml.removeChild(this.$aml);

            this.dispatchEvent("DOMNodeRemoved", {
                relatedNode  : this.parentNode,
                bubbles      : true,
                $doOnlyAdmin : doOnlyAdmin
            });

            if (!noHtmlDomEdit && !doOnlyAdmin && this.$ext && this.$ext.parentNode) {
                this.$ext.parentNode.removeChild(this.$ext);
                //delete this.$ext; //WTF???
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

        this.$pHtmlNode      =
        this.parentNode      =
        this.previousSibling =
        this.nextSibling     = null;

        return this;
    };

    /**
     * Removes a child from the node list of this element. Call-chaining is
     * supported.
     */
    this.removeChild = function(childNode) {
        //#ifdef __DEBUG
        if (!childNode || !childNode.hasFeature || !childNode.hasFeature(apf.__AMLNODE__)) {
            throw new Error(apf.formatErrorString(0, this,
                "Removing a child node",
                "Invalid Argument. removeChild() requires one argument of type AMLElement."));
        }
        //#endif

        childNode.removeNode();
        return this;
    };
    
    //@todo
    this.replaceChild = function(){};

    /**
     * Clones this element, creating an exact copy of it but does not insert
     * it in the document hierarchy.
     * @param {Boolean} deep whether the element's are cloned recursively.
     * @return {AmlNode} the cloned element.
     */
    this.cloneNode = function(deep){
        if (deep && this.nodeType == 1) {
            return this.ownerDocument.$domParser.parseFromXml(this, {
                doc   : this.ownerDocument,
                delay : true
            }).childNodes[0];
        }
        else {
            return this.ownerDocument.$domParser.$createNode(
                this.ownerDocument, this.nodeType, this);
        }
    };
    
    //@todo
    this.canDispatch = function(namespaceURI, type){};
    
    //@todo
    this.compareDocumentPosition = function(otherNode){
        /*
            DOCUMENT_POSITION_DISCONNECTED = 0x01;
            DOCUMENT_POSITION_PRECEDING = 0x02;
            DOCUMENT_POSITION_FOLLOWING = 0x04;
            DOCUMENT_POSITION_CONTAINS = 0x08;
            DOCUMENT_POSITION_CONTAINED_BY = 0x10;
        */
    };
    
    this.hasAttributes = function(){
        return this.attributes && this.attributes.length;
    };
    
    this.hasChildNodes = function(){
        return this.childNodes && this.childNodes.length;
    };
    
    this.isDefaultNamespace = function(namespaceURI){
        if (node.nodeType == 1) {
            if (!this.prefix)
                return this.namespaceURI == namespaceURI;
            
            //@todo Loop through attributes here
        }
        
        var node = this.parentNode || this.ownerElement;
        return node && node.isDefaultNamespace(namespaceURI);
    };
    
    this.lookupNamespaceURI = function(prefix){
        if (node.nodeType == 1) {
            if (this.namespaceURI && prefix == this.prefix)
                return this.namespaceURI ;
                
            //@todo Loop through attributes here
        }
        
        var node = this.parentNode || this.ownerElement;
        return node && node.lookupNamespaceURI(prefix);
    };
    
    this.lookupPrefix = function(namespaceURI){
        if (this.nodeType == 1) {
            if (namespaceURI == this.namespaceURI && this.prefix)
                return this.prefix;
            
            //@todo Loop through attributes here
        }
        
        var node = this.parentNode || this.ownerElement;
        return node && node.lookupPrefix(namespaceURI);    
    };
    
    this.normalize = function(){};
    
    /**** Xpath support ****/

    /**
     * Queries the aml dom using the W3C xPath query language and returns a node
     * list. This is not an official API call but can be useful in certain cases.
     * see {@link core.documentimplementation.method.evaluate evaluate on the apf.document}
     * @param {String}  sExpr          the xpath expression to query the aml DOM tree with.
     * @param {AmlNode} [contextNode]  the element that serves as the starting point of the search. Defaults to this element.
     * @returns {NodeList} list of found nodes.
     */
    this.selectNodes = function(sExpr, contextNode){
        if (!apf) return;
        
        if (!apf.XPath)
            apf.runXpath();
        return apf.XPath.selectNodes(sExpr,
            contextNode || (this.nodeType == 9 ? this.documentElement : this));
    };

    /**
     * Queries the aml dom using the W3C xPath query language and returns a single
     * node. This is not an official API call but can be useful in certain cases.
     * see {@link core.documentimplementation.method.evaluate evaluate on the apf.document}
     * @param {String}  sExpr          the xpath expression to query the aml DOM tree with.
     * @param {AmlNode} [contextNode]  the element that serves as the starting point of the search. Defaults to this element.
     * @returns {AmlNode} the first node that matches the query.
     */
    this.selectSingleNode  = function(sExpr, contextNode){
        if (!apf) return;
        
        if (!apf.XPath)
            apf.runXpath();
        return apf.XPath.selectNodes(sExpr,
            contextNode || (this.nodeType == 9 ? this.documentElement : this))[0];
    };
    
    /*this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        
    }, true);*/
}).call(apf.AmlNode.prototype = new apf.Class());
// #endif
