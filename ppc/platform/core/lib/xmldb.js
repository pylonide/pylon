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
 * The XML database object provides local storage for XML data. This object
 * routes all changes to the XML data to the data bound objects. It also
 * provides utility functions for XML handling.
 *
 * @class ppc.xmldb
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 * @additional
 *
 * @default_private
 */
ppc.xmldb = new (function(){
    var _self = this;

    this.xmlDocTag    = "a_doc";
    this.xmlIdTag     = "a_id";
    this.xmlListenTag = "a_listen";
    this.htmlIdTag    = "id";
    this.disableRDB   = false;

    this.$xmlDocLut   = [];
    this.$nodeCount   = {};

    var cleanRE       = /(?:a_doc|a_id|a_listen|a_loaded)=(?:"|')[^'"]+(?:"|')/g,
        whiteRE       = />[\s\n\r\t]+</g;

    /**
     * Clear XML document cache periodically when no model is referencing it
     */
    this.garbageCollect = function(){
        var xmlNode, cache = ppc.xmldb.$xmlDocLut, docId, model;
        for (var i = 0, l = cache.length; i < l; i++) {
            xmlNode = cache[i];

            if (!xmlNode || xmlNode.nodeFunc)
                continue;

            docId = i;//xmlNode.getAttribute(ppc.xmldb.xmlDocTag);
            model = ppc.nameserver.get("model", docId);

            if (!model || model.data != xmlNode) {
                cache[i] = null;
            }
        }
    };

    this.$gcInterval = window.setInterval
        ? setInterval(function(){
              _self.garbageCollect();
          }, 60000)
        : null;

    /*
     * @private
     */
    this.getElementById = function(id, doc){
        if (!doc)
            doc = this.$xmlDocLut[id.split("\|")[0]];
        if (!doc)
            return false;

        return doc.selectSingleNode("descendant-or-self::node()[@"
            + this.xmlIdTag + "='" + id + "']");
    };

    /*
     * @private
     */
    this.getNode = function(htmlNode){
        if (!htmlNode || !htmlNode.getAttribute(this.htmlIdTag))
            return false;

        return this.getElementById(htmlNode.getAttribute(this.htmlIdTag)
            .split("\|", 2).join("|"));
    };

    /*
     * @private
     */
    this.getNodeById = function(id, doc){
        var q = id.split("\|");
        q.pop();
        return this.getElementById(q.join("|"), doc);//id.split("\|", 2).join("|")
    };

    /*
     * @private
     */
    this.getDocumentById = function(id){
        return this.$xmlDocLut[id];
    };

    /*
     * @private
     */
    this.getDocument = function(node){
        return this.$xmlDocLut[node.getAttribute(this.xmlIdTag).split("\|")[0]];
    };

    /**
     * @private
     */
    this.getID = function(xmlNode, o){
        return xmlNode.getAttribute(this.xmlIdTag) + "|" + o.$uniqueId;
    };

    /*
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
     * Sets the model of an element.
     *
     * @param {ppc.model} The model to be set
     *
     */
    this.setModel = function(model){
        //#ifdef __WITH_NAMESERVER
        ppc.nameserver.register("model", model.data.ownerDocument
            .documentElement.getAttribute(this.xmlDocTag), model);
        //#endif
    };

    /**
     * Finds the model of an element.
     *
     * @param {XMLNode} xmlNode The {@link term.datanode data node} to find its model.
     *
     */
    this.findModel = function(xmlNode){
        //#ifdef __WITH_NAMESERVER
        return ppc.nameserver.get("model", xmlNode.ownerDocument
            .documentElement.getAttribute(this.xmlDocTag));
        //#endif
    };

    /*
     * @private
     */
    this.getXmlId = function(xmlNode){
        return xmlNode.getAttribute(this.xmlIdTag) ||
          this.nodeConnect(ppc.xmldb.getXmlDocId(xmlNode), xmlNode);
    };

    /**
     * Gets the HTML representation of an XML node for a certain element.
     *
     * @param {XMLNode} xmlNode  The {@link term.datanode data node} which is represented by the HTML element.
     * @param {ppc.AmlNode} oComp    The element that has created the representation.
     * @return {DOMNode} The HTML node representing the XML node.
     */
    this.getHtmlNode = function(xmlNode, oComp){
        if (xmlNode && xmlNode.nodeType == 1 && xmlNode.getAttribute(this.xmlIdTag)) {
            return oComp.$findHtmlNode(xmlNode.getAttribute(this.xmlIdTag)
                + "|" + oComp.$uniqueId);
        }
        return null;
    };

    /**
     * Finds the HTML representation of an XML node for a certain element.
     *
     * @param {XMLNode} xmlNode  The {@link term.datanode data node} which is represented by the HTML element.
     * @param {ppc.AmlNode} oComp    The element that has created the representation.
     * @return {DOMNode} The HTML node representing the XML node.
     */
    this.findHtmlNode = function(xmlNode, oComp){
        do {
            if (xmlNode.nodeType == 1 && xmlNode.getAttribute(this.xmlIdTag)) {
                return oComp.$findHtmlNode(xmlNode.getAttribute(this.xmlIdTag)
                    + "|" + oComp.$uniqueId);
            }
            if (xmlNode == oComp.xmlRoot)
                return null;

            xmlNode = xmlNode.parentNode;
        }
        while (xmlNode && xmlNode.nodeType != 9)

        return null;
    };

    /**
     * Finds the {@link term.datanode data node} that is represented by the HTML node.
     *
     * @param {DOMNode} htmlNode  The HTML node representing the an XML node.
     * @return {XMLNode} The {@link term.datanode data node} for which the HTML node is its representation.
     */
    this.findXmlNode = function(htmlNode){
        if (!htmlNode)
            return false;

        var id;
        while (htmlNode && htmlNode.nodeType == 1 && (
          htmlNode.tagName.toLowerCase() != "body" && !(id = htmlNode.getAttribute(this.htmlIdTag))
          || (id || (id = htmlNode.getAttribute(this.htmlIdTag))) && id.match(/^q/)
        )) {
            if (htmlNode.host && htmlNode.host.$ext == htmlNode)
                return htmlNode.host.xmlRoot;

            htmlNode = htmlNode.parentNode;
        }
        if (!htmlNode || htmlNode.nodeType != 1)
            return false;

        if (htmlNode.tagName.toLowerCase() == "body")
            return false;

        return this.getNode(htmlNode);
    };

    this.getXml = ppc.getXml;

    /*
     * @private
     */
    this.nodeConnect = function(documentId, xmlNode, htmlNode, o){
        if (!this.$nodeCount[documentId])
            this.$nodeCount[documentId] = 0;

        var xmlId;
        xmlId = xmlNode.getAttribute(this.xmlIdTag)
          || xmlNode.setAttribute(this.xmlIdTag, (xmlId = documentId
               + "|" + ++this.$nodeCount[documentId])) || xmlId;

        if (!o)
            return xmlId;

        var htmlId = xmlId + "|" + o.$uniqueId;
        if (htmlNode)
            htmlNode.setAttribute(this.htmlIdTag, htmlId);

        return htmlId;
    };



    this.$listeners = [null];    
    // make sure that "0" is never a listener index    
    // @todo this is cleanup hell! Listeners should be completely rearchitected
    /*
     * @private
     * 
     */
    this.addNodeListener = function(xmlNode, o, uId){
        // #ifdef __DEBUG
        if (!o || (!o.$xmlUpdate && !o.setProperty))
            throw new Error(ppc.formatErrorString(1040, null,
                "Adding Node listener",
                "Interface not supported."));
        // #endif

        var id, listen = String(xmlNode.getAttribute(this.xmlListenTag) || "");
        //id || (id = String(o.$uniqueId));

        if (!uId) uId = String(o.$uniqueId);
        if (uId.charAt(0) == "p") {
            var sUId = uId.split("|");
            id = this.$listeners.push(function(args){
                //@todo ppc3.0 should this be exactly like in class.js?
                //@todo optimize this to check the async flag: parsed[3] & 4

                var amlNode = ppc.all[sUId[1]]; //It's possible the aml node dissapeared in this loop.
                if (amlNode) {
                    var model = ppc.all[sUId[3]];
                    if (!model)
                        return;

                    if (model.$propBinds[sUId[1]][sUId[2]]) {
                        if (!ppc.isChildOf(model.data, xmlNode, true))
                            return false;

                        var xpath = model.$propBinds[sUId[1]][sUId[2]].listen; //root
                        var node  = xpath
                            ? ppc.queryNode(model.data, xpath)
                            : xmlNode;
                    }
                    if (node)
                        amlNode.$execProperty(sUId[2], node, args[3]);
                }
            }) - 1;
            this.$listeners[uId] = id;
        }
        else {
            //@todo ppc3 potential cleanup problem
            id = "e" + uId;
            if (!this.$listeners[id]) {
                this.$listeners[id] = function(args){
                    var amlNode = ppc.all[uId];
                    if (amlNode)
                        amlNode.$xmlUpdate.apply(amlNode, args);
                };
            }

            //#ifdef __WITH_XMLMUTATION_BINDING
            if (xmlNode.$regbase) {
                var lut = {
                    "DOMCharacterDataModified" : "text",
                    "DOMAttrModified"          : "attribute",
                    "DOMNodeInserted"          : "add",
                    "DOMNodeRemoved"           : "remove"
                }
                var rFn = this.$listeners[id].rFn || (this.$listeners[id].rFn = function(e){
                    var node = e.relatedNode && e.relatedNode.nodeType != 1
                        ? e.relatedNode
                        : e.currentTarget;

                    if (node.nodeName && node.nodeName.substr(0, 2) == "a_")
                        return;

                    var action = lut[e.name];
                    if (node.nodeType != 1) {
                        action = node.nodeType == 2 ? "attribute" : "text";
                        node = node.parentNode || node.ownerElement;
                    }

                    //if ((node.parentNode && node.parentNode.nodeType == 1))
                        ppc.xmldb.$listeners[id]([action, node, this, null, node.parentNode]);
                });
                xmlNode.addEventListener("DOMCharacterDataModified", rFn);
                xmlNode.addEventListener("DOMAttrModified",          rFn);
                xmlNode.addEventListener("DOMNodeInserted",          rFn);
                xmlNode.addEventListener("DOMNodeRemoved",           rFn);
                return;
            }
            //#endif
        }

        if (!listen || listen.indexOf(";" + id + ";") == -1)
            xmlNode.setAttribute(this.xmlListenTag, (listen ? listen + id : ";" + id) + ";");

        return xmlNode;
    };

    /*
     * @todo  Use this function when an element really unbinds from a
     *        piece of data and does not uses it for caching
     * @private
     */
    this.removeNodeListener = function(xmlNode, o, id){
        var listen = xmlNode.getAttribute(this.xmlListenTag);
        var nodes = (listen ? listen.split(";") : []);
        if (id && id.charAt(0) == "p") {
            id = this.$listeners[id];
            delete this.$listeners[id];
        }
        else {
            id = "e" + o.$uniqueId;

            //#ifdef __WITH_XMLMUTATION_BINDING
            if (xmlNode.$regbase) {
                var rFn = this.$listeners[id].rFn;
                xmlNode.removeEventListener("DOMCharacterDataModified", rFn);
                xmlNode.removeEventListener("DOMAttrModified",          rFn);
                xmlNode.removeEventListener("DOMNodeInserted",          rFn);
                xmlNode.removeEventListener("DOMNodeRemoved",           rFn);
            }
            //#endif
        }

        for (var newnodes = [], i = 0; i < nodes.length; i++) {
            if (nodes[i] != id)
                newnodes.push(nodes[i]);
        }

        xmlNode.setAttribute(this.xmlListenTag, newnodes.join(";"));// + ";"

        return xmlNode;
    };

    /**
     * Sets the value of a text node. If the node doesn't exist, it is created.
     *
     * Changes are propagated to the databound elements listening for changes
     * on the data changed.
     *
     * @param {XMLElement} pNode     The parent of the text node.
     * @param {String}     value     The value of the text node.
     * @param {String}     [xpath]   The xpath statement which selects the text node.
     * @param {ppc.UndoData}    [undoObj] The undo object that is responsible for archiving the changes.
     */
    this.setTextNode =
    ppc.setTextNode  = function(pNode, value, xpath, undoObj, range){
        var tNode;

        if (xpath) {
            tNode = pNode.selectSingleNode(xpath);
            if (!tNode)
                return;
            pNode = tNode.nodeType == 1 ? tNode : null;
        }
        if (pNode.nodeType != 1)
            tNode = pNode;
        else if (pNode || !tNode) {
            tNode = pNode.selectSingleNode("text()");

            if (!tNode)
                tNode = pNode.appendChild(pNode.ownerDocument.createTextNode(""));//createCDATASection
        }

        //Action Tracker Support
        if (undoObj && !undoObj.$filled) {
            undoObj.extra.oldValue = tNode.nodeValue;
            undoObj.$filled = true;
        }

        //Apply Changes
        if (range) { //@todo ppc3.0 range
            undoObj.extra.range = range;

        }
        else {
            tNode.nodeValue = value;

            if (tNode.$regbase)
                tNode.$setValue(value);
        }

        this.applyChanges("text", tNode.parentNode, undoObj);

        // #ifdef __WITH_RDB
        this.applyRDB(["setTextNode", pNode, value, xpath], undoObj || {xmlNode: pNode}); //@todo ppc3.0 for range support
        // #endif
    };

    /**
     * Sets an attribute on a node. Changes are propagated to the databound
     * elements listening for changes on the data changed.
     *
     * @param {XMLElement} xmlNode   The XML node to set the attribute on.
     * @param {String}     name      The name of the attribute.
     * @param {String}     value     The value of the attribute.
     * @param {String}     [xpath]   The xpath statement to select the attribute.
     * @param {ppc.UndoData}    [undoObj] The undo object that is responsible for archiving the changes.
     */
    this.setAttribute =
    ppc.setAttribute  = function(xmlNode, name, value, xpath, undoObj, range){
        //Action Tracker Support
        if (undoObj && !undoObj.$filled) {
            undoObj.name = name;
            undoObj.$filled = true;
        }

        //Apply Changes
        if (range) { //@todo ppc3.0 range
            undoObj.extra.range = range;
        }
        else
            (xpath ? xmlNode.selectSingleNode(xpath) : xmlNode).setAttribute(name, value);

        this.applyChanges("attribute", xmlNode, undoObj);
        // #ifdef __WITH_RDB
        this.applyRDB(["setAttribute", xmlNode, name, value, xpath], undoObj || {xmlNode: xmlNode});  //@todo ppc3.0 for range support
        // #endif
    };

    /**
     * Removes an attribute of an XML node. Changes are propagated to the
     * databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} xmlNode   The XML node to delete the attribute from
     * @param {String}     name      The name of the attribute.
     * @param {String}     [xpath]   The xpath statement to select the attribute.
     * @param {ppc.UndoData}    [undoObj] The undo object that is responsible for archiving the changes.
     */
    this.removeAttribute =
    ppc.removeAttribute  = function(xmlNode, name, xpath, undoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;

        //Action Tracker Support
        if (undoObj && !undoObj.$filled) {
            undoObj.name = name;
            undoObj.$filled = true;
        }

        //Apply Changes
        (xpath ? xmlNode.selectSingleNode(xpath) : xmlNode).removeAttribute(name);
        this.applyChanges("attribute", xmlNode, undoObj);

        // #ifdef __WITH_RDB
        this.applyRDB(["removeAttribute", xmlNode, name, xpath], undoObj || {xmlNode: xmlNode});
        // #endif
    };

    /**
     * Replace one node with another. Changes are propagated to the
     * databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} oldNode   The XML node to remove.
     * @param {XMLElement} newNode   The XML node to set.
     * @param {String}     [xpath]   The xpath statement to select the attribute.
     * @param {ppc.UndoData}    [undoObj] The undo object that is responsible for archiving the changes.
     */
    this.replaceNode =
    ppc.replaceNode  = function(newNode, oldNode, xpath, undoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;

        //Apply Changes
        if (xpath)
            oldNode = oldNode.selectSingleNode(xpath);

        // @todo: only do this once! - should store on the undo object
        if (oldNode.ownerDocument.importNode && newNode.ownerDocument != oldNode.ownerDocument) {
            var oldNodeS = newNode;
            newNode = oldNode.ownerDocument.importNode(newNode, true); //Safari issue not auto importing nodes
            if (oldNodeS.parentNode)
                oldNodeS.parentNode.removeChild(oldNodeS);
        }

        // #ifdef __WITH_RDB
        this.applyRDB(["replaceNode", oldNode, this.cleanXml(newNode.xml), xpath], undoObj || {xmlNode: oldNode});
        // #endif

        //Action Tracker Support
        if (undoObj && !undoObj.$filled) {
            undoObj.$filled = true;
            undoObj.oldNode = oldNode;
            undoObj.xmlNode = newNode;
        }

        this.cleanNode(newNode);

        var parentNode = oldNode.parentNode;
        if (!parentNode)
            return;

        parentNode.replaceChild(newNode, oldNode);
        this.copyConnections(oldNode, newNode);

        this.applyChanges("replacenode", newNode, undoObj);

        return newNode;
    };

    /**
     * Creates a new element under a parent XML node. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} pNode       The parent XML node to add the new element to.
     * @param {String}     tagName     The tagName of the {@link term.datanode data node} to add.
     * @param {Array}      attr        list of the attributes to set. Each item is another array with the name and value.
     * @param {XMLElement} beforeNode  The XML node which indicates the insertion point.
     * @param {String}     [xpath]     The xpath statement to select the attribute.
     * @param {ppc.UndoData}    [undoObj]   The undo object that is responsible for archiving the changes.
     */
    this.addChildNode =
    ppc.addChildNode  = function(pNode, tagName, attr, beforeNode, undoObj){
        //Create New Node
        var xmlNode = pNode.insertBefore(pNode.ownerDocument
            .createElement(tagName), beforeNode);

        //Set Attributes
        for (var i = 0; i < attr.length; i++)
            xmlNode.setAttribute(attr[i][0], attr[i][1]);

        //Action Tracker Support
        if (undoObj && !undoObj.$filled) {
            undoObj.extra.addedNode = xmlNode;
            undoObj.$filled = true;
        }

        this.applyChanges("add", xmlNode, undoObj);

        // #ifdef __WITH_RDB
        this.applyRDB(["addChildNode", pNode, tagName, attr, beforeNode], undoObj || {xmlNode: pNode});
        // #endif

        return xmlNode;
    };

    /**
     * Appends an XML node to a parent. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} pNode       The parent XML node to add the element to.
     * @param {XMLElement} xmlNode     The XML node to insert.
     * @param {XMLElement} beforeNode  The XML node which indicates the insertion point.
     * @param {Boolean}    unique      Specifies whether the parent can only contain one element with a certain tag name.
     * @param {String}     [xpath]     The xpath statement to select the parent node.
     * @param {ppc.UndoData}    [undoObj]   The undo object that is responsible for archiving the changes.
     */
    this.appendChild =
    ppc.appendChild  = function(pNode, xmlNode, beforeNode, unique, xpath, undoObj){
        if (pNode == xmlNode.parentNode) //Shouldn't this be the same document?
            return ppc.xmldb.moveNode(pNode, xmlNode, beforeNode, null, xpath, undoObj);

        if (unique && pNode.selectSingleNode(xmlNode.tagName))
            return false;

        // @todo: only do this once! - should store on the undo object
        if (pNode.ownerDocument.importNode && pNode.ownerDocument != xmlNode.ownerDocument) {
            var oldNode = xmlNode;
            xmlNode = pNode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes
            if (oldNode.parentNode)
                oldNode.parentNode.removeChild(oldNode);
        }

        // #ifdef __WITH_RDB
        this.applyRDB(["appendChild", pNode, this.cleanXml(xmlNode.xml), beforeNode, unique, xpath], undoObj || {xmlNode: pNode});
        // #endif

        //Add xmlNode to parent pNode or one selected by xpath statement
        if (xpath) {
            var addedNodes = [];
            pNode = ppc.createNodeFromXpath(pNode, xpath, addedNodes);
            if (addedNodes.length) {
                pNode.appendChild(xmlNode);
                while(addedNodes.length) {
                    if (pNode == addedNodes.pop() && addedNodes.length)
                        pNode = pNode.parentNode;
                }
            }
        }
        else if (xmlNode.parentNode)
            this.removeNode(xmlNode);

        if (undoObj && !undoObj.$filled) {
            undoObj.$filled = true;
            this.cleanNode(xmlNode);
        }
        else
            this.cleanNode(xmlNode);

        pNode.insertBefore(xmlNode, beforeNode);

        //detect if xmlNode should be removed somewhere else
        //- [17-2-2004] changed pNode (2nd arg applychange) into xmlNode

        this.applyChanges("add", xmlNode, undoObj);

        return xmlNode;
    };

    /**
     * Moves an XML node to a parent node. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} pNode       The new parent XML node of the node.
     * @param {XMLElement} xmlNode     The XML node to move.
     * @param {XMLElement} beforeNode  The XML node which indicates the insertion point.
     * @param {String}     [xpath]     The xpath statement to select the parent node.
     * @param {ppc.UndoData}    [undoObj]   The undo object that is responsible for archiving the changes.
     */
    this.moveNode =
    ppc.moveNode  = function(pNode, xmlNode, beforeNode, xpath, undoObj){
        //Action Tracker Support
        if (!undoObj)
            undoObj = {extra:{}};

        undoObj.extra.oldParent  = xmlNode.parentNode;
        undoObj.extra.beforeNode = xmlNode.nextSibling;
        undoObj.extra.parent     = (xpath ? pNode.selectSingleNode(xpath) : pNode);

        this.applyChanges("move-away", xmlNode, undoObj);

        //Set new id if the node change document (for safari this should be fixed)
        //@todo I don't get this if...
        /*if (!ppc.isWebkit
          && xmlNode.getAttribute(this.xmlIdTag)
          && ppc.xmldb.getXmlDocId(xmlNode) != ppc.xmldb.getXmlDocId(pNode)) {
            xmlNode.removeAttribute(this.xmlIdTag));
            this.nodeConnect(ppc.xmldb.getXmlDocId(pNode), xmlNode);
        }*/

        // @todo: only do this once! - should store on the undo object
        if (pNode.ownerDocument.importNode && pNode.ownerDocument != xmlNode.ownerDocument) {
            var oldNode = xmlNode;
            xmlNode = pNode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes
            if (oldNode.parentNode)
                oldNode.parentNode.removeChild(oldNode);
        }

        // #ifdef __WITH_RDB
        this.applyRDB(["moveNode", pNode, xmlNode, beforeNode, xpath], undoObj || {xmlNode: pNode}); //note: important that transport of rdb is async
        // #endif

        undoObj.extra.parent.insertBefore(xmlNode, beforeNode);
        this.applyChanges("move", xmlNode, undoObj);
    };

    /**
     * Removes an XML node from its parent. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} xmlNode     The XML node to remove from the dom tree.
     * @param {String}     [xpath]     The xpath statement to select the parent node.
     * @param {ppc.UndoData}    [undoObj]   The undo object that is responsible for archiving the changes.
     */
    this.removeNode =
    ppc.removeNode  = function(xmlNode, xpath, undoObj){
        if (xpath)
            xmlNode = xmlNode.selectSingleNode(xpath);

        //ActionTracker Support
        if (undoObj && !undoObj.$filled) {
            undoObj.$filled           = true;
            undoObj.extra.parent      = xmlNode.parentNode;
            undoObj.extra.removedNode = xmlNode;
            undoObj.extra.beforeNode  = xmlNode.nextSibling;
        }

        // #ifdef __WITH_RDB
        this.applyRDB(["removeNode", xmlNode, xpath], undoObj || {xmlNode: xmlNode}); //note: important that transport of rdb is async
        // #endif

        //Apply Changes
        this.applyChanges("remove", xmlNode, undoObj);
        var p = xmlNode.parentNode;
        if (!p)
            return;

        p.removeChild(xmlNode);
        this.applyChanges("redo-remove", xmlNode, null, p);//undoObj

        //@todo clean xmlNode after removal??
    };

    /**
     * Removes a list of XML nodes from their parent. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {Array}   xmlNodeList A list of XML nodes to remove.
     * @param {ppc.UndoData} [undoObj]   The undo object that is responsible for archiving the changes.
     */
    this.removeNodeList =
    ppc.removeNodeList  = function(xmlNodeList, undoObj){
        // #ifdef __WITH_RDB
        this.applyRDB(["removeNodeList", xmlNodeList, null], undoObj || {xmlNode: p});
        // #endif

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

        if (undoObj && !undoObj.$filled) {
            undoObj.$filled          = true;
            undoObj.extra.removeList = rData;
        }
    };

    /*
     * Looks for this.$listeners and executes their $xmlUpdate methods.
     * @private
     */
    var notifyQueue = {}, notifyTimer;
    this.$hasQueue = false;
    this.applyChanges = function(action, xmlNode, undoObj, nextloop){
        if (undoObj && undoObj.$dontapply) return;
        //#ifdef __WITH_OFFLINE
        if (typeof ppc.offline != "undefined" && ppc.offline.models.enabled
          && ppc.offline.models.realtime) {
            //#ifdef __WITH_NAMESERVER
            var model = ppc.nameserver.get("model", ppc.xmldb.getXmlDocId(xmlNode));
            if (model) ppc.offline.models.markForUpdate(model);
            //#endif
        }
        //#endif

        if (undoObj && !undoObj.xmlNode) //@todo are we sure about this?
            undoObj.xmlNode = xmlNode;

        //Set Variables
        var oParent  = nextloop,
            loopNode = (xmlNode.nodeType == 1 ? xmlNode : xmlNode.parentNode);

        //var xmlId = xmlNode.getAttribute(this.xmlIdTag);

        if (!this.delayUpdate && "|remove|move-away|".indexOf("|" + action + "|") > -1)
            this.notifyQueued(); //empty queue

        var listen, uId, uIds, i, j, hash, info, amlNode, runTimer, found, done = {};
        while (loopNode && loopNode.nodeType == 1) {
            //Get List of Node this.$listeners ID's
            listen = loopNode.getAttribute(this.xmlListenTag);

            if (listen) {
                uIds = listen.split(";");

                for (i = 0; i < uIds.length; i++) {
                    uId = uIds[i];
                    if (!uId || done[uId]) continue;
                    done[uId] = true;

                    //Property support
                    /*if (uId.charAt(0) == "p") {
                        uId = uId.split("|");

                        //@todo ppc3.0 should this be exactly like in class.js?
                        //@todo optimize this to check the async flag: parsed[3] & 4

                        amlNode = ppc.all[uId[1]]; //It's possible the aml node dissapeared in this loop.
                        if (amlNode) {
                            var model = ppc.all[uId[3]];
                            var xpath = model.$propBinds[uId[1]][uId[2]].root;

                            amlNode.$execProperty(uId[2], xpath
                                ? model.data.selectSingleNode(xpath)
                                : model.data);
                        }
                        continue;
                    }*/

                    hash = notifyQueue[uId];
                    if (!hash)
                        notifyQueue[uId] = hash = [];

                    // Filtering
                    if (!ppc.isO3 && "|update|attribute|text|".indexOf("|" + action + "|") > -1) {
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

                        hash.push([action, xmlNode, loopNode, undoObj, oParent]);
                        runTimer = true;
                        continue;
                    }

                    //!this.delayUpdate && <- that doesnt work because of information that is destroyed
                    if (ppc.isO3 || "|remove|move-away|move|add|".indexOf("|" + action + "|") > -1) {
                        if (this.$listeners[uId]) {
                            this.$listeners[uId]([action, xmlNode,
                                loopNode, undoObj, oParent]);
                        }
                        /*amlNode = ppc.all[uId];
                        if (amlNode)
                            amlNode.$xmlUpdate(action, xmlNode,
                                loopNode, undoObj, oParent);*/
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

        if (true || undoObj && !this.delayUpdate) {
            //Ok this was an action let's not delay execution
            ppc.xmldb.notifyQueued();
        }
        else if (runTimer) {
            ppc.setZeroTimeout.clearTimeout(notifyTimer);
            //@todo find a better solution for this (at the end of a event stack unroll)
            this.$hasQueue = true;
            notifyTimer = ppc.setZeroTimeout(function(){
                //this.$hasQueue = true;
                ppc.xmldb.notifyQueued();
            });
        }
    };

    /*
     *  @todo in actiontracker - add stack auto purging
     *        - when undo item is purged which was a removed, remove cache item
     *  @todo shouldn't the removeNode method remove all this.$listeners?
     *  @todo rename to processQueue
     *  @private
     */
    this.notifyQueued = function(){
        this.$hasQueue = false;

        var myQueue = notifyQueue;
        notifyQueue = {};

        ppc.setZeroTimeout.clearTimeout(notifyTimer);
        for (var uId in myQueue) {
            if (!uId) continue;

            var q       = myQueue[uId];
            var func    = this.$listeners[uId];
            //!amlNode ||
            if (!q || !func)
                continue;

            //Run queue items
            for (var i = 0; i < q.length; i++) {
                if (!q[i])
                    continue;

                //Update xml data
                //amlNode.$xmlUpdate.apply(amlNode, q[i]);
                func(q[i]);
            }
        }


    };

    /**
     * @private
     */
    this.notifyListeners = function(xmlNode){
        //This should be done recursive
        var listen = xmlNode.getAttribute(ppc.xmldb.xmlListenTag);
        if (listen) {
            listen = listen.split(";");
            for (var j = 0; j < listen.length; j++) {
                ppc.all[listen[j]].$xmlUpdate("synchronize", xmlNode, xmlNode);
                //load(xmlNode);
            }
        }
    };

    // #ifdef __WITH_RDB
    /*
     * Sends Message through transport to tell remote databound this.$listeners
     * that data has been changed
     * @private
     */
    this.applyRDB = function(args, undoObj){
        if (ppc.xmldb.disableRDB)
            return;

        var xmlNode = undoObj.localName || !undoObj.xmlNode
            ? args[1] && args[1].length && args[1][0] || args[1]
            : undoObj.xmlNode;

        if (xmlNode.nodeType == 2)
            xmlNode = xmlNode.ownerElement || xmlNode.selectSingleNode("..");
        //#ifdef __WITH_NAMESERVER
        var mdlId   = ppc.xmldb.getXmlDocId(xmlNode),
            model   = ppc.nameserver.get("model", mdlId);
        if (!model && ppc.isO3)
            model = self[mdlId];
        if (!model) {
            if (!ppc.nameserver.getAll("remote").length)
                return;
            //#ifdef __DEBUG
            ppc.console.log("Could not find model '" + mdlId + "' for Remote DataBinding connection, not sending change");
            //#endif
            return;
        }

        if (!model.rdb) return;
        var rdb = model.rdb;

        // Add the messages to the undo object
        if (undoObj.action)
            rdb.$queueMessage(args, model, undoObj);
        // Or send message now
        else {
            clearTimeout(rdb.queueTimer);

            rdb.$queueMessage(args, model, rdb);
            // use a timeout to batch consecutive calls into one RDB call
            rdb.queueTimer = $setTimeout(function() {
                rdb.$processQueue(rdb);
            });
        }
        //#endif
    };
    //#endif

    /**
     * @private
     */
    this.copyConnections = function(fromNode, toNode){
        //This should copy recursive
        try {
            toNode.setAttribute(this.xmlListenTag, fromNode.getAttribute(this.xmlListenTag));
        }
        catch (e) {}
        try {
            toNode.setAttribute(this.xmlIdTag, fromNode.getAttribute(this.xmlIdTag));
        }
        catch (e) {}
    };

    /**
     * @private
     */
    this.cleanXml = function(xml) {
        if (typeof xml != "string")
            return xml;
        return xml.replace(cleanRE, "").replace(whiteRE, "><");
    };

    /**
     * @private
     */
    this.cleanNode = function(xmlNode){
        try {
            var i, nodes = xmlNode.selectNodes("descendant-or-self::node()[@" + this.xmlListenTag + "]");
            for (i = nodes.length - 1; i >= 0; i--)
                nodes[i].removeAttribute(this.xmlListenTag);
            nodes = xmlNode.selectNodes("descendant-or-self::node()[@" + this.xmlIdTag + "]");
            for (i = nodes.length - 1; i >= 0; i--)
                nodes[i].removeAttribute(this.xmlIdTag);
            nodes = xmlNode.selectNodes("descendant-or-self::node()[@" + this.xmlDocTag + "]");
            for (i = nodes.length - 1; i >= 0; i--)
                nodes[i].removeAttribute(this.xmlDocTag);
            nodes = xmlNode.selectNodes("descendant-or-self::node()[@a_loaded]");
            for (i = nodes.length - 1; i >= 0; i--)
                nodes[i].removeAttribute("a_loaded");
        }
        catch (e) {}

        return xmlNode;
    };

    /**
     * Returns a copy of the passed {@link term.datanode data node}. Bound
     * data nodes contain special attributes to track them. These attributes
     * are removed from the copied node when using this method.
     *
     * @param {XMLElement} xmlNode The {@link term.datanode data node} to copy.
     * @return {XMLElement} The copy of the {@link term.datanode data node}.
     */
    this.copy         =
    this.getCleanCopy =
    ppc.getCleanCopy  = function(xmlNode){
        return ppc.xmldb.cleanNode(xmlNode.cloneNode(true));
    };

    /**
     * Unbind all PPC Elements from a certain Form
     * @private
     */
    this.unbind = function(frm){
        //Loop through objects of all ppc
        for (var lookup = {}, i = 0; i < frm.ppc.all.length; i++)
            if (frm.ppc.all[i] && frm.ppc.all[i].unloadBindings)
                lookup[frm.ppc.all[i].unloadBindings()] = true;

        //Remove Listen Nodes
        for (var k = 0; k < this.$xmlDocLut.length; k++) {
            //#ifdef __SUPPORT_WEBKIT
            if (!this.$xmlDocLut[k]) continue;
            //#endif

            var Nodes = this.$xmlDocLut[k].selectNodes("//self::node()[@"
                + this.xmlListenTag + "]");
            if (!Nodes) continue;

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

        if (window.clearInterval)
            window.clearInterval(this.$gcInterval);
    };

    /*
     * @private
     * @todo xml doc leakage
     */
    this.getXmlDocId = function(xmlNode, model){
        var docEl = xmlNode.ownerDocument.documentElement;
        if (!ppc.isChildOf(docEl, xmlNode))
            docEl = xmlNode;

        var docId = (docEl || xmlNode).getAttribute(this.xmlDocTag)
            || this.$xmlDocLut.indexOf(docEl || xmlNode.ownerDocument || xmlNode);

        if (model && ppc.nameserver.get("model", docId) != model) {
            docId = null;
            docEl = xmlNode;
        }

        if (!docId || docId == -1) {
            docId = this.$xmlDocLut.push(docEl || xmlNode.ownerDocument || xmlNode) - 1;
            if (docEl)
                docEl.setAttribute(this.xmlDocTag, String(docId));
        }
        //#ifdef __WITH_NAMESERVER
        if (model)
            ppc.nameserver.register("model", docId, model);
        //#endif

        return docId;
    };
});

//#endif
