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

// #ifdef __WITH_XML_UTIL
/**
 * Determines whether a node is a child of another node.
 *
 * @param {DOMNode} pNode      the potential parent element.
 * @param {DOMNode} childnode  the potential child node.
 * @param {Boolean} [orItself] whether the method also returns true when pNode is the childnode.
 * @return  {Number} the child position of the node. Or false if it's not a child.
 */
apf.isChildOf = function(pNode, childnode, orItself){
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
apf.isOnlyChild = function(node, nodeType){
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
 * Gets the position of a dom node within the list of child nodes of it's
 * parent.
 *
 * @param {DOMNode} node the node for which the child position is determined.
 * @return {Number} the child position of the node.
 */
apf.getChildNumber = function(node, sameTagname){
    var p = node.parentNode, j = 0;
    if (!p) return 0;
    for (var i = 0; i < p.childNodes.length; i++) {
        if (p.childNodes[i] == node)
            return j;
        if (!sameTagname || node.nodeType == 1 && node.tagName == p.childNodes[i].tagName)
            j++;
    }
    return j;
};

/**
 * Integrates nodes as children of a parent. Optionally attributes are
 * copied as well.
 *
 * @param {XMLNode} xmlNode the data to merge.
 * @param {XMLNode} parent  the node to merge on.
 * @param {Object}  options
 *   Properties:
 *   {Boolean} [copyAttributes] whether the attributes of xmlNode are copied as well.
 *   {Boolean} [clearContents]  whether the contents of parent is cleared.
 *   {Number}  [start]          This feature is used for the virtual viewport. More information will follow.
 *   {Number}  [length]         This feature is used for the virtual viewport. More information will follow.
 *   {Number}  [documentId]     This feature is used for the virtual viewport. More information will follow.
 *   {XMLElement} [marker]      This feature is used for the virtual viewport. More information will follow.
 * @return  {XMLNode}  the created xml node
 */
apf.mergeXml = function(XMLRoot, parentNode, options){
    if (typeof parentNode != "object")
        parentNode = getElementById(parentNode);

    if (options && options.clearContents) {
        //Signal listening elements
        var node, j, i, nodes = parentNode.selectNodes("descendant::node()[@" + apf.xmldb.xmlListenTag + "]");
        for (i = nodes.length - 1; i >= 0; i--) {
            var s = nodes[i].getAttribute(apf.xmldb.xmlListenTag).split(";");
            for (j = s.length - 1; j >= 0; j--) {
                node = apf.all[s[j]];
                if (node.dataParent && node.dataParent.xpath)
                    node.dataParent.parent.signalXmlUpdate[node.$uniqueId] = true;
                else if (node.$model)
                    node.$model.$waitForXml(node);
            }
        }
        
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
                  .setAttribute(apf.xmldb.xmlIdTag, options.documentId + "|" + (reserved + i));
            }
        }
        else {
            for (i = nodes.length - 1; i >= 0; i--) {
                parentNode.insertBefore(nodes[0], beforeNode)
                  .setAttribute(apf.xmldb.xmlIdTag, options.documentId + "|" + (reserved + i));
            }
        }
    }
    else
    // #endif
    {
        beforeNode = options.beforeNode || apf.getNode(parentNode, [0]);
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
            if (attr[i].nodeName != apf.xmldb.xmlIdTag)
                parentNode.setAttribute(attr[i].nodeName, attr[i].nodeValue);
    }

    return parentNode;
};

/**
 * Sets the nodeValue of a dom node.
 *
 * @param {XMLElement} xmlNode       the xml node that should receive the nodeValue. When an element node is passed the first text node is set.
 * @param {String}     nodeValue     the value to set.
 * @param {Boolean}    applyChanges  whether the changes are propagated to the databound elements.
 * @param {UndoObj}    undoObj       the undo object that is responsible for archiving the changes.
 */
apf.setNodeValue = function(xmlNode, nodeValue, applyChanges, options){
    if (!xmlNode)
        return;
    
    var undoObj, xpath, newNodes;
    if (options) {
        undoObj  = options.undoObj;
        xpath    = options.xpath;
        newNodes = options.newNodes;
        
        undoObj.extra.oldValue = options.forceNew
            ? ""
            : apf.queryValue(xmlNode, xpath);

        undoObj.xmlNode        = xmlNode;
        if (xpath)
            xmlNode = apf.createNodeFromXpath(xmlNode, xpath, newNodes, options.forceNew);

        undoObj.extra.appliedNode = xmlNode;
    }
    
    if (xmlNode.nodeType == 1) {
        if (!xmlNode.firstChild)
            xmlNode.appendChild(xmlNode.ownerDocument.createTextNode("-"));

        xmlNode.firstChild.nodeValue = apf.isNot(nodeValue) ? "" : nodeValue;

        if (applyChanges)
            apf.xmldb.applyChanges("synchronize", xmlNode, undoObj);
    }
    else {
        xmlNode.nodeValue = apf.isNot(nodeValue) ? "" : nodeValue;

        if (applyChanges)
            apf.xmldb.applyChanges("synchronize", xmlNode.parentNode
                || xmlNode.ownerElement || xmlNode.selectSingleNode(".."),
                undoObj);
    }
};

