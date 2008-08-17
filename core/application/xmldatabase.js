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

//#ifdef __WITH_APP || __WITH_XMLDATABASE

/**
 * XMLDatabase object is the local storage for XML data.
 * This object routes all change requests to synchronize data with representation.
 * It also has many utility methods which makes dealing with XML a lot nicer.
 *
 * @classDescription		This class creates a new xmldatabase
 * @return {XMLDatabaseImplementation} Returns a new xmldatabase
 * @type {XMLDatabaseImplementation}
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.XMLDatabaseImplementation = function(){
    this.xmlDocTag    = "j_doc";
    this.xmlIdTag     = "j_id";
    this.xmlListenTag = "j_listen";
    this.htmlIdTag    = "id";
    
    var xmlDocLut     = [];
    
    /* ************************************************************
     Lookup
     *************************************************************/
    /**
     * @private
     */
    this.getElementById = function(id, doc){
        if (!doc) 
            doc = xmlDocLut[id.split("\|")[0]];
        if (!doc) 
            return false;

        return doc.selectSingleNode("descendant-or-self::node()[@"
            + this.xmlIdTag + "='" + id + "']");
    }
    
    /**
     * @private
     */
    this.getNode = function(htmlNode){
        if (!htmlNode || !htmlNode.getAttribute(this.htmlIdTag)) 
            return false;

        return this.getElementById(htmlNode.getAttribute(this.htmlIdTag)
            .split("\|", 2).join("|"));
    }
    
    /**
     * @private
     */
    this.getNodeById = function(id, doc){
        var q = id.split("\|");
        q.pop();
        return this.getElementById(q.join("|"), doc);//id.split("\|", 2).join("|")
    }
    
    /**
     * @private
     */
    this.getDocumentById = function(id){
        return xmlDocLut[id];
    }
    
    /**
     * @private
     */
    this.getDocument = function(node){
        return xmlDocLut[node.getAttribute(this.xmlIdTag).split("\|")[0]];
    }
    
    /**
     * @private
     */
    this.getID = function(xmlNode, o){
        return xmlNode.getAttribute(this.xmlIdTag) + "|" + o.uniqueId;
    }
    
    /**
     * Gets the child position of the DOM node.
     *
     * @param  {DOMNode}  node  required  DOM node which is subject to the query.
     * @return  {Integer}  position of DOM node within the NodeList of children of it's parent
     */
    this.getChildNumber = function(node){
        var p = node.parentNode;
        for (var i = 0; i < p.childNodes.length; i++) 
            if (p.childNodes[i] == node) 
                return i;
    }
    
    /**
     * Determines wether <code>childnode</code> is a child of <code>pnode</code>.
     *
     * @param  {DOMNode}  pnode  required  DOM node for which is determined if <code>childnode</code> is a child.
     * @param  {DOMNode}  childnode  required  DOM node for which is determined if <code>pnode</code> is a parent.
     * @param  {Boolean}  orItself  optional  true   method also returns true when pnode == childnode
     *                                       false  method only returns true when childnode is a child of pnode
     * @return  {Integer}  position of DOM node within the NodeList of children of it's parent
     */
    this.isChildOf = function(pnode, childnode, orItself){
        if (!pnode || !childnode) 
            return false;
        if (orItself && pnode == childnode) 
            return true;
        
        var nodes = pnode.getElementsByTagName("*");
        for (var i = 0; i < nodes.length; i++) 
            if (nodes[i] == childnode) 
                return true;
        return false;
    }
    
    /**
     * Finds HTML node used as representation by component <code>oComp</comp for an XML data node.
     *
     * @param  {XMLNode}  xmlNode  required  XML data node bound to a HTML node.
     * @param  {JMLNode}  oComp  required  Component which has representation of the <code>xmlNode</code>.
     * @return  {HTMLNode}  the found HTML node or null
     */
    this.findHTMLNode = function(xmlNode, oComp){
        do {
            if (xmlNode.nodeType == 1 && xmlNode.getAttribute(this.xmlIdTag)) {
                return oComp.getNodeFromCache(xmlNode.getAttribute(this.xmlIdTag)
                    + "|" + oComp.uniqueId);
            }
            if (xmlNode == oComp.XMLRoot) 
                return null;

            xmlNode = xmlNode.parentNode;
        }
        while (xmlNode && xmlNode.nodeType != 9)
        
        return null;
    }
    
    /**
     * Finds XML node used as representation by component <code>oComp</comp for an XML data node.
     *
     * @param  {HTMLNode}  htmlNode  required  HTML node bound to a XML node.
     * @return  {XMLNode}  the found XML node or null
     */
    this.findXMLNode = function(htmlNode){
        if (!htmlNode) 
            return false;
        
        while (htmlNode && htmlNode.nodeType == 1
          && htmlNode.tagName.toLowerCase() != "body"
          && !htmlNode.getAttribute("id")
          || htmlNode && htmlNode.nodeType == 1
          && htmlNode.getAttribute(this.htmlIdTag)
          && htmlNode.getAttribute(this.htmlIdTag).match(/^q/)) {
            if (htmlNode.host && htmlNode.host.oExt == htmlNode) 
                return htmlNode.host.XMLRoot;

            htmlNode = htmlNode.parentNode;
        }
        if (!htmlNode || htmlNode.nodeType != 1) 
            return false;
        
        if (htmlNode.tagName.toLowerCase() == "body") 
            return false;
        
        return this.getNode(htmlNode);
    }
    
    /**
     * @private
     */
    this.getElement = function(parent, nr){
        var nodes = parent.childNodes;
        for (var j = 0, i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) 
                continue;
            if (j++ == nr) 
                return nodes[i];
        }
    }
    
    /**
     * @private
     */
    this.getModel = function(name){
        return jpf.NameServer.get("model", name);
    }
    
    /**
     * @private
     */
    this.setModel = function(model){
        jpf.NameServer.register("model", model.data.ownerDocument
            .documentElement.getAttribute(this.xmlDocTag), model);
    }
    
    /**
     * @private
     */
    this.findModel = function(xmlNode){
        return this.getModel(xmlNode.ownerDocument
            .documentElement.getAttribute(this.xmlDocTag));
    }
    
    /**
     * Creates an XML node from an string containing serialized XML.
     *
     * @param  {String}  strXml   required  String contining serialized XML.
     * @param  {Boolean}  no_error  optional  When set to true no exception is thrown when invalid XML is detected.
     * @return  {XMLNode}  the created XML node
     */
    this.getXml = function(strXml, no_error){
        return jpf.getObject("XMLDOM", strXml, no_error).documentElement;
    }
    
    /* ************************************************************
     Data-Binding - ADMIN
     *************************************************************/
    this.nodeCount = {};
    
    /**
     * @private
     */
    this.nodeConnect = function(documentId, xmlNode, htmlNode, o){
        if (!this.nodeCount[documentId]) 
            this.nodeCount[documentId] = 0;
        
        var xmlID = xmlNode.getAttribute(this.xmlIdTag) || documentId 
                        + "|" + ++this.nodeCount[documentId];
        xmlNode.setAttribute(this.xmlIdTag, xmlID);
        
        if (!o) 
            return xmlID;
        
        var htmlID = xmlID + "|" + o.uniqueId;
        if (htmlNode) 
            htmlNode.setAttribute(this.htmlIdTag, htmlID);
        
        return htmlID;
    }
    
    /**
     * @private
     */
    this.addNodeListener = function(xmlNode, o){
        // #ifdef __DEBUG
        if (!o.__xmlUpdate) 
            throw new Error(1040, jpf.formatErrorString(1040, null, "Adding Node listener", "Cannot attach this listener because it doesn't support the correct interface (__xmlUpdate)."));
        // #endif
        
        var listen = xmlNode.getAttribute(this.xmlListenTag);
        var nodes  = (listen ? listen.split(";") : []);
        
        if (!nodes.contains(o.uniqueId)) 
            nodes.push(o.uniqueId);
        xmlNode.setAttribute(this.xmlListenTag, nodes.join(";"));
        
        return xmlNode;
    }
    
    /**
     * @todo  Use this function when a component really unbinds from a
     *        piece of data and does not uses it for caching
     */
    this.removeNodeListener = function(xmlNode, o){
        var listen = xmlNode.getAttribute(this.xmlListenTag);
        var nodes = (listen ? listen.split(";") : []);
        
        for (var newnodes = [], i = 0; i < nodes.length; i++) {
            if (nodes[i] != o.uniqueId) 
                newnodes.push(nodes[i]);
        }
        
        xmlNode.setAttribute(this.xmlListenTag, newnodes.join(";"));
        
        return xmlNode;
    }
    
    /**
     * Integrates nodes as children beneath a parentnode
     * (optionally including attributes)
     *
     * @param  {XMLNode}  xmlNode  required  XMLNode specifying the data to integrate.
     * @param  {XMLNode}  parent  required  XMLNode specifying the point of integration.
     * @param  {Boolean}  options.copyAttributes  optional  When set to true the attributes of <code>xmlNode</code> are copied as well.
     * @param  {Boolean}  options.clearContents  optional  When set to true the contents of <code>parent</code> is cleared.
     * @return  {XMLNode}  the created XML node
     */
    this.integrate = function(XMLRoot, parentNode, options){
        if (typeof parentNode != "object") 
            parentNode = getElementById(parentNode);
        
        if (options.clearContents) {
            //clean parent
            var nodes = parentNode.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--)
                parentNode.removeChild(nodes[i]);
        }
        
        // #ifdef __WITH_VIRTUALVIEWPORT
        if (options.start) { //Assuming each node is in count
            var marker = options.marker;
            if(!marker){
                //optionally find marker
                
            }
            
            //This code assumes that the dataset fits inside this marker
            
            //Start of marker
            if(marker.getAttribute("start") - options.start == 0){
                marker.setAttribute("start", start + options.length);
                var reserved = parseInt(marker.getAttribute("reserved"));
                marker.setAttribute("reserved", reserved + options.length);
                var beforeNode = marker;
            }
            //End of marker
            else if(options.start + options.length == marker.getAttribute("end")){
                marker.setAttribute("end", options.start + options.length);
                var beforeNode = marker.nextSibling;
                var reserved = parseInt(marker.getAttribute("reserved")) + parseInt(marker.getAttribute("end")) - options.length;
            }
            //Middle of marker
            else{
                var m2 = marker.parentNode.insertBefore(marker.cloneNode(true), marker);
                m2.setAttribute("end", options.start - 1);
                marker.setAttribute("start", options.start + options.length);
                var reserved = parseInt(marker.getAttribute("reserved"));
                marker.setAttribute("reserved", reserved + options.length);
                var beforeNode = marker;
            }
            
            if (parentNode.ownerDocument.importNode) 
                for (var i = 0; i < XMLRoot.childNodes.length; i++) {
                    parentNode.insertBefore(parentNode.ownerDocument.importNode(XMLRoot.childNodes[i], true), beforeNode)
                      .setAttribute(this.xmlIdTag, options.documentId + "|" + (reserved + i));
                }
            else 
                for (var i = XMLRoot.childNodes.length - 1; i >= 0; i--) {
                    parentNode.insertBefore(XMLRoot.childNodes[0], beforeNode)
                      .setAttribute(this.xmlIdTag, options.documentId + "|" + (reserved + i));
                }
        }
        else
        // #endif
        {
            var beforeNode = parentNode.firstChild;
        
            if (parentNode.ownerDocument.importNode) 
                for (var i = 0; i < XMLRoot.childNodes.length; i++) 
                    parentNode.insertBefore(parentNode.ownerDocument.importNode(XMLRoot.childNodes[i], true), beforeNode);
            else 
                for (var i = XMLRoot.childNodes.length - 1; i >= 0; i--) 
                    parentNode.insertBefore(XMLRoot.childNodes[0], beforeNode);
        }
        
        if (options.copyAttributes) {
            var attr = XMLRoot.attributes;
            for (var i = 0; i < attr.length; i++) 
                if (attr[i].nodeName != this.xmlIdTag) 
                    parentNode.setAttribute(attr[i].nodeName, attr[i].nodeValue);
        }
        
        return parentNode;
    }
    
    /**
     * @private
     * @description  Integrates current XMLDatabase with parent XMLDatabase
     *
     *	- assuming transparency of XMLDOM elements cross windows
     *	  with no performence loss.
     */
    this.synchronize = function(){
        this.forkRoot.parentNode.replaceChild(this.root, this.forkRoot);
        this.parent.applyChanges("synchronize", this.root);
    }
    
    this.copyNode = function(xmlNode){
        return this.clearConnections(xmlNode.cloneNode(true));
    }
    
    /* ************************************************************
     Data-Binding - EXEC
     *************************************************************/
    this.setNodeValue = function(xmlNode, nodeValue, applyChanges){
        if (xmlNode.nodeType == 1) {
            if (!xmlNode.firstChild) 
                xmlNode.appendChild(xmlNode.ownerDocument.createTextNode("-"));

            xmlNode.firstChild.nodeValue = jpf.isNot(nodeValue) ? "" : nodeValue;
            
            if (applyChanges) 
                jpf.XMLDatabase.applyChanges("synchronize", xmlNode);
        }
        else {
            xmlNode.nodeValue = jpf.isNot(nodeValue) ? "" : nodeValue;
            
            if (applyChanges) 
                jpf.XMLDatabase.applyChanges("synchronize",
                    xmlNode.parentNode || xmlNode.selectSingleNode(".."));
        }
    }
    
    this.getNodeValue = function(xmlNode){
        if (!xmlNode) 
            return "";
        return xmlNode.nodeType == 1
            ? (!xmlNode.firstChild ? "" : xmlNode.firstChild.nodeValue)
            : xmlNode.nodeValue;
    }
    
    /* ******** GETINHERITEDATTRIBUTE ***********
     Returns inherited connect id if any
     INTERFACE:
     this.getInheritedAttribute(XMLNode);
     ****************************/
    this.getInheritedAttribute = function(x, attr, func){
        var result, y = x;
        while (y && y.nodeType != 11 && y.nodeType != 9
          && !(result = attr && y.getAttribute(attr) || func && func(y))) {
            y = y.parentNode;
        }
        
        if (!result && attr && jpf.appsettings.jml) 
            result = jpf.appsettings.jml.getAttribute(attr);
        return result;
    }
    
    /* ******** SETTEXTNODE ***********
     Set nodeValue of Text Node. If Node doesn't exist it is created.
     Optionally xpath statement is executed to identify textnode.
     
     INTERFACE:
     this.setTextNode(pnode, value, [xpath]);
     ****************************/
    this.setTextNode = function(pnode, value, xpath, UndoObj){
        if (xpath) {
            var tNode = pnode.selectSingleNode(xpath);
            if (!tNode) 
                return;
            pnode = tNode.nodeType == 1 ? tNode : null;
        }
        if (pnode || !tNode) {
            if (!pnode.firstChild) 
                var tNode = pnode.appendChild(pnode.ownerDocument.createTextNode(""));//createCDATASection
            else 
                var tNode = pnode.firstChild;
        }
        
        //Action Tracker Support
        if (UndoObj) UndoObj.oldValue = tNode.nodeValue;
        
        //Apply Changes
        tNode.nodeValue = value;
        
        this.applyChanges("text", tNode.parentNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["setTextNode", pnode, value, xpath], UndoObj);
        // #endif
    }
    
    /* ******** SETATTRIBUTE ***********
     Sets attribute of node.
     Optionally xpath statement is executed to identify attribute node
     
     INTERFACE:
     this.setAttribute(xmlNode, name, value, [xpath]);
     ****************************/
    this.setAttribute = function(xmlNode, name, value, xpath, UndoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;
        
        //Apply Changes
        (xpath ? xmlNode.selectSingleNode(xpath) : xmlNode).setAttribute(name, value);
        this.applyChanges("attribute", xmlNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["setAttribute", xmlNode, name, value, xpath], UndoObj);
        // #endif
    }
    
    /* ******** REMOVEATTRIBUTE ***********
     Removes attribute of node.
     Optionally xpath statement is executed to identify attribute node
     
     INTERFACE:
     this.removeAttribute(xmlNode, name, [xpath]);
     ****************************/
    this.removeAttribute = function(xmlNode, name, xpath, UndoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;
        
        //Action Tracker Support
        if (UndoObj) UndoObj.name = name;
        
        //Apply Changes
        (xpath ? xmlNode.selectSingleNode(xpath) : xmlNode).removeAttribute(name);
        this.applyChanges("attribute", xmlNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["removeAttribute", xmlNode, name, xpath], UndoObj);
        // #endif
    }
    
    /* ******** REPLACENODE ***********
     Replace one node with another
     Optionally xpath statement is executed to identify attribute node
     
     INTERFACE:
     this.replaceNode(oldNode, newNode, [xpath]);
     ****************************/
    this.replaceNode = function(oldNode, newNode, xpath, UndoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;
        
        //Apply Changes
        if (xpath) oldNode = oldNode.selectSingleNode(xpath);
        
        //Action Tracker Support
        if (UndoObj) UndoObj.oldNode = oldNode;
        
        oldNode.parentNode.replaceChild(newNode, oldNode);
        this.copyConnections(oldNode, newNode);
        
        this.applyChanges("replacechild", newNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["replaceChild", oldNode, newNode, xpath], UndoObj);
        // #endif
    }
    
    /* ******** ADDCHILDNODE ***********
     Creates a new node under pnode before beforeNode or as last node.
     Optionally xpath statement is executed to identify parentNode node
     
     INTERFACE:
     this.addChildNode(pnode, tagName, attr, [afterNode], [xpath]);
     ****************************/
    this.addChildNode = function(pnode, tagName, attr, beforeNode, xpath, UndoObj){
        //Create New Node
        var xmlNode = pnode.insertBefore(pnode.ownerDocument.createElement(tagName), beforeNode);
        
        //Set Attributes
        for (var i = 0; i < attr.length; i++) 
            xmlNode.setAttribute(attr[i][0], attr[i][1]);
        
        //Action Tracker Support
        if (UndoObj) 
            UndoObj.addedNode = xmlNode;
        
        this.applyChanges("add", xmlNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["addChildNode", pnode, tagName, attr, beforeNode, xpath], UndoObj);
        // #endif
        
        return xmlNode;
    }
    
    /* ******** APPENDCHILDNODE ***********
     Appends xmlNode to pnode and before beforeNode or as last node
     Optionally set bool unique to make sure node is unique under parent
     Optionally xpath statement is executed to identify parentNode node
     
     INTERFACE:
     this.appendChildNode(pnode, xmlNode, [afterNode], [unique], [xpath]);
     ****************************/
    this.appendChildNode = function(pnode, xmlNode, beforeNode, unique, xpath, UndoObj){
        if (unique && pnode.selectSingleNode(xmlNode.tagName)) 
            return false;
        
        if (UndoObj) 
            this.clearConnections(xmlNode);
        
        //Add xmlNode to parent pnode or one selected by xpath statement
        (xpath ? pnode.selectSingleNode(xpath) : pnode).insertBefore(xmlNode, beforeNode);
        
        //detect if xmlNode should be removed somewhere else
        //- [17-2-2004] changed pnode (2nd arg applychange) into xmlNode
        
        this.applyChanges("add", xmlNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["appendChildNode", pnode, xmlNode.xml, beforeNode, unique, xpath], UndoObj);
        // #endif
        
        return xmlNode;
    }
    
    /* ******** MOVENODE ***********
     Moves xmlNode to pnode and before beforeNode or as last node
     
     INTERFACE:
     this.moveNode(pnode, xmlNode, [beforeNode], [xpath]);
     ****************************/
    this.moveNode = function(pnode, xmlNode, beforeNode, xpath, UndoObj){
        //Action Tracker Support
        if (!UndoObj) 
            UndoObj = {};
        UndoObj.pNode      = xmlNode.parentNode;
        UndoObj.beforeNode = xmlNode.nextSibling;
        UndoObj.toPnode    = (xpath ? pnode.selectSingleNode(xpath) : pnode);
        
        this.applyChanges("move-away", xmlNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["moveNode", pnode, xmlNode, beforeNode, xpath], UndoObj); //note: important that transport of rsb is async
        // #endif
        
        //Set new id if the node change document (for safari this should be fixed)
        if (!jpf.isSafari
          && jpf.XMLDatabase.getXmlDocId(xmlNode) != jpf.XMLDatabase.getXmlDocId(pnode)) {
            xmlNode.removeAttributeNode(xmlNode.getAttributeNode(this.xmlIdTag));
            this.nodeConnect(jpf.XMLDatabase.getXmlDocId(pnode), xmlNode);
        }
        
        if (jpf.isSafari && pnode.ownerDocument != xmlNode.ownerDocument) 
            xmlNode = pnode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes

        UndoObj.toPnode.insertBefore(xmlNode, beforeNode);
        this.applyChanges("move", xmlNode, UndoObj);
    }
    
    /* ******** REMOVENODE ***********
     Removes xmlNode from xmlTree
     Optional xpath statement identifies xmlNode
     
     INTERFACE:
     this.removeNode(xmlNode, [xpath]);
     ****************************/
    this.removeNode = function(xmlNode, xpath, UndoObj){
        if (xpath) 
            xmlNode = xmlNode.selectSingleNode(xpath);
        
        //ActionTracker Support
        if (UndoObj) {
            UndoObj.pNode       = xmlNode.parentNode;
            UndoObj.removedNode = xmlNode;
            UndoObj.beforeNode  = xmlNode.nextSibling;
        }
        
        // #ifdef __WITH_RSB
        this.applyRSB(["removeNode", xmlNode, xpath], UndoObj); //note: important that transport of rsb is async
        // #endif
        
        //Apply Changes
        this.applyChanges("remove", xmlNode, UndoObj);
        var p = xmlNode.parentNode;
        p.removeChild(xmlNode);
        this.applyChanges("redo-remove", xmlNode, null, p);//UndoObj
    }
    
    /* ******** REMOVENODELIST ***********
     Removes xmlNodeList from xmlTree
     
     @deprecated (should use multicall)
     
     INTERFACE:
     this.removeNodeList(xmlNodeList);
     ************************************/
    this.removeNodeList = function(xmlNodeList, UndoObj){
        //if(xpath) xmlNode = xmlNode.selectSingleNode(xpath);
        
        for (var rData = [], i = 0; i < xmlNodeList.length; i++) { //This can be optimized by looping nearer to xmlUpdate
            //ActionTracker Support
            if (UndoObj) {
                rData.push({
                    pNode      : xmlNodeList[i].parentNode,
                    removedNode: xmlNodeList[i],
                    beforeNode : xmlNodeList[i].nextSibling
                });
            }
            
            //Apply Changes
            this.applyChanges("remove", xmlNodeList[i], UndoObj);
            var p = xmlNodeList[i].parentNode;
            p.removeChild(xmlNodeList[i]);
            this.applyChanges("redo-remove", xmlNodeList[i], null, p);//UndoObj
        }
        
        if (UndoObj) 
            UndoObj.removeList = rData;
        
        // #ifdef __WITH_RSB
        this.applyRSB(["removeNodeList", xmlNodeList, null], UndoObj);
        // #endif
    }
    
    /* ************************************************************
     Data-Binding: Applying Changes
     *************************************************************/
    /* ******** APPLYCHANGES  ***********
     Looks for listeners and execute their __xmlUpdate methods
     
     INTERFACE:
     this.applyChanges(xmlNode);
     ****************************/
    this.applyChanges = function(action, xmlNode, UndoObj, nextloop){
        //Set Variables
        var oParent  = nextloop;
        var loopNode = (xmlNode.nodeType == 1 ? xmlNode : xmlNode.parentNode);
        var hash     = {};
        
        while (loopNode && loopNode.nodeType != 9) {
            //Get List of Node listeners ID's
            var listen = loopNode.getAttribute(this.xmlListenTag);
            
            if (listen) {
                var ids = listen.split(";");
                
                //Loop through ID List and call for xmlUpdate
                for (var i = 0; i < ids.length; i++) {
                    if (hash[ids[i]]) continue;
                    
                    hash[ids[i]] = true;
                    
                    var o = jpf.lookup(ids[i]);
                    if (o) {
                        //Check if component is just waiting for data to become available
                        if (o.listenRoot) {
                            var model = o.getModel();
                            
                            //#ifdef __DEBUG
                            if (!model) 
                                throw new Error(0, jpf.formatErrorString(this, "Notifying Component of data change", "Component without a model is listening for changes", this.jml));
                            //#endif
                            
                            var xpath   = model.getXpathByJmlNode(o);
                            var XMLRoot = xpath
                                ? model.data.selectSingleNode(xpath)
                                : model.data;
                            if (XMLRoot) {
                                jpf.XMLDatabase.removeNodeListener(o.listenRoot, o);
                                o.listenRoot = null;
                                o.load(XMLRoot);
                            }
                            continue;
                        }
                        
                        //Update xml data
                        o.__xmlUpdate(action, xmlNode, loopNode, UndoObj, oParent);
                    }
                }
            }
            
            //Go one level up
            loopNode = loopNode.parentNode || nextloop;
            if (loopNode == nextloop) 
                nextloop = null;
        }
        
        if (UndoObj) 
            UndoObj.xmlNode = xmlNode;
        //if(UndoObj) alert(UndoObj.xmlNode.xml);
    }
    
    this.notifyListeners = function(xmlNode){
        //This should be done recursive
        var listen = xmlNode.getAttribute(jpf.XMLDatabase.xmlListenTag);
        if (listen) {
            listen = listen.split(";");
            for (var j = 0; j < listen.length; j++) {
                jpf.lookup(listen[j]).__xmlUpdate("synchronize", xmlNode, xmlNode);
                //load(xmlNode);
            }
        }
    }
    
    // #ifdef __WITH_RSB
    /**
     * Sents Message through transport to tell remote databound listeners
     * that data has been changed
     */
    this.applyRSB = function(args, UndoObj){
        if(this.disableRSB) return;
        
        var model = jpf.NameServer.get("model", jpf.XMLDatabase.getXmlDocId(args[1]));
        if (!model) {
            //#ifdef __DEBUG
            jpf.issueWarning(0, "Could not find model for Remote SmartBinding connection, not sending change");
            //#endif
            return;
        }
        
        if (!model.rsb) return;
        
        // ActionTracker Support
        if (UndoObj){
            UndoObj.rsb_model = model;
            UndoObj.rsb_args = args;
        }
        // Or sent Socket call
        else
            model.rsb.sendChange(args, model);
            
    }
    //#endif
    
    this.copyConnections = function(fromNode, toNode){
        //This should copy recursive
        try {
            toNode.setAttribute(this.xmlListenTag, fromNode.getAttribute(this.xmlListenTag));
            toNode.setAttribute(this.xmlIdTag, fromNode.getAttribute(this.xmlIdTag));
        } 
        catch (e) {}
    }
    
    this.clearConnections = function(xmlNode){
        try {
            var i, nodes = xmlNode.selectNodes("descendant-or-self::node()[@" + this.xmlListenTag + "]");
            
            for (i = nodes.length - 1; i >= 0; i--) 
                nodes[i].removeAttributeNode(nodes[i].getAttributeNode(this.xmlListenTag));
            nodes = xmlNode.selectNodes("descendant-or-self::node()[@" + this.xmlIdTag + "]");
            for (i = nodes.length - 1; i >= 0; i--) 
                nodes[i].removeAttributeNode(nodes[i].getAttributeNode(this.xmlIdTag));
            nodes = xmlNode.selectNodes("descendant-or-self::node()[@" + this.xmlDocTag + "]");
            for (i = nodes.length - 1; i >= 0; i--) 
                nodes[i].removeAttributeNode(nodes[i].getAttributeNode(this.xmlDocTag));
            nodes = xmlNode.selectNodes("descendant-or-self::node()[@j_loaded]");
            for (i = nodes.length - 1; i >= 0; i--) 
                nodes[i].removeAttributeNode(nodes[i].getAttributeNode("j_loaded"));
            // #ifdef __DEBUG
            //var nodes = xmlNode.selectNodes("descendant-or-self::node()[@j_selection]");
            //for(var i=nodes.length-1;i>=0;i--) nodes[i].removeAttributeNode(nodes[i].getAttributeNode("j_selection"));
            // #endif
        }
        catch (e) {}
        
        return xmlNode;
    }
    
    this.serializeNode = function(xmlNode){
        return this.clearConnections(xmlNode.cloneNode(true)).xml;
    }
    
    /* ******** UNBIND ***********
     Unbind all Javeline Elements from a certain Form
     
     INTERFACE:
     this.unbind(frm);
     ****************************/
    this.unbind = function(frm){
        //Loop through objects of all jpf
        for (var lookup = {}, i = 0; i < frm.jpf.all.length; i++) 
            if (frm.jpf.all[i] && frm.jpf.all[i].unloadBindings) 
                lookup[frm.jpf.all[i].unloadBindings()] = true;
        
        //Remove Listen Nodes
        for (var k = 0; k < xmlDocLut.length; k++) {
            //#ifdef __SUPPORT_Safari
            if (!xmlDocLut[k]) continue;
            //#endif
            
            var Nodes = xmlDocLut[k].selectNodes("//self::node()[@"
                + this.xmlListenTag + "]");
            
            //Loop through Nodes and rebuild listen array
            for (var i = 0; i < Nodes.length; i++) {
                var listen = Nodes[i].getAttribute(this.xmlListenTag).split(";");
                for (var nListen = [], j = 0; j < listen.length; j++) 
                    if (!lookup[listen[j]]) 
                        nListen.push(listen[j]);
                
                //Optimization??
                if (nListen.length != listen.length) 
                    Nodes[i].setAttribute(this.xmlListenTag, nListen.join(";"));
            }
        }
    }
    
    /* ************************************************************
     Skin-Binding - EXEC
     *************************************************************/
    //Currently only supports a single node
    this.selectNodes = function(sExpr, contextNode){
        if (jpf.hasXPathHtmlSupport || !contextNode.style) 
            return contextNode.selectNodes(sExpr); //IE55
        //if(contextNode.ownerDocument != document) return contextNode.selectNodes(sExpr);
        
        return jpf.XPath.selectNodes(sExpr, contextNode)
    }
    
    this.selectSingleNode = function(sExpr, contextNode){
        if (jpf.hasXPathHtmlSupport || !contextNode.style) 
            return contextNode.selectSingleNode(sExpr); //IE55
        //if(contextNode.ownerDocument != document) return contextNode.selectSingleNode(sExpr);
        
        var nodeList = this.selectNodes(sExpr + (jpf.isIE ? "" : "[1]"),
            contextNode ? contextNode : null);
        return nodeList.length > 0 ? nodeList[0] : null;
    }
    
    /* ************************************************************
     General XML Handling
     *************************************************************/
    
    this.createNodeFromXpath = function(contextNode, xPath, addedNodes){
        var xmlNode, foundpath = "", paths = xPath.split("/");
        if (xmlNode = contextNode.selectSingleNode(xPath)) 
            return xmlNode;
        
        for (var addedNode, isAdding = false, i = 0; i < paths.length - 1; i++) {
            if (!isAdding && contextNode.selectSingleNode(foundpath
              + (i != 0 ? "/" : "") + paths[i])) {
                foundpath += (i != 0 ? "/" : "") + paths[i];
                continue;
            }
            
            //	#ifdef __DEBUG
            if (paths[i].match(/\@|\[.*\]|\(.*\)/)) 
                throw new Error(1041, jpf.formatErrorString(1041, this, "Select via xPath", "Could not use xPath to create xmlNode: " + xPath));
            if (paths[i].match(/\/\//)) 
                throw new Error(1041, jpf.formatErrorString(1041, this, "Select via xPath", "Could not use xPath to create xmlNode: " + xPath));
            // #endif
            
            isAdding = true;
            addedNode = contextNode.selectSingleNode(foundpath)
                .appendChild(contextNode.ownerDocument.createElement(paths[i]));
            
            if (addedNodes)
                addedNodes.push(addedNode);
            foundpath += paths[i] + "/";
        }
        
        if (!foundpath) 
            foundpath = ".";
        
        var lastpath = paths[paths.length - 1];
        if (lastpath.match(/^\@(.*)$/)) {
            var attrNode = contextNode.ownerDocument.createAttribute(RegExp.$1);
            contextNode.selectSingleNode(foundpath).setAttributeNode(attrNode);
            return attrNode;
        }
        else if (lastpath.trim() == "text()") 
            return contextNode.selectSingleNode(foundpath)
                .appendChild(contextNode.ownerDocument.createTextNode(""));
        else 
            return contextNode.selectSingleNode(foundpath)
                .appendChild(contextNode.ownerDocument.createElement(lastpath));
    }
    
    this.getXmlDocId = function(xmlNode, model){
        var docId = (xmlNode.ownerDocument.documentElement || xmlNode)
            .getAttribute(this.xmlDocTag) || xmlDocLut.indexOf(xmlNode.ownerDocument);
        
        if (docId && docId > -1)
            return docId;
        
        docId = xmlDocLut.push(xmlNode.ownerDocument.documentElement
            || xmlNode.ownerDocument || xmlNode) - 1;
        if (xmlNode.ownerDocument.documentElement) 
            xmlNode.ownerDocument.documentElement.setAttribute(this.xmlDocTag, docId);
        
        if (model)
            jpf.NameServer.register("model", docId, model);
        
        return xmlDocLut.length - 1;
    }
    
    this.getBindXmlNode = function(xmlRootNode){
        if (typeof xmlRootNode != "object") 
            xmlRootNode = jpf.getObject("XMLDOM", xmlRootNode);
        if (xmlRootNode.nodeType == 9) 
            xmlRootNode = xmlRootNode.documentElement;
        if (xmlRootNode.nodeType == 3 || xmlRootNode.nodeType == 4) 
            xmlRootNode = xmlRootNode.parentNode;
        if (xmlRootNode.nodeType == 2) 
            xmlRootNode = xmlRootNode.selectSingleNode("..");
        
        return xmlRootNode;
    }
    
    this.convertMethods = {
        /**
         * Gets a JSON object containing all the name/value pairs of the components 
         * using this component as it's validation group.
         *
         * @return  {Object}  the created JSON object
         */
        "json": function(xml){
            var result = {}, filled = false, nodes = xml.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1) 
                    continue;
                var name = nodes[i].tagName;
                filled = true;
                
                //array
                var sameNodes = xml.selectNodes(x);
                if (sameNodes.length > 1) {
                    var z = [];
                    for (var j = 0; j < sameNodes.length; j++) {
                        z.push(this.json(sameNodes[j], result));
                    }
                    result[name] = z;
                } else //single value
                    result[name] = this.json(sameNodes[j], result);
            }
            
            return filled ? result : jpf.getXmlValue(xml, "text()");
        },
        
        "cgivars": function(xml, basename){
            var str = [], filled = false, nodes = xml.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1) continue;
                var name = nodes[i].tagName;
                filled = true;
                
                //array
                var sameNodes = xml.selectNodes(name);
                if (sameNodes.length > 1) {
                    for (var j = 0; j < sameNodes.length; j++) {
                        str.push(this.cgivars(sameNodes[j],
                            (basename ? basename + "." : "") + name + "[" + j + "]"));
                    }
                } else //single value
                    str.push(this.cgivars(nodes[i],
                        (basename ? basename + "." : "") + name));
            }
            
            return filled
                ? str.join("&")
                : (basename || "") + "=" + encodeURIComponent(
                    jpf.getXmlValue(xml, "text()"));
        }
    };
    
    this.convertXml = function(xml, to){
        return this.convertMethods[to](xml);
    }
    
    this.getTextNode = function(x){
        for (var i = 0; i < x.childNodes.length; i++) {
            if (x.childNodes[i].nodeType == 3 || x.childNodes[i].nodeType == 4) 
                return x.childNodes[i];
        }
        return false;
    }
    
    this.getAllNodesBefore = function(pNode, xpath, xmlNode, func){
        var nodes = jpf.XMLDatabase.selectNodes(xpath, pNode);
        for (var found = false, result = [], i = nodes.length - 1; i >= 0; i--) {
            if (!found){
                if(nodes[i] == xmlNode) found = true;
                continue;
            }
            
            result.push(nodes[i]);
            if (func)
                func(nodes[i]);
        }
        return result;
    }
    
    this.getAllNodesAfter = function(pNode, xpath, xmlNode, func){
        var nodes = jpf.XMLDatabase.selectNodes(xpath, pNode);
        for (var found = false, result = [], i = 0; i < nodes.length; i++) {
            if (!found){
                if(nodes[i] == xmlNode) found = true;
                continue;
            }
            
            result.push(nodes[i]);
            if (func) func(nodes[i]);
        }
        return result;
    }
    
    this.clearBoundValue = function(jmlNode, xmlRoot, applyChanges){
        if (!xmlRoot && !jmlNode.XMLRoot) 
            return;
        
        var xmlNode = (jmlNode.nodeType == GUI_NODE)
            ? xmlRoot.selectSingleNode(jmlNode.getAttribute("ref"))
            : jmlNode.getNodeFromRule("value", jmlNode.XMLRoot);
        
        if (xmlNode) 
            this.setNodeValue(xmlNode, "", applyChanges);
    }
    
    this.getBoundValue = function(jmlNode, xmlRoot, applyChanges){
        if (!xmlRoot && !jmlNode.XMLRoot) 
            return "";
        
        var xmlNode = (jmlNode.nodeType == 1)
            ? xmlRoot.selectSingleNode(jmlNode.getAttribute("ref"))
            : jmlNode.getNodeFromRule("value", jmlNode.XMLRoot);
        
        return xmlNode ? this.getNodeValue(xmlNode) : "";
    }
    
    this.getArrayFromNodelist = function(nodelist){
        for (var nodes = [], j = 0; j < nodelist.length; j++) 
            nodes.push(nodelist[j]);
        return nodes;
    }
}

jpf.Init.run('XMLDatabaseImplementation');

//#endif
