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

// #ifdef __WITH_AMLDOCUMENT

/**
 * The AML document. This is the root of the DOM tree and has a nodeType with 
 * value 9 (`apf.NODE_DOCUMENT`). 
 *
 * @class apf.AmlDocument
 * @inherits apf.AmlNode
 * @inherits apf.Class
 * @default_private 
 * @see apf.AmlDom
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.AmlDocument = function(){
    this.$prefixes      = {};
    this.$namespaceURIs = {};
    // #ifdef __WITH_AMLCONFIGURATION
    this.domConfig      = new apf.AmlConfiguration();
    // #endif
    
    this.$init();
};

(function() {
    /**
     * The type of node within the document.
     * @type {Number}
     */
    this.nodeType   = this.NODE_DOCUMENT;
    this.nodeFunc   = apf.NODE_HIDDEN;
    this.nodeName   = "#document";
    
    this.$amlLoaded = true;
    
    this.activeElement   = null; //@todo alias of window.foccussed;
    this.doctype         = null;
    this.domConfig       = null;
    this.implementation  = null;
    this.characterSet    = apf.characterSet;
    
    /**
     * The root element node of the AML application. This is an element with
     * the tagName `'application'`. This is similar to the `'html'` element for regular HTML.
     * @type {apf.AmlNode}
     */
    this.documentElement = null;
    
    /**
     * Gets a AML element based on its id.
     * @param {String} id The id of the AML element to return.
     * @return {apf.AmlElement} The AML element with the id specified.
     */
    this.getElementById = function(id){
        return self[id];
    };

    /**
     * Returns a list of elements with the given tag name.
     *
     * The subtree below the [[apf.AmlDocument.documentElement]] is searched, excluding the
     * element itself.
     *
     * @param  {String}  tagName  The tag name to look for. The special string "*" represents any tag name.
     * @return  {NodeList}  Contains any nodes matching the search string
     */ 
    this.getElementsByTagName = function(tagName){
        var docEl, res = (docEl = this.documentElement)
            .getElementsByTagName(tagName);

        if (tagName == "*" || docEl.tagName == tagName)
            res.unshift(docEl);
        return res;
    };

    /**
     * Returns a list of elements with the given tag name and the specified namespace URI.
     *
     * The subtree below the [[apf.AmlDocument.documentElement]] is searched, excluding the
     * element itself.
     *
     * @param  {String}  namespaceURI  The namespace URI name to look for.
     * @param  {String}  tagName  The tag name to look for. The special string "*" represents any tag name.
     * @return  {NodeList}  Contains any nodes matching the search string
     */ 
    this.getElementsByTagNameNS = function(nameSpaceURI, tagName){
        var docEl,
            res = (docEl = this.documentElement)
                .getElementsByTagNameNS(nameSpaceURI, tagName);

        if (tagName == "*" || docEl.tagName == tagName && docEl.namespaceURI == nameSpaceURI)
            res.unshift(docEl);
        return res;
    };

    /**
     * Creates a new AML element.
     *
     * @param {Mixed} qualifiedName Information about the new node to create. Possible values include:
     *                              - [[String]]:     The tag name of the new element to create
     *                              - [[String]]:    The AML definition for a single or multiple elemnts
     *                              - [[XMLElement]]: The AML definition for a single or multiple elements
     * @return {apf.AmlElement} The created AML element
     */
    this.createElement = function(qualifiedName){
        return this.$domParser.$createNode(this, this.NODE_ELEMENT, null,
            this.namespaceURI, qualifiedName);
    };

    /**
     * Creates a new AML element within the given namespace.
     *
     * @param  {String}  namespaceURI  The namespace URI name to use
     * @param {Mixed} qualifiedName Information about the new node to create. Possible values include:
     *                              - [[String]]:     The tag name of the new element to create
     *                              - [[String]]:     The AML definition for a single or multiple elemnts
     *                              - [[XMLElement]]: The AML definition for a single or multiple elements
     * @return {apf.AmlElement} The created AML element
     */        
    this.createElementNS = function(namespaceURI, qualifiedName){
        return this.$domParser.$createNode(this, this.NODE_ELEMENT, null,
            namespaceURI, qualifiedName);
    };

    /**
     * Creates a copy of a node from an external document that can be inserted into the current document.
     *
     * @param  {apf.AmlNode}  node  The node to import and copy
     * @param {Boolean} [deep]      Indicates whether the descendants of the imported node should also be imported
     * @return {apf.AmlNode} The imported node
     */     
    this.importNode = function(node, deep){
        if (deep && node.nodeType == 1) {
            return this.$domParser.parseFromXml(node, {
                doc   : this,
                delay : true
            }).childNodes[0];
        }
        else {
            return this.$domParser.$createNode(this, node.nodeType, node);
        }
    };
    
    /**
     * Creates and returns a new attribute node.
     *
     * @param  {String}  nodeName  The name of the attribute
     * @return {apf.AmlNode} The attribute node
     */ 
    this.createAttribute = function(nodeName){
        return this.$domParser.$createNode(this, this.NODE_ATTRIBUTE, null,
            this.nameSpaceURI, nodeName);
    };
    
    /**
     * Creates and returns a new attribute node, within a specified URI.
     *
     * @param  {String} nameSpaceURI  The name of the URI
     * @param  {String}  nodeName  The name of the attribute
     * @return {apf.AmlNode} The attribute node
     */ 
    this.createAttributeNS = function(nameSpaceURI, nodeName){
        return this.$domParser.$createNode(this, this.NODE_ATTRIBUTE, null,
            nameSpaceURI, nodeName);
    };
    /**
     * Creates and returns a new [[apf.AmlEvent]] .
     */     
    this.createEvent = function(){
        return new apf.AmlEvent();
    };

    /**
     * Creates and returns a new comment node.
     * @param {String} nodeValue The data to be added to the comment
     * @return {apf.AmlNode} The comment node
     */    
    this.createComment = function(nodeValue){
        return this.$domParser.$createNode(this, this.NODE_COMMENT, null, null,
            null, nodeValue);
    };

    /**
     * Creates and returns a new processing instruction node.
     * @param {String} target The target part of the processing instruction node, like `<?_target_ ...?>`
     * @param {String} data The data to be added to the PI
     * @return {apf.AmlNode} The processing instruction node
     */     
    this.createProcessingInstruction = function(target, data){
        return this.$domParser.$createNode(this, this.NODE_PROCESSING_INSTRUCTION,
            null, null, target, data);
    };
 
    /**
     * Creates and returns a new CDATA section node.
     * @param {String} nodeValue The data to be added to the CDATA node
     * @return {apf.AmlNode} The CDATA section node
     */     
    this.createCDATASection = function(nodeValue){
        return this.$domParser.$createNode(this, this.NODE_CDATA_SECTION, null,
            null, null, nodeValue);
    };
  
    /**
     * Creates and returns a new Text node.
     * @param {String} nodeValue The data to be added to the text node
     * @return {apf.AmlNode} The Text node
     */      
    this.createTextNode = function(nodeValue){
        return this.$domParser.$createNode(this, this.NODE_TEXT, null, null,
            null, nodeValue);
    };

    /**
     * Creates and returns a new document fragment.
     */ 

    this.createDocumentFragment = function(){
        return this.$domParser.$createNode(this, this.NODE_DOCUMENT_FRAGMENT);
    };

    // @todo
    this.querySelector = function(){};
 
     // @todo   
    this.querySelectorAll = function(){};

    //#ifdef __WITH_AMLDOM_W3C_XPATH
    /*
     * Based on the given XPath expression, this function returns an XPathResult.
     *
     * @param {String} sExpr A String representing the XPath to be evaluated
     * @param {String} contextNode
     * @param {String} nsResolver
     * @param {String} type
     * @param {String} sExpr
     */
    this.evaluate = function(sExpr, contextNode, nsResolver, type, x){
        var result = apf.XPath.selectNodes(sExpr,
            contextNode || this.documentElement);

        /*
         * @private
         */
        return {
            snapshotLength : result.length,
            snapshotItem   : function(i){
                return result[i];
            }
        }
    };

    /*
     * See W3C createNSResolver
     */
     // @todo
    this.createNSResolver = function(contextNode){
        return {};
    };
    //#endif

    // @todo
    this.hasFocus = function(){
        
    }

    //#ifdef __WITH_CONTENTEDITABLE
    //designMode property
    
    var selection;
    this.getSelection = function(){
        if (!selection)
            selection = new apf.AmlSelection(this);
        return selection;
    }
    
    var selectrect;
    this.$getSelectRect = function(){
        if (!selectrect)
            selectrect = new apf.selectrect();
        return selectrect;
    }
    
    var visualselect;
    this.$getVisualSelect = function(){
        if (!visualselect)
            visualselect = new apf.visualSelect(this.getSelection());
        return visualselect;
    }
    
    var visualconnect;
    this.$getVisualConnect = function(){
        if (!visualconnect)
            visualconnect = new apf.visualConnect(this.getSelection());
        return visualconnect;
    }
    
    this.createRange = function(){
        return new apf.AmlRange(this);
    }
    
    this.queryCommandState = function(commandId){
        return (this.$commands[commandId.toLowerCase()] || apf.K)
            .call(this, null, null, null, 1) || false;
    };

    this.queryCommandValue = function(commandId){
        return (this.$commands[commandId.toLowerCase()] || apf.K)
            .call(this, null, null, null, 2) || false;
    };
    
    this.queryCommandEnabled = function(commandId){
        return (this.$commands[commandId.toLowerCase()] || apf.K)
            .call(this, this.getSelection().$getNodeList(), false, arguments[2], 3) || false;
    };
    
    this.queryCommandIndeterm = function(commandId){
        return (this.$commands[commandId.toLowerCase()] || apf.K)
            .call(this, null, null, null, 4) || false;
    };
    
    this.queryCommandSupported = function(commandId){
        return this.$commands[commandId.toLowerCase()] ? true : false;
    };

    var special = {"commit":1,"rollback":1,"begin":1,"undo":1,"redo":1,"contextmenu":2,"mode":2,"pause":1};
    this.execCommand = function(commandId, showUI, value, query){
        var f;

        //if command is not enabled, do nothing
        if (!(f = this.$commands[commandId.toLowerCase()]))
            return false;
        
        if (special[commandId] == 1)
            return f.call(this, null, null, value);

        //Get Selection
        //var nodes = this.getSelection().$getNodeList();
        var nodes = this.$getVisualSelect().getLastSelection()
            || this.getSelection().$getNodeList();
        
        //Execute Action
        if (special[commandId] == 2)
            f.call(this, nodes, showUI, value, query);
        else {
            this.$commands.begin.call(this);
            if (f.call(this, nodes, showUI, value, query) === false)
                this.$commands.rollback.call(this);
            else
                this.$commands.commit.call(this); //Will only record if there are any changes
        }
    };
    
    this.$commands = {};
    //#endif
}).call(apf.AmlDocument.prototype = new apf.AmlNode());

//#endif