/**
 * Sets a value of an XMLNode based on an xpath statement executed on the data of this model.
 *
 * @param  {String}  xpath  the xpath used to select a XMLNode.
 * @param  {String}  value  the value to set.
 * @return  {XMLNode}  the changed XMLNode
 */
apf.setQueryValue = function(xmlNode, xpath, value){
    var node = apf.createNodeFromXpath(xmlNode, xpath);
    if (!node)
        return null;

    apf.setNodeValue(node, value, true);
    //apf.xmldb.setTextNode(node, value);
    return node;
};

/**
 * Queries an xml node using xpath for a string value.
 * @param {XMLElement} xmlNode the xml element to query.
 * @param {String}     xpath   the xpath query.
 * @return {String} the value of the query result or empty string.
 */
apf.queryValue = function (xmlNode, xpath){
    if (!xmlNode) 
        return "";
    if (xmlNode.nodeType == 2) 
        return xmlNode.nodeValue;

    if (xpath) {
        xmlNode = xmlNode.selectSingleNode(xpath);
        if (!xmlNode) 
            return "";
    }
   return xmlNode.nodeType == 1
        ? (!xmlNode.firstChild ? "" : xmlNode.firstChild.nodeValue)
        : xmlNode.nodeValue;
};

/**
 * Queries an xml node using xpath for a string value.
 * @param {XMLElement} xmlNode the xml element to query.
 * @param {String}     xpath   the xpath query.
 * @return {Arary} list of values which are a result of the query.
 */
