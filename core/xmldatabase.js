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
 * xmldb object is the local storage for XML data.
 * This object routes all change requests to synchronize data with representation.
 * It also has many utility methods which makes dealing with XML a lot nicer.
 *
 * @classDescription		This class creates a new xmldatabase
 * @return {XmlDatabase} Returns a new xmldatabase
 * @type {XmlDatabase}
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.XmlDatabase = function(){
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
    };
    
    /**
     * @private
     */
    this.getNode = function(htmlNode){
        if (!htmlNode || !htmlNode.getAttribute(this.htmlIdTag)) 
            return false;

        return this.getElementById(htmlNode.getAttribute(this.htmlIdTag)
            .split("\|", 2).join("|"));
    };
    
    /**
     * @private
     */
    this.getNodeById = function(id, doc){
        var q = id.split("\|");
        q.pop();
        return this.getElementById(q.join("|"), doc);//id.split("\|", 2).join("|")
    };
    
    /**
     * @private
     */
    this.getDocumentById = function(id){
        return xmlDocLut[id];
    };
    
    /**
     * @private
     */
    this.getDocument = function(node){
        return xmlDocLut[node.getAttribute(this.xmlIdTag).split("\|")[0]];
    };
    
    /**
     * @private
     */
    this.getID = function(xmlNode, o){
        return xmlNode.getAttribute(this.xmlIdTag) + "|" + o.uniqueId;
    };
    
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
    };
    
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

        var loopnode = childnode.parentNode;
        while(loopnode){
            if(loopnode == pnode)
                return true;
            loopnode = loopnode.parentNode;
        }

        return false;
    };
    
    this.isOnlyChild = function(node, nodeType){
        if (!node || !node.parentNode || nodeType && nodeType.indexOf(node.nodeType) == -1)
            return false;
        
        var i, l, cnode, nodes = node.parentNode.childNodes;
        for (i = 0, l = nodes.length; i < l; i++) {
            cnode = nodes[i];
            if (cnode.nodeType == 1 && cnode != node)
                return false;
            if (cnode.nodeType == 3 && !cnode.nodeValue.trim())
                return false;
        }
        
        return true;
    };
    
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
            if (xmlNode == oComp.xmlRoot) 
                return null;

            xmlNode = xmlNode.parentNode;
        }
        while (xmlNode && xmlNode.nodeType != 9)
        
        return null;
    };
    
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
                return htmlNode.host.xmlRoot;

            htmlNode = htmlNode.parentNode;
        }
        if (!htmlNode || htmlNode.nodeType != 1) 
            return false;
        
        if (htmlNode.tagName.toLowerCase() == "body") 
            return false;
        
        return this.getNode(htmlNode);
    };
    
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
    };
    
    /**
     * @private
     */
    this.getModel = function(name){
        return jpf.nameserver.get("model", name);
    };
    
    /**
     * @private
     */
    this.setModel = function(model){
        jpf.nameserver.register("model", model.data.ownerDocument
            .documentElement.getAttribute(this.xmlDocTag), model);
    };
    
    /**
     * @private
     */
    this.findModel = function(xmlNode){
        return this.getModel(xmlNode.ownerDocument
            .documentElement.getAttribute(this.xmlDocTag));
    };
    
    /**
     * Creates an XML node from an string containing serialized XML.
     *
     * @param  {String}  strXml   required  String contining serialized XML.
     * @param  {Boolean}  no_error  optional  When set to true no exception is thrown when invalid XML is detected.
     * @return  {XMLNode}  the created XML node
     */
    this.getXml = function(strXml, no_error, preserveWhiteSpace){
        return jpf.getXmlDom(strXml, no_error, preserveWhiteSpace).documentElement;
    };
    
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

        var xmlId = xmlNode.getAttribute(this.xmlIdTag) || documentId 
                        + "|" + ++this.nodeCount[documentId];
        xmlNode.setAttribute(this.xmlIdTag, xmlId);
        
        if (!o) 
            return xmlId;
        
        var htmlId = xmlId + "|" + o.uniqueId;
        if (htmlNode) 
            htmlNode.setAttribute(this.htmlIdTag, htmlId);
        
        return htmlId;
    };
    
    /**
     * @private
     */
    this.addNodeListener = function(xmlNode, o){
        // #ifdef __DEBUG
        if (!o.$xmlUpdate) 
            throw new Error(jpf.formatErrorString(1040, null, "Adding Node listener", "Cannot attach this listener because it doesn't support the correct interface (__xmlUpdate)."));
        // #endif
        
        var listen = xmlNode.getAttribute(this.xmlListenTag);
        var nodes  = (listen ? listen.split(";") : []);
        
        if (!nodes.contains(o.uniqueId)) 
            nodes.push(o.uniqueId);
        xmlNode.setAttribute(this.xmlListenTag, nodes.join(";"));
        
        return xmlNode;
    };
    
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
    };
    
    // #ifdef __WITH_VIRTUALVIEWPORT
    //Does this need to be a seperate function??
    this.clearVirtualDataset = function(parentNode){
        var nodes = parentNode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--)
            parentNode.removeChild(nodes[i]);
    };
    
    this.createVirtualDataset = function(xmlNode, length, docId) {
        var marker = xmlNode.selectSingleNode("j_marker") || xmlNode.appendChild(xmlNode.ownerDocument.createElement("j_marker"));
        marker.setAttribute("start", "0");
        
        if (length) {
            marker.setAttribute("end",   length);
            marker.setAttribute("reserved", ++this.nodeCount[docId]);
            this.nodeCount[docId] += length;
        }
    };
    //#endif
    
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
            var reserved, beforeNode, nodes, doc, i, l, marker = options.marker;
            if (!marker){
                //optionally find marker
            }
            
            //This code assumes that the dataset fits inside this marker
            
            //Start of marker
            if (marker.getAttribute("start") - options.start == 0) {
                marker.setAttribute("start", options.start + options.length);
                reserved = parseInt(marker.getAttribute("reserved"));
                marker.setAttribute("reserved", reserved + options.length);
                beforeNode = marker;
            }
            //End of marker
            else if (options.start + options.length == marker.getAttribute("end")) {
                marker.setAttribute("end", options.start + options.length);
                beforeNode = marker.nextSibling;
                reserved = parseInt(marker.getAttribute("reserved")) + parseInt(marker.getAttribute("end")) - options.length;
            }
            //Middle of marker
            else {
                var m2 = marker.parentNode.insertBefore(marker.cloneNode(true), marker);
                m2.setAttribute("end", options.start - 1);
                marker.setAttribute("start", options.start + options.length);
                reserved = parseInt(marker.getAttribute("reserved"));
                marker.setAttribute("reserved", reserved + options.length);
                beforeNode = marker;
            }
            
            nodes = XMLRoot.childNodes;
            
            if (parentNode.ownerDocument.importNode) {
                doc = parentNode.ownerDocument;
                for (i = 0, l = nodes.length; i < l; i++) {
                    parentNode.insertBefore(doc.importNode(nodes[i], true), beforeNode)
                      .setAttribute(this.xmlIdTag, options.documentId + "|" + (reserved + i));
                }
            }
            else {
                for (i = nodes.length - 1; i >= 0; i--) {
                    parentNode.insertBefore(nodes[0], beforeNode)
                      .setAttribute(this.xmlIdTag, options.documentId + "|" + (reserved + i));
                }
            }
        }
        else
        // #endif
        {
            beforeNode = jpf.getNode(parentNode, [0]);
            nodes      = XMLRoot.childNodes;
            
            if (parentNode.ownerDocument.importNode) {
                doc = parentNode.ownerDocument;
                for (i = 0, l = nodes.length; i < l; i++)
                    parentNode.insertBefore(doc.importNode(nodes[i], true), beforeNode);
            }
            else 
                for (i = nodes.length - 1; i >= 0; i--)
                    parentNode.insertBefore(nodes[0], beforeNode);
        }
        
        if (options.copyAttributes) {
            var attr = XMLRoot.attributes;
            for (i = 0; i < attr.length; i++)
                if (attr[i].nodeName != this.xmlIdTag) 
                    parentNode.setAttribute(attr[i].nodeName, attr[i].nodeValue);
        }
        
        return parentNode;
    };
    
    /**
     * @private
     * @description  Integrates current xmldb with parent xmldb
     *
     *	- assuming transparency of XMLDOM elements cross windows
     *	  with no performence loss.
     */
    this.synchronize = function(){
        this.forkRoot.parentNode.replaceChild(this.root, this.forkRoot);
        this.parent.applyChanges("synchronize", this.root);
    };
    
    this.copyNode = function(xmlNode){
        return this.clearConnections(xmlNode.cloneNode(true));
    };
    
    this.setNodeValue = function(xmlNode, nodeValue, applyChanges){
        if (xmlNode.nodeType == 1) {
            if (!xmlNode.firstChild) 
                xmlNode.appendChild(xmlNode.ownerDocument.createTextNode("-"));

            xmlNode.firstChild.nodeValue = jpf.isNot(nodeValue) ? "" : nodeValue;
            
            if (applyChanges) 
                jpf.xmldb.applyChanges("synchronize", xmlNode);
        }
        else {
            xmlNode.nodeValue = jpf.isNot(nodeValue) ? "" : nodeValue;
            
            if (applyChanges) 
                jpf.xmldb.applyChanges("synchronize", xmlNode.parentNode 
                    || xmlNode.ownerElement || xmlNode.selectSingleNode(".."));
        }
    };
    
    this.getNodeValue = function(xmlNode){
        if (!xmlNode) 
            return "";
        return xmlNode.nodeType == 1
            ? (!xmlNode.firstChild ? "" : xmlNode.firstChild.nodeValue)
            : xmlNode.nodeValue;
    };
    
    this.getInheritedAttribute = function(xml, attr, func){
        var result;
        
        while (xml && xml.nodeType != 11 && xml.nodeType != 9
          && !(result = attr && xml.getAttribute(attr) || func && func(xml))) {
            xml = xml.parentNode;
        }
        
        return !result && attr && jpf.appsettings
            ? jpf.appsettings.tags[attr]
            : result;
    };
    
    /**
     * Set nodeValue of Text Node. If Node doesn't exist it is created.
     * Optionally xpath statement is executed to identify textnode.
     */
    this.setTextNode = function(pnode, value, xpath, UndoObj){
        var tNode;
        
        if (xpath) {
            tNode = pnode.selectSingleNode(xpath);
            if (!tNode) 
                return;
            pnode = tNode.nodeType == 1 ? tNode : null;
        }
        if (pnode || !tNode) {
            tNode = pnode.selectSingleNode("text()");
            
            if (!tNode) 
                tNode = pnode.appendChild(pnode.ownerDocument.createTextNode(""));//createCDATASection
        }
        
        //Action Tracker Support
        if (UndoObj)
            UndoObj.extra.oldValue = tNode.nodeValue;
        
        //Apply Changes
        tNode.nodeValue = value;
        
        this.applyChanges("text", tNode.parentNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["setTextNode", pnode, value, xpath], UndoObj);
        // #endif
    };
    
    /**
     * Sets attribute of node.
     * Optionally xpath statement is executed to identify attribute node
     */
    this.setAttribute = function(xmlNode, name, value, xpath, UndoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;
        
        //Apply Changes
        (xpath ? xmlNode.selectSingleNode(xpath) : xmlNode).setAttribute(name, value);
        this.applyChanges("attribute", xmlNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["setAttribute", xmlNode, name, value, xpath], UndoObj);
        // #endif
    };
    
    /**
     * Removes attribute of node.
     * Optionally xpath statement is executed to identify attribute node
     */
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
    };
    
    /**
     * Replace one node with another
     * Optionally xpath statement is executed to identify attribute node
     */
    this.replaceNode = function(oldNode, newNode, xpath, UndoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;
        
        //Apply Changes
        if (xpath)
            oldNode = oldNode.selectSingleNode(xpath);
        
        //Action Tracker Support
        if (UndoObj)
            UndoObj.oldNode = oldNode;
        
        oldNode.parentNode.replaceChild(newNode, oldNode);
        this.copyConnections(oldNode, newNode);
        
        this.applyChanges("replacechild", newNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["replaceChild", oldNode, newNode, xpath], UndoObj);
        // #endif
    };
    
    /**
     * Creates a new node under pnode before beforeNode or as last node.
     * Optionally xpath statement is executed to identify parentNode node
     */
    this.addChildNode = function(pnode, tagName, attr, beforeNode, xpath, UndoObj){
        //Create New Node
        var xmlNode = pnode.insertBefore(pnode.ownerDocument.createElement(tagName), beforeNode);
        
        //Set Attributes
        for (var i = 0; i < attr.length; i++) 
            xmlNode.setAttribute(attr[i][0], attr[i][1]);
        
        //Action Tracker Support
        if (UndoObj) 
            UndoObj.extra.addedNode = xmlNode;
        
        this.applyChanges("add", xmlNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["addChildNode", pnode, tagName, attr, beforeNode, xpath], UndoObj);
        // #endif
        
        return xmlNode;
    };
    
    /**
     * Appends xmlNode to pnode and before beforeNode or as last node
     * Optionally set bool unique to make sure node is unique under parent
     * Optionally xpath statement is executed to identify parentNode node
     */
    this.appendChild = function(pnode, xmlNode, beforeNode, unique, xpath, UndoObj){
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
        this.applyRSB(["appendChild", pnode, xmlNode.xml, beforeNode, unique, xpath], UndoObj);
        // #endif
        
        return xmlNode;
    };
    
    /**
     * Moves xmlNode to pnode and before beforeNode or as last node
     */
    this.moveNode = function(pnode, xmlNode, beforeNode, xpath, UndoObj){
        //Action Tracker Support
        if (!UndoObj) 
            UndoObj = {};
        UndoObj.extra.pNode      = xmlNode.parentNode;
        UndoObj.extra.beforeNode = xmlNode.nextSibling;
        UndoObj.extra.toPnode    = (xpath ? pnode.selectSingleNode(xpath) : pnode);
        
        this.applyChanges("move-away", xmlNode, UndoObj);
        
        // #ifdef __WITH_RSB
        this.applyRSB(["moveNode", pnode, xmlNode, beforeNode, xpath], UndoObj); //note: important that transport of rsb is async
        // #endif
        
        //Set new id if the node change document (for safari this should be fixed)
        if (!jpf.isSafari
          && jpf.xmldb.getXmlDocId(xmlNode) != jpf.xmldb.getXmlDocId(pnode)) {
            xmlNode.removeAttributeNode(xmlNode.getAttributeNode(this.xmlIdTag));
            this.nodeConnect(jpf.xmldb.getXmlDocId(pnode), xmlNode);
        }
        
        if (jpf.isSafari && pnode.ownerDocument != xmlNode.ownerDocument) 
            xmlNode = pnode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes

        UndoObj.toPnode.insertBefore(xmlNode, beforeNode);
        this.applyChanges("move", xmlNode, UndoObj);
    };
    
    /**
     * Removes xmlNode from xmlTree
     * Optional xpath statement identifies xmlNode
     */
    this.removeNode = function(xmlNode, xpath, UndoObj){
        if (xpath) 
            xmlNode = xmlNode.selectSingleNode(xpath);
        
        //ActionTracker Support
        if (UndoObj) {
            UndoObj.extra.pNode       = xmlNode.parentNode;
            UndoObj.extra.removedNode = xmlNode;
            UndoObj.extra.beforeNode  = xmlNode.nextSibling;
        }
        
        // #ifdef __WITH_RSB
        this.applyRSB(["removeNode", xmlNode, xpath], UndoObj); //note: important that transport of rsb is async
        // #endif
        
        //Apply Changes
        this.applyChanges("remove", xmlNode, UndoObj);
        var p = xmlNode.parentNode;
        p.removeChild(xmlNode);
        this.applyChanges("redo-remove", xmlNode, null, p);//UndoObj
    };
    
    /**
     * Removes xmlNodeList from xmlTree
     * 
     * @deprecated (should use multicall)
     */
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
            UndoObj.extra.removeList = rData;
        
        // #ifdef __WITH_RSB
        this.applyRSB(["removeNodeList", xmlNodeList, null], UndoObj);
        // #endif
    };
    
    /**
     * Looks for listeners and executes their __xmlUpdate methods
     */
    var notifyQueue = {}, notifyTimer;
    this.applyChanges = function(action, xmlNode, UndoObj, nextloop){
        //#ifdef __WITH_OFFLINE
        if (jpf.offline.models.enabled && jpf.offline.models.realtime) {
            var model = jpf.nameserver.get("model", jpf.xmldb.getXmlDocId(xmlNode));
            if (model) jpf.offline.models.markForUpdate(model);
        }
        //#endif
        
        //Set Variables
        var oParent  = nextloop;
        var loopNode = (xmlNode.nodeType == 1 ? xmlNode : xmlNode.parentNode);
        
        var xmlId = xmlNode.getAttribute(this.xmlIdTag);
        
        if ("|remove|move-away|".indexOf("|" + action + "|") > -1)
            this.notifyQueued(); //empty queue
        
        var listen, uIds, i, j, hash, info, jmlNode, runTimer, found;
        while (loopNode && loopNode.nodeType != 9) {
            //Get List of Node listeners ID's
            listen = loopNode.getAttribute(this.xmlListenTag);
            
            if (listen) {
                uIds = listen.split(";");
                
                for (i = 0; i < uIds.length; i++) {
                    hash = notifyQueue[uIds[i]];
                    if (!hash)
                        notifyQueue[uIds[i]] = hash = [];
                    
                    // Filtering
                    if ("|update|attribute|text|".indexOf("|" 
                      + action + "|") > -1) {
                        found = false;
                        for (j = 0; j < hash.length; j++) {
                            if (hash[j] && xmlNode == hash[j][1] 
                              && "|update|attribute|text|"
                              .indexOf("|" + hash[j][0] + "|") > -1) {
                                hash[j] = null;
                                found = true;
                                continue;
                            }
                        }
                        
                        hash.push(["update", xmlNode, loopNode, UndoObj, oParent]);
                        runTimer = true;
                        continue;
                    }
                    
                    if ("|remove|move-away|".indexOf("|" + action + "|") > -1) {
                        jmlNode = jpf.lookup(uIds[i]);
                        if (jmlNode)
                            jmlNode.$xmlUpdate(action, xmlNode, 
                                loopNode, UndoObj, oParent);
                    }
                    else {
                        hash.push([action, xmlNode, loopNode, UndoObj, oParent]);
                        runTimer = true;
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
        
        if (runTimer) {
            clearTimeout(notifyTimer);
            notifyTimer = setTimeout(function(){
                jpf.xmldb.notifyQueued();
            });
        }
    };

    /*
        @todo in actiontracker - add stack auto purging
              - when undo item is purged which was a removed, remove cache item
        @todo shouldn't the removeNode method remove all listeners?
    */
    this.notifyQueued = function(){
        for (var uId in notifyQueue) {
            var q = notifyQueue[uId];
            jmlNode = jpf.lookup(uId);
            if (!jmlNode)
                continue;
            
            //Check if component is just waiting for data to become available
            if (jmlNode.$listenRoot) {
                var model = o.getModel();
                
                //#ifdef __DEBUG
                if (!model) 
                    throw new Error(jpf.formatErrorString(this, 
                        "Notifying Component of data change", 
                        "Component without a model is listening for changes", 
                        jmlNode.jml));
                //#endif
                
                var xpath   = model.getXpathByJmlNode(jmlNode);
                var xmlRoot = xpath
                    ? model.data.selectSingleNode(xpath)
                    : model.data;
                if (xmlRoot) {
                    jpf.xmldb.removeNodeListener(jmlNode.$listenRoot, jmlNode);
                    jmlNode.$listenRoot = null;
                    jmlNode.load(xmlRoot);
                }
                
                continue;
            }
            
            //Run queue items
            for (var i = 0; i < q.length; i++) {
                if (!q[i])
                    continue;
            
                //Update xml data
                jmlNode.$xmlUpdate.apply(jmlNode, q[i]);
            }
        }
        
        notifyQueue = {}; // update shouldn't add anything to the queue
    }
    
    this.notifyListeners = function(xmlNode){
        //This should be done recursive
        var listen = xmlNode.getAttribute(jpf.xmldb.xmlListenTag);
        if (listen) {
            listen = listen.split(";");
            for (var j = 0; j < listen.length; j++) {
                jpf.lookup(listen[j]).$xmlUpdate("synchronize", xmlNode, xmlNode);
                //load(xmlNode);
            }
        }
    };
    
    // #ifdef __WITH_RSB
    /**
     * Sents Message through transport to tell remote databound listeners
     * that data has been changed
     */
    this.applyRSB = function(args, UndoObj){
        if (this.disableRSB) 
            return;
        
        var xmlNode = args[1] && args[1].length && args[1][0] || args[1];
        var model = jpf.nameserver.get("model", jpf.xmldb.getXmlDocId(xmlNode));
        if (!model) {
            if (!jpf.nameserver.getAll("remove").length)
                return;
            
            //#ifdef __DEBUG
            jpf.console.warn("Could not find model for Remote SmartBinding connection, not sending change");
            //#endif
            return;
        }
        
        if (!model.rsb) return;
        
        // Add the messages to the undo object
        if (UndoObj)
            model.rsb.queueMessage(args, model, UndoObj);
        // Or sent message now
        else
            model.rsb.sendChange(args, model);
            
    };
    //#endif
    
    this.copyConnections = function(fromNode, toNode){
        //This should copy recursive
        try {
            toNode.setAttribute(this.xmlListenTag, fromNode.getAttribute(this.xmlListenTag));
            toNode.setAttribute(this.xmlIdTag, fromNode.getAttribute(this.xmlIdTag));
        } 
        catch (e) {}
    };
    
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
            // var nodes = xmlNode.selectNodes("descendant-or-self::node()[@j_selection]");
            // for (var i = nodes.length - 1; i >= 0; i--)
            //     nodes[i].removeAttributeNode(nodes[i].getAttributeNode("j_selection"));
            // #endif
        }
        catch (e) {}
        
        return xmlNode;
    };
    
    this.serializeNode = function(xmlNode){
        var xml = this.clearConnections(xmlNode.cloneNode(true));
        return xml.xml || xml.serialize();
    };
    
    /**
     * Unbind all Javeline Elements from a certain Form
     */
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
    };
    
    //Currently only supports a single node
    this.selectNodes = function(sExpr, contextNode){
        if (jpf.hasXPathHtmlSupport || !contextNode.style) 
            return contextNode.selectNodes(sExpr); //IE55
        //if (contextNode.ownerDocument != document)
        //    return contextNode.selectNodes(sExpr);
        
        return jpf.XPath.selectNodes(sExpr, contextNode)
    };
    
    this.selectSingleNode = function(sExpr, contextNode){
        if (jpf.hasXPathHtmlSupport || !contextNode.style) 
            return contextNode.selectSingleNode(sExpr); //IE55
        //if (contextNode.ownerDocument != document)
        //    return contextNode.selectSingleNode(sExpr);
        
        var nodeList = this.selectNodes(sExpr + (jpf.isIE ? "" : "[1]"),
            contextNode ? contextNode : null);
        return nodeList.length > 0 ? nodeList[0] : null;
    };
    
    /**** General XML Handling ****/
    
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
                throw new Error(jpf.formatErrorString(1041, this, "Select via xPath", "Could not use xPath to create xmlNode: " + xPath));
            if (paths[i].match(/\/\//)) 
                throw new Error(jpf.formatErrorString(1041, this, "Select via xPath", "Could not use xPath to create xmlNode: " + xPath));
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
    };
    
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
            jpf.nameserver.register("model", docId, model);
        
        return xmlDocLut.length - 1;
    };
    
    this.getBindXmlNode = function(xmlRootNode){
        if (typeof xmlRootNode != "object") 
            xmlRootNode = jpf.getXmlDom(xmlRootNode);
        if (xmlRootNode.nodeType == 9) 
            xmlRootNode = xmlRootNode.documentElement;
        if (xmlRootNode.nodeType == 3 || xmlRootNode.nodeType == 4) 
            xmlRootNode = xmlRootNode.parentNode;
        if (xmlRootNode.nodeType == 2) 
            xmlRootNode = xmlRootNode.selectSingleNode("..");
        
        return xmlRootNode;
    };
    
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
                }
                else //single value
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
                }
            else //single value
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
    };
    
    this.getTextNode = function(x){
        for (var i = 0; i < x.childNodes.length; i++) {
            if (x.childNodes[i].nodeType == 3 || x.childNodes[i].nodeType == 4) 
                return x.childNodes[i];
        }
        return false;
    };
    
    this.getAllNodesBefore = function(pNode, xpath, xmlNode, func){
        var nodes = jpf.xmldb.selectNodes(xpath, pNode);
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
    };
    
    this.getAllNodesAfter = function(pNode, xpath, xmlNode, func){
        var nodes = jpf.xmldb.selectNodes(xpath, pNode);
        for (var found = false, result = [], i = 0; i < nodes.length; i++) {
            if (!found){
                if(nodes[i] == xmlNode) found = true;
                continue;
            }
            
            result.push(nodes[i]);
            if (func) func(nodes[i]);
        }
        return result;
    };
    
    this.clearBoundValue = function(jmlNode, xmlRoot, applyChanges){
        if (!xmlRoot && !jmlNode.xmlRoot) 
            return;
        
        var xmlNode = (jmlNode.nodeFunc == jpf.NODE_VISIBLE)
            ? xmlRoot.selectSingleNode(jmlNode.getAttribute("ref"))
            : jmlNode.getNodeFromRule("value", jmlNode.xmlRoot);
        
        if (xmlNode) 
            this.setNodeValue(xmlNode, "", applyChanges);
    };
    
    this.getBoundValue = function(jmlNode, xmlRoot, applyChanges){
        if (!xmlRoot && !jmlNode.xmlRoot) 
            return "";
        
        var xmlNode = !jmlNode.nodeFunc
            ? xmlRoot.selectSingleNode(jmlNode.getAttribute("ref"))
            : jmlNode.getNodeFromRule("value", jmlNode.xmlRoot);
        
        return xmlNode ? this.getNodeValue(xmlNode) : "";
    };
    
    this.getArrayFromNodelist = function(nodelist){
        for (var nodes = [], j = 0; j < nodelist.length; j++) 
            nodes.push(nodelist[j]);
        return nodes;
    };
};

jpf.getXml = function(){
    return jpf.xmldb.getXml.apply(jpf.xmldb, arguments);
};

jpf.Init.run('XmlDatabase');

//#endif
