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

// #ifdef __SUPPORT_GECKO
/**
 * Compatibility layer for Gecko based browsers.
 * @private
 */
apf.runGecko = function(){
    if (apf.runNonIe)
        apf.runNonIe();

    /* ***************************************************************************
     XSLT
     ****************************************************************************/
    //#ifdef __PARSER_XPATH
    
    //XMLDocument.selectNodes
    HTMLDocument.prototype.selectNodes = XMLDocument.prototype.selectNodes = function(sExpr, contextNode){
        try {
            var oResult = this.evaluate(sExpr, (contextNode || this),
                this.createNSResolver(this.documentElement),
                7, null); //XpathResult.ORDERED_NODE_ITERATOR_TYPE
        }
        catch(ex) {
            var msg = ex.message;
            if (ex.code == ex.INVALID_EXPRESSION_ERR)
                msg = msg.replace(/the expression/i, "'" + sExpr + "'");
            throw new Error(ex.lineNumber, "XPath error: " + msg);
        }

        var nodeList = new Array(oResult.snapshotLength);
        nodeList.expr = sExpr;
        for (var i = nodeList.length - 1; i >= 0; i--) 
            nodeList[i] = oResult.snapshotItem(i);
        return nodeList;
    };
    
    //Element.selectNodes
    Text.prototype.selectNodes =
    Attr.prototype.selectNodes =
    Element.prototype.selectNodes = function(sExpr){
       return this.ownerDocument.selectNodes(sExpr, this);
    };
    
    //XMLDocument.selectSingleNode
    HTMLDocument.prototype.selectSingleNode = 
    XMLDocument.prototype.selectSingleNode = function(sExpr, contextNode){
        try {
            var oResult = this.evaluate(sExpr, (contextNode || this),
                this.createNSResolver(this.documentElement),
                9, null); //XpathResult.FIRST_ORDERED_NODE_TYPE
        }
        catch(ex) {
            var msg = ex.message;
            if (ex.code == ex.INVALID_EXPRESSION_ERR)
                msg = msg.replace(/the expression/i, "'" + sExpr + "'");
            throw new Error(ex.lineNumber, "XPath error: " + msg);
        }
        
        return oResult.singleNodeValue;
    };
    
    //Element.selectSingleNode
    Text.prototype.selectSingleNode =
    Attr.prototype.selectSingleNode =
    Element.prototype.selectSingleNode = function(sExpr){
        return this.ownerDocument.selectSingleNode(sExpr, this);
    };
    
    // #endif
    
    var serializer = new XMLSerializer();
    var o = document.createElement("div");
    apf.insertHtmlNodes = function(nodeList, htmlNode, beforeNode, s) {
        var frag, l, node, i;
        if (nodeList) {
            frag = document.createDocumentFragment();
            for (i = nodeList.length - 1; i >= 0; i--) {
                node = nodeList[i];
                frag.insertBefore(node, frag.firstChild);
            }
        }
        
        o.innerHTML = typeof s == "string" ? s : apf.html_entity_decode(serializer.serializeToString(frag))
            .replace(/<([^>]+)\/>/g, "<$1></$1>");

        frag = document.createDocumentFragment();
        for (i = 0, l = o.childNodes.length; i < l; i++) {
            node = o.childNodes[0];
            frag.appendChild(node);
        }

        if (beforeNode)
            htmlNode.insertBefore(frag, beforeNode);
        htmlNode.appendChild(frag);
    };

    apf.insertHtmlNode = function(xmlNode, htmlNode, beforeNode, s) {
        if (htmlNode.nodeType != 11 && !htmlNode.style)
            return htmlNode.appendChild(xmlNode);
        
        if (!s) {
            s = apf.html_entity_decode(xmlNode.serialize
                ? xmlNode.serialize(true)
                : ((xmlNode.nodeType == 3 || xmlNode.nodeType == 4 || xmlNode.nodeType == 2)
                    ? xmlNode.nodeValue
                    : serializer.serializeToString(xmlNode)));
        }

        o.innerHTML = s.replace(/<([^>]+)\/>/g, "<$1></$1>");

        if (beforeNode)
            htmlNode.insertBefore(o.firstChild, beforeNode);
        else
            htmlNode.appendChild(o.firstChild);

        return beforeNode ? beforeNode.previousSibling : htmlNode.lastChild;
    };
    
    /* ******** Error Compatibility **********************************************
     Error Object like IE
     ****************************************************************************/
    function Error(nr, msg){
        // #ifdef __DEBUG
        if (!apf.$debugwin.nativedebug) 
            apf.$debugwin.errorHandler(msg, "", 0);
        // #endif
        
        this.message = msg;
        this.nr = nr;
    }
    
    apf.getHtmlLeft = function(oHtml){
        return (oHtml.offsetLeft
            + (parseInt(apf.getStyle(oHtml.parentNode, "borderLeftWidth")) || 0));
    };

    apf.getHtmlRight = function(oHtml){
        var p;
        return (((p = oHtml.offsetParent).tagName == "BODY" 
          ? apf.getWindowWidth()
          : p.offsetWidth)
            - oHtml.offsetLeft - oHtml.offsetWidth
            - (2 * (parseInt(apf.getStyle(p, "borderLeftWidth")) || 0))
            - (parseInt(apf.getStyle(p, "borderRightWidth")) || 0));
    };

    apf.getHtmlTop = function(oHtml){
        return (oHtml.offsetTop
            + (parseInt(apf.getStyle(oHtml.parentNode, "borderTopWidth")) || 0));
    };
    
    apf.getHtmlBottom = function(oHtml){
        var p;
        return (((p = oHtml.offsetParent).tagName == "BODY" 
          ? apf.getWindowHeight()
          : p.offsetHeight)
            - oHtml.offsetTop - oHtml.offsetHeight
            - (2 * (parseInt(apf.getStyle(p, "borderTopWidth")) || 0))
            - (parseInt(apf.getStyle(p, "borderBottomWidth")) || 0));
    };

    apf.getBorderOffset = function(oHtml){
        return [-1 * (parseInt(apf.getStyle(oHtml, "borderLeftWidth")) || 0),
            -1 * (parseInt(apf.getStyle(oHtml, "borderTopWidth")) || 0)];
    };
}

//#endif