apf.queryValues = function(xmlNode, xpath){
    var out = [];
    if (!xmlNode) return out;

    var nodes = xmlNode.selectNodes(xpath);
    if (!nodes.length) return out;

    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.nodeType == 1)
            n = n.firstChild;
        out.push(n.nodeValue || "");
    }
    return out;
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
apf.queryNodes = function(sExpr, contextNode){
    if (contextNode && (apf.hasXPathHtmlSupport && contextNode.selectSingleNode || !contextNode.style))
        return contextNode.selectNodes(sExpr); //IE55
    //if (contextNode.ownerDocument != document)
    //    return contextNode.selectNodes(sExpr);

    return apf.XPath.selectNodes(sExpr, contextNode)
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
apf.queryNode = function(sExpr, contextNode){
    if (contextNode && (apf.hasXPathHtmlSupport && contextNode.selectSingleNode || !contextNode.style))
        return contextNode.selectSingleNode(sExpr); //IE55
    //if (contextNode.ownerDocument != document)
    //    return contextNode.selectSingleNode(sExpr);

    var nodeList = apf.queryNodes(sExpr + (apf.isIE ? "" : "[1]"),
        contextNode ? contextNode : null);
    return nodeList.length > 0 ? nodeList[0] : null;
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
apf.getInheritedAttribute = function(xml, attr, func){
    var result, avalue;

    //@todo optimize this and below
    if (xml.nodeValue != 1)
        xml = xml.parentNode;

    while (xml && (xml.nodeType != 1 || !(result = attr 
      && ((avalue = xml.getAttribute(attr)) || typeof avalue == "string") 
      || func && func(xml)))) {
        xml = xml.parentNode;
    }
    if (avalue == "")
        return "";

    return !result && attr && apf.config
        ? apf.config[attr]
        : result;
};

/**
 * Creates an xml node based on an xpath statement.
 *
 * @param {DOMNode} contextNode  the dom node that is subject to the query.
 * @param {String}  xPath        the xpath query.
 * @param {Array}   [addedNodes] this array is filled with the nodes added.
 * @param {Boolean} [forceNew]   whether a new node is always created.
 * @return {DOMNode} the last element found.
 * @todo generalize this to include attributes in if format []
 */
apf.createNodeFromXpath = function(contextNode, xPath, addedNodes, forceNew){
    var xmlNode, foundpath = "", paths = xPath.replace(/('.*?')|(".*?")|\|/g, function(m, m1, m2){
        if (m1 || m2) return m1 || m2;
        return "-%-|-%-";
    }).split("-%-|-%-")[0].split("/");
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
            throw new Error(apf.formatErrorString(1041, this, 
                "Select via xPath", 
                "Could not use xPath to create xmlNode: " + xPath));
        }
        if (!isAddId && paths[i].match(/\/\//)) {
            throw new Error(apf.formatErrorString(1041, this, 
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

    var newNode, lastpath = paths[len], 
        doc = contextNode.nodeType == 9 ? contextNode : contextNode.ownerDocument;
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
                .appendChild(doc.createElement(lastpath));
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
 */
apf.convertMethods = {
    /**
     * Gets a JSON object containing all the name/value pairs of the elements
     * using this element as it's validation group.
     *
     * @return  {String}  the string representation of a the json object
     */
    "json": function(xml){
        return JSON.stringify(apf.xml2json(xml));
        /*
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

        return filled ? result : apf.queryValue(xml, "text()");*/
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
                        + escape(attr[i].nodeValue));
                else
                    str.push(attr[i].nodeName + "="
                        + escape(attr[i].nodeValue));
            }
        }

        if (str.length)
            return str.join("&");

        value = apf.queryValue(xml, "text()");
        if (basename && value)
            return basename + "=" + escape(value);
    },

    "cgiobjects": function(xml, basename, isSub){
        if (!basename)
            basename = "";
        
        var str = [], value, nodes = xml.childNodes, done = {};
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.nodeType != 1)
                continue;

            var name = node.tagName; //@hack
            if (name == "revision")
                continue;

            var isOnlyChild = apf.isOnlyChild(node.firstChild, [3,4]);
            var count       = 0;

            //array
            if (!node.attributes.length && !isOnlyChild) {
                var lnodes = node.childNodes;
                for (var nm, j = 0, l = lnodes.length; j < l; j++) {
                    if (lnodes[j].nodeType != 1)
                        continue;
                    
                    nm = basename + (isSub ? "[" : "") + name + (isSub ? "]" : "") + "[" + i + "]";
                    value = this.cgiobjects(lnodes[j], nm, true);
                    if (value)
                        str.push(value);
                        
                    if (apf.isOnlyChild(lnodes[j].firstChild, [3,4]))
                        str.push(nm + "[" + lnodes[j].tagName + "]" + "=" 
                            + escape(lnodes[j].firstChild.nodeValue));
                    
                    var k, a, attr = lnodes[j].attributes;
                    for (k = 0; k < attr.length; k++) {
                        if (!(a = attr[k]).nodeValue)
                            continue;
                        
                        str.push(nm + "[" + a.nodeName + "]=" 
                            + escape(a.nodeValue));
                    }
                }
            }
            //single value
            else {
                if (isOnlyChild)
                    str.push(basename + (isSub ? "[" : "") + name + (isSub ? "]" : "") + "=" 
                        + escape(node.firstChild.nodeValue));
                
                var a, attr = node.attributes;
                for (j = 0; j < attr.length; j++) {
                    if (!(a = attr[j]).nodeValue)
                        continue;
                    
                    str.push(basename + (isSub ? "[" : "") + name + "_" + a.nodeName + (isSub ? "]" : "") + "=" 
                        + escape(a.nodeValue));
                }
            }
        }
        
        if (!isSub && xml.getAttribute("id"))
            str.push("id=" + escape(xml.getAttribute("id")));

        if (str.length)
            return str.join("&");
    }
};

/**
 * Converts xml to another format.
 *
 * @param {XMLElement} xml  the {@link term.datanode data node} to convert.
 * @param {String}     to   the format to convert the xml to.
 *   Possible values:
 *   json       converts to a json string
 *   cgivars    converts to cgi string.
 *   cgiobjects converts to cgi objects
 * @return {String} the result of the conversion.
 */
apf.convertXml = function(xml, to){
    return apf.convertMethods[to](xml);
};

/**
 * Returns the first text or cdata child of an {@link term.datanode data node}.
 *
 * @param {XMLElement} x the xml node to search.
 * @return {XMLNode} the found xml node, or null.
 */
apf.getTextNode = function(x){
    for (var i = 0; i < x.childNodes.length; i++) {
        if (x.childNodes[i].nodeType == 3 || x.childNodes[i].nodeType == 4)
            return x.childNodes[i];
    }
    return false;
};

/**
 * @private
 */
apf.getBoundValue = function(amlNode, xmlRoot, applyChanges){
    if (!xmlRoot && !amlNode.xmlRoot)
        return "";

    var xmlNode = amlNode.$getDataNode("value", amlNode.xmlRoot);

    return xmlNode ? apf.queryValue(xmlNode) : "";
};

/**
 * @private
 */
apf.getArrayFromNodelist = function(nodelist){
    for (var nodes = [], j = 0; j < nodelist.length; j++)
        nodes.push(nodelist[j]);
    return nodes;
};

apf.serializeChildren = function(xmlNode){
    var s = [], nodes = xmlNode.childNodes;
    for (var node, i = 0, l = nodes.length; i < l; i++) {
        s[i] = (node = nodes[i]).nodeType == 1 
            ? node.xml || node.serialize()
            : (node.nodeType == 8 ? "" : node.nodeValue);
    }
    return s.join("");
}

/**
 * Returns a string version of the {@link term.datanode data node}.
 *
 * @param {XMLElement} xmlNode the {@link term.datanode data node} to serialize.
 * @return {String} the serilized version of the {@link term.datanode data node}.
 */
apf.getXmlString = function(xmlNode){
    var xml = apf.xmldb.cleanNode(xmlNode.cloneNode(true));
    return xml.xml || xml.serialize();
};

/**
 * Creates xml nodes from an xml string recursively.
 *
 * @param {String}  strXml     the xml definition.
 * @param {Boolean} [noError]  whether an exception should be thrown by the parser when the xml is not valid.
 * @param {Boolean} [preserveWhiteSpace]  whether whitespace that is present between XML elements should be preserved
 * @return {XMLNode} the created xml node.
 */
apf.getXml = function(strXml, noError, preserveWhiteSpace){
    return apf.getXmlDom(strXml, noError, preserveWhiteSpace).documentElement;
};

/**
 * Formats an xml string with good indentation. Also known as pretty printing.
 * @param {String} strXml the xml to format.
 * @return {String} the formatted string.
 */
apf.formatXml = function(strXml){
    strXml = strXml.trim();

    var lines = strXml.split("\n");
    for (var i = 0; i < lines.length; i++)
        lines[i] = lines[i].trim();
    lines = lines.join("\n").replace(/\>\n/g, ">").replace(/\>/g, ">\n")
        .replace(/\n\</g, "<").replace(/\</g, "\n<").split("\n");
    lines.removeIndex(0);//test if this is actually always fine
    lines.removeIndex(lines.length);

    for (var depth = 0, i = 0; i < lines.length; i++)
        lines[i] = "    ".repeat((lines[i].match(/^\s*\<\//)
            ? (depth==0)?0:--depth
            : (lines[i].match(/^\s*\<[^\?][^>]+[^\/]\>/) ? depth++ : depth))) + lines[i];
    if (!strXml) return "";

    return lines.join("\n");
};

//@todo this function needs to be 100% proof, it's the core of the system
//for RSB: xmlNode --> Xpath statement
apf.xmlToXpath = function(xmlNode, xmlContext, useJid){
    if (!xmlNode) //@todo apf3.0
        return "";
    
    if (useJid === true && xmlNode.nodeType == 1 && xmlNode.getAttribute(apf.xmldb.xmlIdTag)) {
        return "//node()[@" + apf.xmldb.xmlIdTag + "='" 
            + xmlNode.getAttribute(apf.xmldb.xmlIdTag) + "']";
    }

    if (apf != this && this.lookup && this.select) {
        var def = this.lookup[xmlNode.tagName];
        if (def) {
            //unique should not have ' in it... -- can be fixed...
            var unique = xmlNode.selectSingleNode(def).nodeValue;
            return "//" + xmlNode.tagName + "[" + def + "='" + unique + "']";
        }
        
        for (var i = 0; i < this.select.length; i++) {
            if (xmlNode.selectSingleNode(this.select[i][0])) {
                var unique = xmlNode.selectSingleNode(this.select[i][1]).nodeValue;
                return "//" + this.select[i][0] + "[" + this.select[i][1]
                    + "='" + unique + "']";
            }
        }
    }

    if (xmlNode == xmlContext)
        return ".";

    if (!xmlNode.parentNode) {
        //#ifdef __DEBUG
        throw new Error(apf.formatErrorString(0, null, 
            "Converting XML to Xpath", 
            "Error xml node without parent and non matching context cannot\
             be converted to xml.", xmlNode));
        //#endif
        
        return false;
    }

    var str = [], lNode = xmlNode;
    if (lNode.nodeType == 2) {
        str.push("@" + lNode.nodeName);
        lNode = lNode.ownerElement || xmlNode.selectSingleNode("..");
    }
    
    var id;
    do {
        str.unshift((lNode.nodeType == 1 ? lNode.tagName : "text()") 
            + "[" + (useJid && (id = lNode.nodeType == 1 && lNode.getAttribute(apf.xmldb.xmlIdTag))
                ? "@" + apf.xmldb.xmlIdTag + "='" + id + "'"
                : (apf.getChildNumber(lNode, true) + 1))
             + "]");
        lNode = lNode.parentNode;
    } while(lNode && lNode.nodeType == 1 && lNode != xmlContext);

    return str.join("/");
};
    
//for RSB: Xpath statement --> xmlNode
apf.xpathToXml = function(xpath, xmlNode){
    if (!xmlNode) {
        //#ifdef __DEBUG
        throw new Error(apf.formatErrorString(0, null, 
            "Converting Xpath to XML", 
            "Error context xml node is empty, thus xml node cannot \
             be found for '" + xpath + "'"));
        //#endif
        
        return false;
    }
    
    return xmlNode.selectSingleNode(xpath);
};

// #endif
