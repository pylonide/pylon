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
 * @apfclass
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 *
 * @default_private
 */
apf.xmldb = new (function(){
    this.xmlDocTag    = "a_doc";
    this.xmlIdTag     = "a_id";
    this.xmlListenTag = "a_listen";
    this.htmlIdTag    = "id";
    this.disableRSB   = false;

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
        return xmlNode.getAttribute(this.xmlIdTag) + "|" + o.$uniqueId;
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
     * Sets the model of an element
     *
     * @param {Model} The model to be set
     * 
     */
    this.setModel = function(model){
        apf.nameserver.register("model", model.data.ownerDocument
            .documentElement.getAttribute(this.xmlDocTag), model);
    };

    /**
     * Find the model of an element
     *
     * @param {XMLNode} xmlNode the {@link term.datanode data node} to find its model.
     *
     */
    this.findModel = function(xmlNode){
        return apf.nameserver.get("model", xmlNode.ownerDocument
            .documentElement.getAttribute(this.xmlDocTag));
    };

    /**
     * @private
     */
    this.getXmlId = function(xmlNode){
        return xmlNode.getAttribute(this.xmlIdTag) ||
          this.nodeConnect(apf.xmldb.getXmlDocId(xmlNode), xmlNode);
    }

    /**
     * Gets the html representation of an xml node for a certain element.
     *
     * @param {XMLNode} xmlNode  the {@link term.datanode data node} which is represented by the hml element.
     * @param {AMLNode} oComp    the element that has created the representation.
     * @return {HTMLNode} the html node representing the xml node.
     */
    this.getHtmlNode = function(xmlNode, oComp){
        if (xmlNode && xmlNode.nodeType == 1 && xmlNode.getAttribute(this.xmlIdTag)) {
            return oComp.$findHtmlNode(xmlNode.getAttribute(this.xmlIdTag)
                + "|" + oComp.$uniqueId);
        }
        return null;
    }
    
    /**
     * Finds the html representation of an xml node for a certain element.
     *
     * @param {XMLNode} xmlNode  the {@link term.datanode data node} which is represented by the hml element.
     * @param {AMLNode} oComp    the element that has created the representation.
     * @return {HTMLNode} the html node representing the xml node.
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
     * Finds the {@link term.datanode data node} that is represented by the html node.
     *
     * @param {HTMLNode} htmlNode  the html node representing the an xml node.
     * @return {XMLNode} the {@link term.datanode data node} for which the html node is it's representation.
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
    
    this.getXml = apf.getXml;

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

        var htmlId = xmlId + "|" + o.$uniqueId;
        if (htmlNode)
            htmlNode.setAttribute(this.htmlIdTag, htmlId);

        return htmlId;
    };

    /**
     * @private
     */
    this.addNodeListener = function(xmlNode, o, id){
        // #ifdef __DEBUG
        if (!o.$xmlUpdate && !o.setProperty)
            throw new Error(apf.formatErrorString(1040, null, 
                "Adding Node listener", 
                "Interface not supported."));
        // #endif

        var listen = xmlNode.getAttribute(this.xmlListenTag);
        id || (id = String(o.$uniqueId));
        if (!listen || listen.indexOf(id) == -1)
            xmlNode.setAttribute(this.xmlListenTag, listen ? listen + ";" + id : id);

        return xmlNode;
    };

    /**
     * @todo  Use this function when an element really unbinds from a
     *        piece of data and does not uses it for caching
     * @private
     */
    this.removeNodeListener = function(xmlNode, o, id){
        var listen = xmlNode.getAttribute(this.xmlListenTag);
        var nodes = (listen ? listen.split(";") : []);
        if (!id) id = o.$uniqueId

        for (var newnodes = [], i = 0; i < nodes.length; i++) {
            if (nodes[i] != id)
                newnodes.push(nodes[i]);
        }

        xmlNode.setAttribute(this.xmlListenTag, newnodes.join(";"));

        return xmlNode;
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
    this.setTextNode = 
    apf.setTextNode  = function(pNode, value, xpath, undoObj){
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
    this.setAttribute = 
    apf.setAttribute  = function(xmlNode, name, value, xpath, undoObj){
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
    this.removeAttribute = 
    apf.removeAttribute  = function(xmlNode, name, xpath, undoObj){
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
    this.replaceNode = 
    apf.replaceNode  = function(newNode, oldNode, xpath, undoObj){
        //if(xmlNode.nodeType != 1) xmlNode.nodeValue = value;

        //Apply Changes
        if (xpath)
            oldNode = oldNode.selectSingleNode(xpath);

        //Action Tracker Support
        if (undoObj) {
            undoObj.oldNode = oldNode;
            undoObj.xmlNode = newNode;
        }
        var parentNode = oldNode.parentNode;
        parentNode.replaceChild(newNode, oldNode);
        this.copyConnections(oldNode, newNode);

        this.applyChanges("replacechild", newNode, undoObj);

        // #ifdef __WITH_RSB
        this.applyRSB(["replaceChild", oldNode, newNode, xpath], undoObj);
        // #endif
        
        return newNode;
    };

    /**
     * Creates a new element under a parent xml node. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {XMLElement} pNode       the parent xml node to add the new element to.
     * @param {String}     tagName     the tagName of the {@link term.datanode data node} to add.
     * @param {Array}      attr        list of the attributes to set. Each item is another array with the name and value.
     * @param {XMLElement} beforeNode  the xml node which indicates the insertion point.
     * @param {String}     [xpath]     the xpath statement to select the attribute.
     * @param {UndoObj}    [undoObj]   the undo object that is responsible for archiving the changes.
     */
    this.addChildNode = 
    apf.addChildNode  = function(pNode, tagName, attr, beforeNode, undoObj){
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
    this.appendChild = 
    apf.appendChild  = function(pNode, xmlNode, beforeNode, unique, xpath, undoObj){
        if (unique && pNode.selectSingleNode(xmlNode.tagName))
            return false;

        if (undoObj)
            this.cleanNode(xmlNode);

        // @todo: only do this once!
        if (pNode.ownerDocument.importNode && pNode.ownerDocument != xmlNode.ownerDocument)
            xmlNode = pNode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes

        //Add xmlNode to parent pNode or one selected by xpath statement
        if (xpath) {
            var addedNodes = [];
            var pNode = apf.createNodeFromXpath(pNode, xpath, addedNodes);
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
    this.moveNode = 
    apf.moveNode  = function(pNode, xmlNode, beforeNode, xpath, undoObj){
        //Action Tracker Support
        if (!undoObj)
            undoObj = {extra:{}};

        undoObj.extra.oldParent  = xmlNode.parentNode;
        undoObj.extra.beforeNode = xmlNode.nextSibling;
        undoObj.extra.parent     = (xpath ? pNode.selectSingleNode(xpath) : pNode);

        this.applyChanges("move-away", xmlNode, undoObj);

        // #ifdef __WITH_RSB
        this.applyRSB(["moveNode", pNode, xmlNode, beforeNode, xpath], undoObj); //note: important that transport of rsb is async
        // #endif

        //Set new id if the node change document (for safari this should be fixed)
        if (!apf.isWebkit
          && apf.xmldb.getXmlDocId(xmlNode) != apf.xmldb.getXmlDocId(pNode)) {
            xmlNode.removeAttributeNode(xmlNode.getAttributeNode(this.xmlIdTag));
            this.nodeConnect(apf.xmldb.getXmlDocId(pNode), xmlNode);
        }

        if (apf.isWebkit && pNode.ownerDocument != xmlNode.ownerDocument)
            xmlNode = pNode.ownerDocument.importNode(xmlNode, true); //Safari issue not auto importing nodes

        undoObj.extra.parent.insertBefore(xmlNode, beforeNode);
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
    this.removeNode = 
    apf.removeNode  = function(xmlNode, xpath, undoObj){
        if (xpath)
            xmlNode = xmlNode.selectSingleNode(xpath);

        //ActionTracker Support
        if (undoObj) {
            undoObj.extra.parent      = xmlNode.parentNode;
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
        
        //@todo clean xmlNode after removal??
    };

    /**
     * Removes a list of xml nodes from their parent. Changes are propagated
     * to the databound elements listening for changes on the data changed.
     *
     * @param {Array}   xmlNodeList list of xml nodes to remove.
     * @param {UndoObj} [undoObj]   the undo object that is responsible for archiving the changes.
     */
    this.removeNodeList = 
    apf.removeNodeList  = function(xmlNodeList, undoObj){
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
     * Looks for listeners and executes their $xmlUpdate methods.
     * @private
     */
    var notifyQueue = {}, notifyTimer;
    this.$hasQueue = false;
    this.applyChanges = function(action, xmlNode, undoObj, nextloop){
        //#ifdef __WITH_OFFLINE
        if (typeof apf.offline != "undefined" && apf.offline.models.enabled
          && apf.offline.models.realtime) {
            var model = apf.nameserver.get("model", apf.xmldb.getXmlDocId(xmlNode));
            if (model) apf.offline.models.markForUpdate(model);
        }
        //#endif

        if (undoObj && !undoObj.xmlNode) //@todo are we sure about this?
            undoObj.xmlNode = xmlNode;

        //Set Variables
        var oParent  = nextloop;
        var loopNode = (xmlNode.nodeType == 1 ? xmlNode : xmlNode.parentNode);

        //var xmlId = xmlNode.getAttribute(this.xmlIdTag);

        if (!this.delayUpdate && "|remove|move-away|".indexOf("|" + action + "|") > -1)
            this.notifyQueued(); //empty queue

        var listen, uId, uIds, i, j, hash, info, amlNode, runTimer, found;
        while (loopNode && loopNode.nodeType != 9) {
            //Get List of Node listeners ID's
            listen = loopNode.getAttribute(this.xmlListenTag);

            if (listen) {
                uIds = listen.split(";");

                for (i = 0; i < uIds.length; i++) {
                    uId = uIds[i];
                    
                    //Property support
                    if (uId.charAt(0) == "p") {
                        uId = uId.split("|");
                        
                        //@todo apf3.0 should this be exactly like in class.js?
                        //@todo optimize this to check the async flag: parsed[3] & 4
                        
                        amlNode = apf.all[uId[1]]; //It's possible the aml node dissapeared in this loop.
                        if (amlNode) {
                            var model = apf.all[uId[3]];
                            var xpath = model.$propBinds[uId[1]][uId[2]].root;
                            
                            amlNode.$execProperty(uId[2], xpath
                                ? model.data.selectSingleNode(xpath)
                                : model.data);
                        }
                        continue;
                    }
                    
                    hash = notifyQueue[uId];
                    if (!hash)
                        notifyQueue[uId] = hash = [];

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
                        amlNode = apf.all[uId];
                        if (amlNode)
                            amlNode.$xmlUpdate(action, xmlNode,
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
            //Ok this was an action let's not delay execution
            apf.xmldb.notifyQueued();
        }
        else if (runTimer) {
            clearTimeout(notifyTimer);
            //@todo find a better solution for this (at the end of a event stack unroll)
            //notifyTimer = $setTimeout(function(){
                //this.$hasQueue = true;
                apf.xmldb.notifyQueued();
            //});
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
        this.$hasQueue = false;
        
        clearTimeout(notifyTimer);
        for (var uId in notifyQueue) {
            var q       = notifyQueue[uId];
            var amlNode = apf.all[uId];
            if (!amlNode || !q)
                continue;

            //Run queue items
            for (var i = 0; i < q.length; i++) {
                if (!q[i])
                    continue;

                //Update xml data
                amlNode.$xmlUpdate.apply(amlNode, q[i]);
            }
        }

        notifyQueue = {}; // update shouldn't add anything to the queue
    }

    /**
     * @private
     */
    this.notifyListeners = function(xmlNode){
        //This should be done recursive
        var listen = xmlNode.getAttribute(apf.xmldb.xmlListenTag);
        if (listen) {
            listen = listen.split(";");
            for (var j = 0; j < listen.length; j++) {
                apf.all[listen[j]].$xmlUpdate("synchronize", xmlNode, xmlNode);
                //load(xmlNode);
            }
        }
    };

    // #ifdef __WITH_RSB
    /**
     * Sends Message through transport to tell remote databound listeners
     * that data has been changed
     * @private
     */
    this.applyRSB = function(args, undoObj){
        if (apf.xmldb.disableRSB)
            return;

        var xmlNode = args[1] && args[1].length && args[1][0] || args[1],
            mdlId   = apf.xmldb.getXmlDocId(xmlNode), 
            model   = apf.nameserver.get("model", mdlId);
        if (!model && apf.isO3)
            model = self[mdlId];
        if (!model) {
            if (!apf.nameserver.getAll("remove").length)
                return;

            //#ifdef __DEBUG
            apf.console.warn("Could not find model for Remote SmartBinding connection, not sending change");
            //#endif
            return;
        }

        if (!model.rsb) return;

        // Add the messages to the undo object
        if (undoObj)
            model.rsb.queueMessage(args, model, undoObj);
        // Or send message now
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
            // #ifdef __DEBUG
            // var nodes = xmlNode.selectNodes("descendant-or-self::node()[@a_selection]");
            // for (var i = nodes.length - 1; i >= 0; i--)
            //     nodes[i].removeAttributeNode(nodes[i].getAttributeNode("a_selection"));
            // #endif
        }
        catch (e) {}

        return xmlNode;
    };
    
    /**
     * Returns a copy of the passed {@link term.datanode data node}. Bound
     * data nodes contain special attributes to track them. These attributes
     * are removed from the copied node when using this method.
     *
     * @param {XMLElement} xmlNode the {@link term.datanode data node} to copy.
     * @return {XMLElement} the copy of the {@link term.datanode data node}.
     */
    this.copy         = 
    this.getCleanCopy = 
    apf.getCleanCopy  = function(xmlNode){
        return apf.xmldb.cleanNode(xmlNode.cloneNode(true));
    };

    /**
     * Unbind all APF Elements from a certain Form
     * @private
     */
    this.unbind = function(frm){
        //Loop through objects of all apf
        for (var lookup = {}, i = 0; i < frm.apf.all.length; i++)
            if (frm.apf.all[i] && frm.apf.all[i].unloadBindings)
                lookup[frm.apf.all[i].unloadBindings()] = true;

        //Remove Listen Nodes
        for (var k = 0; k < xmlDocLut.length; k++) {
            //#ifdef __SUPPORT_WEBKIT
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
     * @private
     * @todo xml doc leakage
     */
    this.getXmlDocId = function(xmlNode, model){
        var docEl = xmlNode.ownerDocument.documentElement;
        if (!apf.isChildOf(docEl, xmlNode))
            docEl = xmlNode;

        var docId = (docEl || xmlNode).getAttribute(this.xmlDocTag)
            || xmlDocLut.indexOf(docEl || xmlNode.ownerDocument || xmlNode);

        if (docId && docId > -1)
            return docId;

        docId = xmlDocLut.push(docEl || xmlNode.ownerDocument || xmlNode) - 1;
        if (docEl)
            docEl.setAttribute(this.xmlDocTag, docId);

        if (model)
            apf.nameserver.register("model", docId, model);

        return xmlDocLut.length - 1;
    };
});

//#endif
