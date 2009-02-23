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

//#ifdef __WITH_XMLDATABASE

/**
 * The xml database object provides local storage for xml data. This object
 * routes all changes to the xml data to the data bound objects. It further
 * provides utility functions for xml handling.
 *
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 *
 * @default_private
 */
jpf.XmlDatabase = function(){
    this.xmlDocTag    = "j_doc";
    this.xmlIdTag     = "j_id";
    this.xmlListenTag = "j_listen";
    this.htmlIdTag    = "id";

    var xmlDocLut     = [];

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
     * Gets the child position of a dom node.
     *
     * @param {DOMNode} node the node for which the child position is determined.
     * @return {Number} the child position of the node.
     */
    this.getChildNumber = function(node){
        var p = node.parentNode;
        for (var i = 0; i < p.childNodes.length; i++)
            if (p.childNodes[i] == node)
                return i;
    };

    /**
     * Determines whether a node is a child of another node.
     *
     * @param {DOMNode} pNode      the potential parent element.
     * @param {DOMNode} childnode  the potential child node.
     * @param {Boolean} [orItself] whether the method also returns true when pNode is the childnode.
     * @return  {Number} the child position of the node. Or false if it's not a child.
     */
    this.isChildOf = function(pNode, childnode, orItself){
        if (!pNode || !childnode)
            return false;
        
        if (childnode.nodeType == 2)
            childnode = childnode.selectSingleNode("..");
        
        if (orItself && pNode == childnode)
            return true;

        var loopnode = childnode.parentNode;
        while(loopnode){
            if(loopnode == pNode)
                return true;
            loopnode = loopnode.parentNode;
        }

        return false;
    };

    /**
     * Determines whether a node is it's parent's only child.
     * @param {DOMNode} node     the potential only child.
     * @param {Array}   nodeType list of the node types that this child can be.
     * @returns {Boolean} whether the node is only child and optionally of one of the specified nodeTypes.
     */
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
     * Finds the html representation of an xml node for a certain element.
     *
     * @param {XMLNode} xmlNode  the data element which is represented by the hml element.
     * @param {JMLNode} oComp    the element that has created the representation.
     * @return {HTMLNode} the html node representing the xml node.
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
     * Finds the xml data node that is represented by the html node.
     *
     * @param {HTMLNode} htmlNode  the html node representing the an xml node.
     * @return {XMLNode} the xml data element for which the html node is it's representation.
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
     * Creates an xml node from an xml string.
     *
     * @param {String}  strXml     the xml definition.
     * @param {Boolean} [noError]  whether an exception is thrown the parser throws an error.
     * @return {XMLNode} the created xml node.
     */
    this.getXml = function(strXml, noError, preserveWhiteSpace){
        return jpf.getXmlDom(strXml, noError, preserveWhiteSpace).documentElement;
    };

    this.getXmlId = function(xmlNode){
        return xmlNode.getAttribute(this.xmlIdTag) ||
          this.nodeConnect(jpf.xmldb.getXmlDocId(xmlNode), xmlNode);
    }

    this.nodeCount = {};
    /**
     * @private
     */
    this.nodeConnect = function(documentId, xmlNode, htmlNode, o){
        if (!this.nodeCount[documentId])
            this.nodeCount[documentId] = 0;

        var xmlId;
        xmlId = xmlNode.getAttribute(this.xmlIdTag)
          || xmlNode.setAttribute(this.xmlIdTag, (xmlId = documentId
               + "|" + ++this.nodeCount[documentId])) || xmlId;

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
            throw new Error(jpf.formatErrorString(1040, null, 
                "Adding Node listener", 
                "Cannot attach this listener because it doesn't support the \
                 correct interface (this.$xmlUpdate)."));
        // #endif

        var listen = xmlNode.getAttribute(this.xmlListenTag);
        var nodes  = (listen ? listen.split(";") : []);
        var id = String(o.uniqueId);

        if (!nodes.contains(id)) {
            nodes.push(id);
            xmlNode.setAttribute(this.xmlListenTag, nodes.join(";"));
        }

        return xmlNode;
    };

    /**
     * @todo  Use this function when an element really unbinds from a
     *        piece of data and does not uses it for caching
     * @private
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
    /**
     * @private
     */
    this.clearVirtualDataset = function(parentNode){
        var nodes = parentNode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--)
            parentNode.removeChild(nodes[i]);
    };

    /**
     * @private
     */
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
     * Integrates nodes as children of a parent. Optionally attributes are
     * copied as well.
     *
     * @param {XMLNode} xmlNode the data to integrate.
     * @param {XMLNode} parent  the point of integration.
     * @param {Object}  options
     *   Properties:
     *   {Boolean} [copyAttributes] whether the attributes of xmlNode are copied as well.
     *   {Boolean} [clearContents]  whether the contents of parent is cleared.
     *   {Boolean} [start]          This feature is used for the virtual viewport. More information will follow.
     *   {Boolean} [length]         This feature is used for the virtual viewport. More information will follow.
     *   {Boolean} [documentId]     This feature is used for the virtual viewport. More information will follow.
     *   {Boolean} [marker]         This feature is used for the virtual viewport. More information will follow.
     * @return  {XMLNode}  the created xml node
     */
    this.integrate = function(XMLRoot, parentNode, options){
        if (typeof parentNode != "object")
            parentNode = getElementById(parentNode);

        if (options && options.clearContents) {
            //clean parent
            var nodes = parentNode.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--)
                parentNode.removeChild(nodes[i]);
        }

        // #ifdef __WITH_VIRTUALVIEWPORT
        if (options && options.start) { //Assuming each node is in count
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

        if (options && options.copyAttributes) {
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
     *    - assuming transparency of XMLDOM elements cross windows
     *      with no performence loss.
     */
    this.synchronize = function(){
        this.forkRoot.parentNode.replaceChild(this.root, this.forkRoot);
        this.parent.applyChanges("synchronize", this.root);
    };

    /**
     * Returns a cleaned copy of the passed xml data element.
     *
     * @param {XMLElement} xmlNode the xml element to copy.
     * @return {XMLElement} the copy of the xml element.
     */
    this.copyNode = function(xmlNode){
        return this.clearConnections(xmlNode.cloneNode(true));
    };

    /**
     * Sets the nodeValue of a dom node.
     *
     * @param {XMLElement} xmlNode       the xml node that should receive the nodeValue. When an element node is passed the first text node is set.
     * @param {String}     nodeValue     the value to set.
     * @param {Boolean}    applyChanges  whether the changes are propagated to the databound elements.
     * @param {UndoObj}    undoObj       the undo object that is responsible for archiving the changes.
     */
    this.setNodeValue = function(xmlNode, nodeValue, applyChanges, options){
        var undoObj, xpath, newNodes;
        if (options) {
            undoObj  = options.undoObj;
            xpath    = options.xpath;
            newNodes = options.newNodes;
            
            undoObj.extra.oldValue = options.forceNew
                ? ""
                : jpf.getXmlValue(xmlNode, xpath);

            undoObj.xmlNode        = xmlNode;
            if (xpath)
                xmlNode = jpf.xmldb.createNodeFromXpath(xmlNode, xpath, newNodes, options.forceNew);

            undoObj.extra.appliedNode = xmlNode;
        }
        
        if (xmlNode.nodeType == 1) {
            if (!xmlNode.firstChild)
                xmlNode.appendChild(xmlNode.ownerDocument.createTextNode("-"));

            xmlNode.firstChild.nodeValue = jpf.isNot(nodeValue) ? "" : nodeValue;

            if (applyChanges)
                jpf.xmldb.applyChanges("synchronize", xmlNode, undoObj);
        }
        else {
            xmlNode.nodeValue = jpf.isNot(nodeValue) ? "" : nodeValue;

            if (applyChanges)
                jpf.xmldb.applyChanges("synchronize", xmlNode.parentNode
                    || xmlNode.ownerElement || xmlNode.selectSingleNode(".."),
                    undoObj);
        }
    };

    /**
     * Retrieves the node value of an xml element. When an element node is passed
     * the value of the first text node is returned.
     * @returns {String} the node value found.
     */
    this.getNodeValue = function(xmlNode){
        if (!xmlNode)
            return "";
        return xmlNode.nodeType == 1
            ? (!xmlNode.firstChild ? "" : xmlNode.firstChild.nodeValue)
            : xmlNode.nodeValue;
    };

    /**
     * Retrieves the attribute of an xml node or the first parent node that has
     * that attribute set. If no attribute is set the value is looked for on
     * the appsettings element.
     *
     * @param {XMLElement} xml    the xml node that is the starting point of the search.
     * @param {String}     attr   the name of the attribute.
     * @param {Function}   [func] callback that is run for every node that is searched.
     * @return {String} the found value, or empty string if none was found.
     */
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
     * Sets the value of a text node. If the node doesn't exists it is created.
     * Changes are propagated to the databound elements listening for changes
     * on the data changed.
     *
     * @param {XMLElement} pNode     the parent of the text node.
     * @param {String}     value     the value of the text node.
     * @param {String}     [xpath]   the xpath statement which selects the text node.
     * @param {UndoObj}    [undoObj] the undo object that is responsible for archiving the changes.
     */
    this.setTextNode = function(pNode, value, xpath, undoObj){
        var tNode;

        if (xpath) {
            tNode = pNode.selectSingleNode(xpath);
            if (!tNode)
                return;
            pNode = tNode.nodeType == 1 ? tNode : null;
        }
        if (pNode || !tNode) {
            tNode = pNode.selectSingleNode("text()");

            if (!tNode)
                tNode = pNode.appendChild(pNode.ownerDocument.createTextNode(""));//createCDATASection
        }

        //Action Tracker Support
        if (undoObj)
            undoObj.extra.oldValue = tNode.nodeValue;

        //Apply Changes
        tNode.nodeValue = value;

        this.applyChanges("text", tNode.parentNode, undoObj);

        // #ifdef __WITH_RSB
        this.applyRSB(["setTextNode", pNode, value, xpath], undoObj);
        // #endif
    };

    /**
     * Sets an attribute on a node. Changes are propagated to the databound
     * elements listening for changes on the data changed.
     *
     * @param {XMLElement} xmlNode   the xml node to set the attribute on.
     * @param {String}     name      the name of the attribute.
     * @param {String}     value     the value of the attribute.
     * @param {String}     [xpath]   the xpath statement to select the attribute.
     * @param {UndoObj}    [undoObj] the undo object that is responsible for archiving the changes.
     */
    this.setAttribute = function(xmlNode, name, value, xpath, undoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;
        //Apply Changes
        (xpath ? xmlNode.selectSingleNode(xpath) : xmlNode).setAttribute(name, value);
        this.applyChanges("attribute", xmlNode, undoObj);
        // #ifdef __WITH_RSB
        this.applyRSB(["setAttribute", xmlNode, name, value, xpath], undoObj);
        // #endif
    };

    /**
     * Removes an attribute of an xml node. Changes are propagated to the
     * databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} xmlNode   the xml node to delete the attribute from
     * @param {String}     name      the name of the attribute.
     * @param {String}     [xpath]   the xpath statement to select the attribute.
     * @param {UndoObj}    [undoObj] the undo object that is responsible for archiving the changes.
     */
    this.removeAttribute = function(xmlNode, name, xpath, undoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;

        //Action Tracker Support
        if (undoObj) undoObj.name = name;

        //Apply Changes
        (xpath ? xmlNode.selectSingleNode(xpath) : xmlNode).removeAttribute(name);
        this.applyChanges("attribute", xmlNode, undoObj);

        // #ifdef __WITH_RSB
        this.applyRSB(["removeAttribute", xmlNode, name, xpath], undoObj);
        // #endif
    };

    /**
     * Replace one node with another. Changes are propagated to the
     * databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} oldNode   the xml node to remove.
     * @param {XMLElement} newNode   the xml node to set.
     * @param {String}     [xpath]   the xpath statement to select the attribute.
     * @param {UndoObj}    [undoObj] the undo object that is responsible for archiving the changes.
     */
    this.replaceNode = function(oldNode, newNode, xpath, undoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;

        //Apply Changes
        if (xpath)
            oldNode = oldNode.selectSingleNode(xpath);

        //Action Tracker Support
        if (undoObj)
            undoObj.oldNode = oldNode;

        oldNode.parentNode.replaceChild(newNode, oldNode);
        this.copyConnections(oldNode, newNode);

        this.applyChanges("replacechild", newNode, undoObj);

        // #ifdef __WITH_RSB
        this.applyRSB(["replaceChild", oldNode, newNode, xpath], undoObj);
        // #endif
    };

    /**
     * Creates a new element under a parent xml node. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} pNode       the parent xml node to add the new element to.
     * @param {String}     tagName     the tagName of the xml element to add.
     * @param {Array}      attr        list of the attributes to set. Each item is another array with the name and value.
     * @param {XMLElement} beforeNode  the xml node which indicates the insertion point.
     * @param {String}     [xpath]     the xpath statement to select the attribute.
     * @param {UndoObj}    [undoObj]   the undo object that is responsible for archiving the changes.
     */
    this.addChildNode = function(pNode, tagName, attr, beforeNode, undoObj){
        //Create New Node
        var xmlNode = pNode.insertBefore(pNode.ownerDocument
            .createElement(tagName), beforeNode);

        //Set Attributes
        for (var i = 0; i < attr.length; i++)
            xmlNode.setAttribute(attr[i][0], attr[i][1]);

        //Action Tracker Support
        if (undoObj)
            undoObj.extra.addedNode = xmlNode;

        this.applyChanges("add", xmlNode, undoObj);

        // #ifdef __WITH_RSB
        this.applyRSB(["addChildNode", pNode, tagName, attr, beforeNode], undoObj);
        // #endif

        return xmlNode;
    };

    /**
     * Appends an xml node to a parent. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} pNode       the parent xml node to add the element to.
     * @param {XMLElement} xmlNode     the xml node to insert.
     * @param {XMLElement} beforeNode  the xml node which indicates the insertion point.
     * @param {Boolean}    unique      whether the parent can only contain one element with a certain tagName.
     * @param {String}     [xpath]     the xpath statement to select the parent node.
     * @param {UndoObj}    [undoObj]   the undo object that is responsible for archiving the changes.
     */
    this.appendChild = function(pNode, xmlNode, beforeNode, unique, xpath, undoObj){
        if (unique && pNode.selectSingleNode(xmlNode.tagName))
            return false;

        if (undoObj)
            this.clearConnections(xmlNode);

        if (jpf.isSafari && pNode.ownerDocument != xmlNode.ownerDocument)
            xmlNode = pNode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes

        //Add xmlNode to parent pNode or one selected by xpath statement

        if (xpath) {
            var addedNodes = [];
            var pNode = this.createNodeFromXpath(pNode, xpath, addedNodes);
            if (addedNodes.length) {
                pNode.appendChild(xmlNode);
                while(addedNodes.length) {
                    if (pNode == addedNodes.pop() && addedNodes.length)
                        pNode = pNode.parentNode;
                }
            }
        }

        pNode.insertBefore(xmlNode, beforeNode);

        //detect if xmlNode should be removed somewhere else
        //- [17-2-2004] changed pNode (2nd arg applychange) into xmlNode

        this.applyChanges("add", xmlNode, undoObj);

        // #ifdef __WITH_RSB
        this.applyRSB(["appendChild", pNode, xmlNode.xml, beforeNode, unique, xpath], undoObj);
        // #endif

        return xmlNode;
    };

    /**
     * Moves an xml node to a parent node. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} pNode       the new parent xml node of the node.
     * @param {XMLElement} xmlNode     the xml node to move.
     * @param {XMLElement} beforeNode  the xml node which indicates the insertion point.
     * @param {String}     [xpath]     the xpath statement to select the parent node.
     * @param {UndoObj}    [undoObj]   the undo object that is responsible for archiving the changes.
     */
    this.moveNode = function(pNode, xmlNode, beforeNode, xpath, undoObj){
        //Action Tracker Support
        if (!undoObj)
            undoObj = {extra:{}};

        undoObj.extra.pNode      = xmlNode.parentNode;
        undoObj.extra.beforeNode = xmlNode.nextSibling;
        undoObj.extra.toPnode    = (xpath ? pNode.selectSingleNode(xpath) : pNode);

        this.applyChanges("move-away", xmlNode, undoObj);

        // #ifdef __WITH_RSB
        this.applyRSB(["moveNode", pNode, xmlNode, beforeNode, xpath], undoObj); //note: important that transport of rsb is async
        // #endif

        //Set new id if the node change document (for safari this should be fixed)
        if (!jpf.isSafari
          && jpf.xmldb.getXmlDocId(xmlNode) != jpf.xmldb.getXmlDocId(pNode)) {
            xmlNode.removeAttributeNode(xmlNode.getAttributeNode(this.xmlIdTag));
            this.nodeConnect(jpf.xmldb.getXmlDocId(pNode), xmlNode);
        }

        if (jpf.isSafari && pNode.ownerDocument != xmlNode.ownerDocument)
            xmlNode = pNode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes

        undoObj.extra.toPnode.insertBefore(xmlNode, beforeNode);
        this.applyChanges("move", xmlNode, undoObj);
    };

    /**
     * Removes an xml node from it's parent. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} xmlNode     the xml node to remove from the dom tree.
     * @param {String}     [xpath]     the xpath statement to select the parent node.
     * @param {UndoObj}    [undoObj]   the undo object that is responsible for archiving the changes.
     */
    this.removeNode = function(xmlNode, xpath, undoObj){
        if (xpath)
            xmlNode = xmlNode.selectSingleNode(xpath);

        //ActionTracker Support
        if (undoObj) {
            undoObj.extra.pNode       = xmlNode.parentNode;
            undoObj.extra.removedNode = xmlNode;
            undoObj.extra.beforeNode  = xmlNode.nextSibling;
        }

        // #ifdef __WITH_RSB
        this.applyRSB(["removeNode", xmlNode, xpath], undoObj); //note: important that transport of rsb is async
        // #endif

        //Apply Changes
        this.applyChanges("remove", xmlNode, undoObj);
        var p = xmlNode.parentNode;
        p.removeChild(xmlNode);
        this.applyChanges("redo-remove", xmlNode, null, p);//undoObj
    };

    /**
     * Removes a list of xml nodes from their parent. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {Array}   xmlNodeList list of xml nodes to remove.
     * @param {UndoObj} [undoObj]   the undo object that is responsible for archiving the changes.
     */
    this.removeNodeList = function(xmlNodeList, undoObj){
        //if(xpath) xmlNode = xmlNode.selectSingleNode(xpath);
        for (var rData = [], i = 0; i < xmlNodeList.length; i++) { //This can be optimized by looping nearer to xmlUpdate
            //ActionTracker Support
            if (undoObj) {
                rData.push({
                    pNode      : xmlNodeList[i].parentNode,
                    removedNode: xmlNodeList[i],
                    beforeNode : xmlNodeList[i].nextSibling
                });
            }

            //Apply Changes
            this.applyChanges("remove", xmlNodeList[i], undoObj);
            var p = xmlNodeList[i].parentNode;
            p.removeChild(xmlNodeList[i]);
            this.applyChanges("redo-remove", xmlNodeList[i], null, p);//undoObj
        }

        if (undoObj)
            undoObj.extra.removeList = rData;

        // #ifdef __WITH_RSB
        this.applyRSB(["removeNodeList", xmlNodeList, null], undoObj);
        // #endif
    };

    /**
     * Looks for listeners and executes their __xmlUpdate methods.
     * @private
     */
    var notifyQueue = {}, notifyTimer;
    this.applyChanges = function(action, xmlNode, undoObj, nextloop){
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

        if (!this.delayUpdate && "|remove|move-away|".indexOf("|" + action + "|") > -1)
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

                        hash.push(["update", xmlNode, loopNode, undoObj, oParent]);
                        runTimer = true;
                        continue;
                    }

                    if (!this.delayUpdate && "|remove|move-away|add|".indexOf("|" + action + "|") > -1) {
                        jmlNode = jpf.lookup(uIds[i]);
                        if (jmlNode)
                            jmlNode.$xmlUpdate(action, xmlNode,
                                loopNode, undoObj, oParent);
                    }
                    else {
                        hash.push([action, xmlNode, loopNode, undoObj, oParent]);
                        runTimer = true;
                    }
                }
            }

            //Go one level up
            loopNode = loopNode.parentNode || nextloop;
            if (loopNode == nextloop)
                nextloop = null;
        }

        if (undoObj && !this.delayUpdate) {
            if (!undoObj.xmlNode) //@todo are we sure about this?
                undoObj.xmlNode = xmlNode;

            //Ok this was an action let's not delay execution
            jpf.xmldb.notifyQueued();
        }
        else if (runTimer) {
            clearTimeout(notifyTimer);
            notifyTimer = setTimeout(function(){
                jpf.xmldb.notifyQueued();
            });
        }
    };

    /**
     *  @todo in actiontracker - add stack auto purging
     *        - when undo item is purged which was a removed, remove cache item
     *  @todo shouldn't the removeNode method remove all listeners?
     *  @todo rename to processQueue
     *  @private
     */
    this.notifyQueued = function(){
        clearTimeout(notifyTimer);
        
        for (var uId in notifyQueue) {
            var q = notifyQueue[uId];
            jmlNode = jpf.lookup(uId);
            if (!jmlNode || !q)
                continue;

            //Check if component is just waiting for data to become available
            if (jmlNode.$listenRoot) {
                var model = jmlNode.getModel();

                //#ifdef __DEBUG
                if (!model)
                    throw new Error(jpf.formatErrorString(this,
                        "Notifying Component of data change",
                        "Component without a model is listening for changes",
                        jmlNode.$jml));
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

    /**
     * @private
     */
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
     * @private
     */
    this.applyRSB = function(args, undoObj){
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
        if (undoObj)
            model.rsb.queueMessage(args, model, undoObj);
        // Or sent message now
        else
            model.rsb.sendChange(args, model);

    };
    //#endif

    /**
     * @private
     */
    this.copyConnections = function(fromNode, toNode){
        //This should copy recursive
        try {
            toNode.setAttribute(this.xmlListenTag, fromNode.getAttribute(this.xmlListenTag));
            toNode.setAttribute(this.xmlIdTag, fromNode.getAttribute(this.xmlIdTag));
        }
        catch (e) {}
    };

    /**
     * @private
     */
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

    /**
     * Returns a string version of the xml data element.
     *
     * @param {XMLElement} xmlNode the xml element to serialize.
     * @return {String} the serilized version of the xml element.
     */
    this.serializeNode = function(xmlNode){
        var xml = this.clearConnections(xmlNode.cloneNode(true));
        return xml.xml || xml.serialize();
    };

    /**
     * Unbind all Javeline Elements from a certain Form
     * @private
     */
    this.unbind = function(frm){
        //Loop through objects of all jpf
        for (var lookup = {}, i = 0; i < frm.jpf.all.length; i++)
            if (frm.jpf.all[i] && frm.jpf.all[i].unloadBindings)
                lookup[frm.jpf.all[i].unloadBindings()] = true;

        //Remove Listen Nodes
        for (var k = 0; k < xmlDocLut.length; k++) {
            //#ifdef __SUPPORT_SAFARI
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

    /**
     * Executes an xpath expression on any dom node. This is especially useful
     * for dom nodes that don't have a good native xpath processor such as html
     * in some versions of internet explorer and xml in webkit.
     *
     * @param {String}  sExpr        the xpath expression.
     * @param {DOMNode} contextNode  the xml node that is subject to the query.
     * @returns {Array} list of xml nodes found. The list can be empty.
     */
    this.selectNodes = function(sExpr, contextNode){
        if (contextNode && (jpf.hasXPathHtmlSupport && contextNode.selectSingleNode || !contextNode.style))
            return contextNode.selectNodes(sExpr); //IE55
        //if (contextNode.ownerDocument != document)
        //    return contextNode.selectNodes(sExpr);

        return jpf.XPath.selectNodes(sExpr, contextNode)
    };

    /**
     * Executes an xpath expression on any dom node. This is especially useful
     * for dom nodes that don't have a good native xpath processor such as html
     * in some versions of internet explorer and xml in webkit. This function
     * Only returns the first node found.
     *
     * @param {String}  sExpr        the xpath expression.
     * @param {DOMNode} contextNode  the dom node that is subject to the query.
     * @returns {XMLNode} the dom node found or null if none was found.
     */
    this.selectSingleNode = function(sExpr, contextNode){
        if (contextNode && (jpf.hasXPathHtmlSupport && contextNode.selectSingleNode || !contextNode.style))
            return contextNode.selectSingleNode(sExpr); //IE55
        //if (contextNode.ownerDocument != document)
        //    return contextNode.selectSingleNode(sExpr);

        var nodeList = this.selectNodes(sExpr + (jpf.isIE ? "" : "[1]"),
            contextNode ? contextNode : null);
        return nodeList.length > 0 ? nodeList[0] : null;
    };

    /**** General XML Handling ****/

    /**
     * Creates an xml node based on an xpath statement.
     *
     * @param {DOMNode} contextNode  the dom node that is subject to the query.
     * @param {String}  xPath        the xpath query.
     * @param {Array}   [addedNodes] this array is filled with the nodes added.
     * @param (Boolean) [forceNew]   wether a new node is always created.
     * @return {DOMNode} the last element found.
     * @todo generalize this to include attributes in if format []
     */
    this.createNodeFromXpath = function(contextNode, xPath, addedNodes, forceNew){
        var xmlNode, foundpath = "", paths = xPath.split("\|")[0].split("/");
        if (!forceNew && (xmlNode = contextNode.selectSingleNode(xPath)))
            return xmlNode;
        
        var len = paths.length -1;
        if (forceNew) {
            if (paths[len].trim().match(/^\@(.*)$|^text\(\)$/))
                len--;
        }
        
        for (var addedNode, isAdding = false, i = 0; i < len; i++) {
            if (!isAdding && contextNode.selectSingleNode(foundpath
              + (i != 0 ? "/" : "") + paths[i])) {
                foundpath += (i != 0 ? "/" : "") + paths[i];// + "/";
                continue;
            }
            
            //Temp hack 
            var isAddId = paths[i].match(/(\w+)\[@([\w-]+)=(\w+)\]/);
            // #ifdef __DEBUG
            if (!isAddId && paths[i].match(/\@|\[.*\]|\(.*\)/)) {
                throw new Error(jpf.formatErrorString(1041, this, 
                    "Select via xPath", 
                    "Could not use xPath to create xmlNode: " + xPath));
            }
            if (!isAddId && paths[i].match(/\/\//)) {
                throw new Error(jpf.formatErrorString(1041, this, 
                    "Select via xPath", 
                    "Could not use xPath to create xmlNode: " + xPath));
            }
            // #endif

            if (isAddId)
                paths[i] = isAddId[1];

            isAdding = true;
            addedNode = contextNode.selectSingleNode(foundpath || ".")
                .appendChild(contextNode.ownerDocument.createElement(paths[i]));

            if (isAddId) {
                addedNode.setAttribute(isAddId[2], isAddId[3]);
                foundpath += (foundpath ? "/" : "") + isAddId[0];// + "/";
            }
            else
                foundpath += (foundpath ? "/" : "") + paths[i];// + "/";

            if (addedNodes)
                addedNodes.push(addedNode);
        }

        if (!foundpath)
            foundpath = ".";

        var newNode, lastpath = paths[len];
        do {
            if (lastpath.match(/^\@(.*)$/)) {
                (newNode || contextNode.selectSingleNode(foundpath))
                    .setAttributeNode(newNode = contextNode.ownerDocument.createAttribute(RegExp.$1));
            }
            else if (lastpath.trim() == "text()") {
                newNode = (newNode || contextNode.selectSingleNode(foundpath))
                    .appendChild(contextNode.ownerDocument.createTextNode(""));
            }
            else {
                var hasId = lastpath.match(/(\w+)\[@([\w-]+)=(\w+)\]/);
                if (hasId) lastpath = hasId[1];
                newNode = (newNode || contextNode.selectSingleNode(foundpath))
                    .appendChild(contextNode.ownerDocument.createElement(lastpath));
                if (hasId)
                    newNode.setAttribute(hasId[2], hasId[3]);
                
                if (addedNodes)
                    addedNodes.push(newNode);
            }
            
            foundpath += (foundpath ? "/" : "") + paths[len];
        } while((lastpath = paths[++len]));

        return newNode;
    };

    /**
     * @private
     * @todo xml doc leakage
     */
    this.getXmlDocId = function(xmlNode, model){
        var docEl = xmlNode.ownerDocument.documentElement;
        if (!this.isChildOf(docEl, xmlNode))
            docEl = xmlNode;

        var docId = (docEl || xmlNode).getAttribute(this.xmlDocTag)
            || xmlDocLut.indexOf(docEl || xmlNode.ownerDocument || xmlNode);

        if (docId && docId > -1)
            return docId;

        docId = xmlDocLut.push(docEl || xmlNode.ownerDocument || xmlNode) - 1;
        if (docEl)
            docEl.setAttribute(this.xmlDocTag, docId);

        if (model)
            jpf.nameserver.register("model", docId, model);

        return xmlDocLut.length - 1;
    };

    /**
     * @private
     */
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

    /**
     * @private
     */
    this.convertMethods = {
        /**
         * Gets a JSON object containing all the name/value pairs of the elements
         * using this element as it's validation group.
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
            if (!basename) 
                basename = "";
            
            var str = [], value, nodes = xml.childNodes, done = {};
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1)
                    continue;
                var name = nodes[i].tagName;
                if (done[name])
                    continue;

                //array
                var sameNodes = xml.selectNodes(name);
                if (sameNodes.length > 1) {
                    done[name] = true;
                    for (var j = 0; j < sameNodes.length; j++) {
                        value = this.cgivars(sameNodes[j],
                            basename + name + "[" + j + "]");
                        if (value)
                            str.push(value);
                    }
                }
                else { //single value
                    value = this.cgivars(nodes[i], basename + name);
                    if (value)
                        str.push(value);
                }
            }

            var attr = xml.attributes;
            for (i = 0; i < attr.length; i++) {
                if (attr[i].nodeValue) {
                    if (basename) 
                        str.push(basename + "[" + attr[i].nodeName + "]="
                            + encodeURIComponent(attr[i].nodeValue));
                    else
                        str.push(attr[i].nodeName + "="
                            + encodeURIComponent(attr[i].nodeValue));
                }
            }

            if (str.length)
                return str.join("&");

            value = jpf.getXmlValue(xml, "text()");
            if (basename && value)
                return basename + "=" + encodeURIComponent(value);
        },

        "cgiobjects": function(xml, basename, isSub){
            if (!basename)
                basename = "";
            
            var str = [], value, nodes = xml.childNodes, done = {};
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.nodeType != 1)
                    continue;

                var name        = node.tagName;
                if (name == "revision")
                    continue;

                var isOnlyChild = jpf.xmldb.isOnlyChild(node.firstChild, [3,4]);
                var count       = 0;

                //array
                if (!node.attributes.length && !isOnlyChild) {
                    var lnodes = node.childNodes;
                    for (var nm, j = 0, l = lnodes.length; j < l; j++) {
                        if (lnodes[j].nodeType != 1)
                            continue;
                        
                        nm = basename + (isSub ? "[" : "") + name + (isSub ? "]" : "") + "[" + count++ + "]";
                        value = this.cgiobjects(lnodes[j], nm, true);
                        if (value)
                            str.push(value);
                        
                        var a, attr = lnodes[j].attributes;
                        for (k = 0; k < attr.length; k++) {
                            if (!(a = attr[k]).nodeValue)
                                continue;
                            
                            str.push(nm + "[" + a.nodeName + "]=" 
                                + encodeURIComponent(a.nodeValue));
                        }
                    }
                }
                //single value
                else {
                    if (isOnlyChild)
                        str.push(basename + (isSub ? "[" : "") + name + (isSub ? "]" : "") + "=" 
                            + encodeURIComponent(node.firstChild.nodeValue));
                    
                    var a, attr = node.attributes;
                    for (j = 0; j < attr.length; j++) {
                        if (!(a = attr[j]).nodeValue)
                            continue;
                        
                        str.push(basename + (isSub ? "[" : "") + name + "_" + a.nodeName + (isSub ? "]" : "") + "=" 
                            + encodeURIComponent(a.nodeValue));
                    }
                }
            }
            
            if (!isSub && xml.getAttribute("id"))
                str.push("id=" + encodeURIComponent(xml.getAttribute("id")));

            if (str.length)
                return str.join("&");
        }
    };

    /**
     * Converts xml to another format.
     *
     * @param {XMLElement} xml  the xml element to convert.
     * @param {String}     to   the format to convert the xml to.
     *   Possible values:
     *   json       converts to a json string
     *   cgivars    converts to cgi string.
     *   cgiobjects converts to cgi objects
     * @return {String} the result of the conversion.
     */
    this.convertXml = function(xml, to){
        return this.convertMethods[to](xml);
    };

    /**
     * Returns the first text or cdata child of an xml element.
     *
     * @param {XMLElement} x the xml node to search.
     * @return {XMLNode} the found xml node, or null.
     */
    this.getTextNode = function(x){
        for (var i = 0; i < x.childNodes.length; i++) {
            if (x.childNodes[i].nodeType == 3 || x.childNodes[i].nodeType == 4)
                return x.childNodes[i];
        }
        return false;
    };

    //#ifdef __NOTUSED

    /**
     * @private
     */
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

    /**
     * @private
     */
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

    /**
     * @private
     */
    this.clearBoundValue = function(jmlNode, xmlRoot, applyChanges){
        if (!xmlRoot && !jmlNode.xmlRoot)
            return;

        var xmlNode = (jmlNode.nodeFunc == jpf.NODE_VISIBLE)
            ? xmlRoot.selectSingleNode(jmlNode.getAttribute("ref"))
            : jmlNode.getNodeFromRule("value", jmlNode.xmlRoot);

        if (xmlNode)
            this.setNodeValue(xmlNode, "", applyChanges);
    };

    //#endif

    /**
     * @private
     */
    this.getBoundValue = function(jmlNode, xmlRoot, applyChanges){
        if (!xmlRoot && !jmlNode.xmlRoot)
            return "";

        var xmlNode = !jmlNode.nodeFunc
            ? xmlRoot.selectSingleNode(jmlNode.getAttribute("ref"))
            : jmlNode.getNodeFromRule("value", jmlNode.xmlRoot);

        return xmlNode ? this.getNodeValue(xmlNode) : "";
    };

    /**
     * @private
     */
    this.getArrayFromNodelist = function(nodelist){
        for (var nodes = [], j = 0; j < nodelist.length; j++)
            nodes.push(nodelist[j]);
        return nodes;
    };
};

/**
 * @alias XmlDatabase#getXml
 */
jpf.getXml = function(){
    return jpf.xmldb.getXml.apply(jpf.xmldb, arguments);
};

jpf.Init.run('XmlDatabase');

//#endif
