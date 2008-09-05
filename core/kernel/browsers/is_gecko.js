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

// #ifdef __SUPPORT_Gecko
function runGecko(){

    jpf.importClass(runNonIe, true, self);
    
    DocumentFragment.prototype.getElementById = function(id){
        return this.childNodes.length ? this.childNodes[0].ownerDocument.getElementById(id) : null;
    }
    
    /* ***************************************************************************
     XML Serialization
     ****************************************************************************/
    //XMLDocument.xml
    XMLDocument.prototype.__defineGetter__("xml", function(){
        return (new XMLSerializer()).serializeToString(this);
    });
    XMLDocument.prototype.__defineSetter__("xml", function(){
        throw new Error(jpf.formatErrorString(1042, null, "XML serializer", "Invalid assignment on read-only property 'xml'."));
    });
    
    //Node.xml
    Node.prototype.__defineGetter__("xml", function(){
        if (this.nodeType == 3 || this.nodeType == 4 || this.nodeType == 2) 
            return this.nodeValue;
        return (new XMLSerializer()).serializeToString(this);
    });
    
    //Node.xml
    Element.prototype.__defineGetter__("xml", function(){
        return (new XMLSerializer()).serializeToString(this);
    });
    
    /* ***************************************************************************
     XSLT
     ****************************************************************************/
    //#ifdef __SUPPORT_XPATH
    
    //XMLDocument.selectNodes
    HTMLDocument.prototype.selectNodes = XMLDocument.prototype.selectNodes = function(sExpr, contextNode){
        var oResult = this.evaluate(sExpr, (contextNode ? contextNode : this),
            this.createNSResolver(this.documentElement),
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var nodeList = new Array(oResult.snapshotLength);
        nodeList.expr = sExpr;
        for (var i = 0; i < nodeList.length; i++) 
            nodeList[i] = oResult.snapshotItem(i);
        return nodeList;
    }
    
    //Element.selectNodes
    Element.prototype.selectNodes = function(sExpr){
        var doc = this.ownerDocument;
        if (doc.selectNodes) 
            return doc.selectNodes(sExpr, this);
        else 
            throw new Error(jpf.formatErrorString(1047, null, "xPath selection", "Method selectNodes is only supported by XML Nodes"));
    };
    
    //XMLDocument.selectSingleNode
    HTMLDocument.prototype.selectSingleNode = XMLDocument.prototype.selectSingleNode = function(sExpr, contextNode){
        var nodeList = this.selectNodes(sExpr + "[1]", contextNode ? contextNode : null);
        return nodeList.length > 0 ? nodeList[0] : null;
    }
    
    //Element.selectSingleNode
    Element.prototype.selectSingleNode = function(sExpr){
        var doc = this.ownerDocument;
        if (doc.selectSingleNode) 
            return doc.selectSingleNode(sExpr, this);
        else 
            throw new Error(jpf.formatErrorString(1048, null, "XPath Selection", "Method selectSingleNode is only supported by XML Nodes. \nInfo : " + e));
    };
    
    // #endif
    
    /* ******** Error Compatibility **********************************************
     Error Object like IE
     ****************************************************************************/
    function Error(nr, msg){
        // #ifdef __DEBUG
        if (!jpf.debugwin.useDebugger) 
            jpf.debugwin.errorHandler(msg, "", 0);
        // #endif
        
        this.message = msg;
        this.nr = nr;
    }
    
    /* ******** XML Compatibility ************************************************
     Extensions to the xmldb
     ****************************************************************************/
    //#ifdef __WITH_APP || __WITH_XMLDATABASE
    
    if (jpf.XmlDatabase) {
        jpf.XmlDatabase.prototype.htmlImport = function(xmlNode, htmlNode, beforeNode, test){
            if (!htmlNode) 
                alert(this.htmlImport.caller);
            
            if (xmlNode.length != null && !xmlNode.nodeType) {
                for (var str = '', i = 0; i < xmlNode.length; i++) 
                    str += xmlNode[i].xml;
                var str = str.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
                    .replace(/&amp;/g, "&").replace(/<([^>]+)\/>/g, "<$1></$1>");
                (beforeNode || htmlNode).insertAdjacentHTML(beforeNode
                    ? "beforebegin"
                    : "beforeend", str);
                
                return;
            }
            
            if (htmlNode.ownerDocument != document) 
                return htmlNode.insertBefore(xmlNode, beforeNode);
            
            var strHTML = (xmlNode.outerHTML || (xmlNode.nodeType == 1 ? xmlNode.xml : xmlNode.nodeValue))
                //.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
            
            var pNode = (beforeNode || htmlNode);
            if (pNode.nodeType == 11) {
                var id = xmlNode.getAttribute("id");
                if (!id) 
                    throw new Error(jpf.formatErrorString(1049, null, "xmldb", "Inserting Cache Item in Document Fragment without an ID"));
                
                document.body.insertAdjacentHTML(beforeNode ? "beforebegin" : "beforeend", strHTML);
                pNode.appendChild(document.getElementById(id));
            }
            else {
                if (xmlNode.tagName.match(/tbody|td|tr/)) 
                    pNode.insertBefore(pNode.ownerDocument
                        .createElement(xmlNode.tagName.toLowerCase()), beforeNode || null);
                else 
                    pNode.insertAdjacentHTML(beforeNode ? "beforebegin" : "beforeend", strHTML);
            }
            
            return beforeNode ? beforeNode.previousSibling : htmlNode.lastChild;
        }
    }
    
    //#endif

}

//#endif
