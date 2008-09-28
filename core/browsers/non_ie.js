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

// #ifdef __SUPPORT_Safari || __SUPPORT_Gecko || __SUPPORT_Safari
function runNonIe(){
    
    //#ifdef __SUPPORT_IE_API || __WITH_APP
    
    /* ******** HTML Interfaces **************************************************
        insertAdjacentHTML(), insertAdjacentText() and insertAdjacentElement()
    ****************************************************************************/
    if (typeof HTMLElement!="undefined") {
        if (!HTMLElement.prototype.insertAdjacentElement) {
            HTMLElement.prototype.insertAdjacentElement = function(where,parsedNode){
                switch (where.toLowerCase()) {
                    case "beforebegin":
                        this.parentNode.insertBefore(parsedNode,this);
                        break;
                    case "afterbegin":
                        this.insertBefore(parsedNode,this.firstChild);
                        break;
                    case "beforeend":
                        this.appendChild(parsedNode);
                        break;
                    case "afterend":
                        if (this.nextSibling)
                            this.parentNode.insertBefore(parsedNode,this.nextSibling);
                        else
                            this.parentNode.appendChild(parsedNode);
                        break;
                }
            };
        }
    
        if (!HTMLElement.prototype.insertAdjacentHTML) {
            HTMLElement.prototype.insertAdjacentHTML = function(where,htmlStr){
                var r = this.ownerDocument.createRange();
                r.setStartBefore(jpf.isSafari ? document.body : this);
                var parsedHTML = r.createContextualFragment(htmlStr);
                this.insertAdjacentElement(where,parsedHTML);
            }
        }
    
        if (!HTMLElement.prototype.insertAdjacentText) {
            HTMLElement.prototype.insertAdjacentText = function(where,txtStr){
                var parsedText = document.createTextNode(txtStr);
                this.insertAdjacentElement(where,parsedText);
            }
        }
        
        //HTMLElement.removeNode
        HTMLElement.prototype.removeNode = function(){
            if (!this.parentNode) return;

            this.parentNode.removeChild(this);
        }
        
        //Currently only supported by Gecko
        if (HTMLElement.prototype.__defineSetter__) {
            //HTMLElement.innerText
            HTMLElement.prototype.__defineSetter__("innerText", function(sText){
                var s = "" + sText;
                this.innerHTML = s.replace(/\&/g, "&amp;")
                    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
            });
        
            HTMLElement.prototype.__defineGetter__("innerText", function(){
                return this.innerHTML.replace(/<[^>]+>/g,"")
                    .replace(/\s\s+/g, " ").replace(/^\s*|\s*$/g, " ")
            });
            
            HTMLElement.prototype.__defineGetter__("outerHTML", function(){
                return (new XMLSerializer()).serializeToString(this);
            });
        }
    }
    
    /* ******** XML Compatibility ************************************************
        Giving the Mozilla XML Parser the same interface as IE's Parser
    ****************************************************************************/
    var IEPREFIX4XSLPARAM = "";
    var ASYNCNOTSUPPORTED = false;
    
    //Test if Async is supported
    try {
        XMLDocument.prototype.async = true;
        ASYNCNOTSUPPORTED           = true;
    } catch(e) {/*trap*/} 
    
    Document.prototype.onreadystatechange = null;
    Document.prototype.parseError         = 0;
    
    Array.prototype.item = function(i){return this[i];};
    Array.prototype.expr = "";
    
    XMLDocument.prototype.readyState = 0;
    
    XMLDocument.prototype.$clearDOM = function(){
        while (this.hasChildNodes())
            this.removeChild(this.firstChild);
    }
    
    XMLDocument.prototype.$copyDOM = function(oDoc){
        this.$clearDOM();
        
        if (oDoc.nodeType == 9 || oDoc.nodeType == 11) {
           var oNodes = oDoc.childNodes;
    
           for (var i = 0; i < oNodes.length; i++)
                this.appendChild(this.importNode(oNodes[i], true));
        } else if(oDoc.nodeType == 1)
            this.appendChild(this.importNode(oDoc, true));
    }
    
    //XMLDocument.loadXML();
    XMLDocument.prototype.loadXML = function(strXML){
        jpf.xmldb.setReadyState(this, 1);
        var sOldXML = this.xml || this.serialize();
        var oDoc    = (new DOMParser()).parseFromString(strXML, "text/xml");
        jpf.xmldb.setReadyState(this, 2);
        this.$copyDOM(oDoc);
        jpf.xmldb.setReadyState(this, 3);
        jpf.xmldb.loadHandler(this);
        return sOldXML;
    };
    
    Node.prototype.getElementById = function(id){}
    
    HTMLElement.prototype.replaceNode = 
    Element.prototype.replaceNode = function(xmlNode){
        if (!this.parentNode) return;

        this.parentNode.insertBefore(xmlNode, this);
        this.parentNode.removeChild(this);
    }
    
    //XMLDocument.load
    XMLDocument.prototype.$load = XMLDocument.prototype.load;
    XMLDocument.prototype.load = function(sURI){
        var oDoc = document.implementation.createDocument("", "", null);
        oDoc.$copyDOM(this);
        this.parseError = 0;
        jpf.xmldb.setReadyState(this, 1);
    
        try {
            if (this.async == false && ASYNCNOTSUPPORTED) {
                var tmp = new XMLHttpRequest();
                tmp.open("GET", sURI, false);
                tmp.overrideMimeType("text/xml");
                tmp.send(null);
                jpf.xmldb.setReadyState(this, 2);
                this.$copyDOM(tmp.responseXML);
                jpf.xmldb.setReadyState(this, 3);
            } else
                this.$load(sURI);
        }
        catch(objException) {
            this.parseError = -1;
        }
        finally {
            jpf.xmldb.loadHandler(this);
        }
    
        return oDoc;
    }
    
    //#endif
    
    // #ifdef __SUPPORT_XSLT
    
    //Element.transformNodeToObject
    Element.prototype.transformNodeToObject = function(xslDoc, oResult){
        var oDoc = document.implementation.createDocument("", "", null);
        oDoc.$copyDOM(this);
        oDoc.transformNodeToObject(xslDoc, oResult);
    }
    
    //Document.transformNodeToObject
    Document.prototype.transformNodeToObject = function(xslDoc, oResult){
        var xsltProcessor = null;
        
        try {
            xsltProcessor = new XSLTProcessor();
            
            if (xsltProcessor.reset) {
                // new nsIXSLTProcessor is available
                var xslDoc = jpf.getXmlDom(xslDoc.xml || xslDoc.serialize());
                xsltProcessor.importStylesheet(xslDoc);
                var newFragment = xsltProcessor.transformToFragment(this, oResult);
                oResult.$copyDOM(newFragment);
            }
            else {
                // only nsIXSLTProcessorObsolete is available
                xsltProcessor.transformDocument(this, xslDoc, oResult, null);
            }
        }
        catch(e) {
            if (xslDoc && oResult)
                throw new Error(jpf.formatErrorString(1043, null, "XSLT Transformation", "Failed to transform document. \nInfo : " + e));
            else if (!xslDoc)
                throw new Error(jpf.formatErrorString(1044, null, "XSLT Transformation", "No Stylesheet Document was provided. \nInfo : " + e));
            else if (!oResult)
                throw new Error(jpf.formatErrorString(1045, null, "XSLT Transformation", "No Result Document was provided. \nInfo : " + e));
            else if (xsltProcessor == null)
                throw new Error(jpf.formatErrorString(1046, null, "XSLT Transformation", "Could not instantiate an XSLTProcessor object. \nInfo : " + e));
            else
                throw e;
        }
    };
    
    //Element.transformNode
    Element.prototype.transformNode = function(xslDoc){
        return jpf.getXmlDom(this.xml || this.serialize())
            .transformNode(xslDoc);
    }
    
    //Document.transformNode
    Document.prototype.transformNode = function(xslDoc){
        var xsltProcessor = new XSLTProcessor();
        var xslDoc        = jpf.getXmlDom(xslDoc.xml || xslDoc.serialize());
        xsltProcessor.importStylesheet(xslDoc);
        var newFragment   = xsltProcessor.transformToFragment(this,
            document.implementation.createDocument("", "", null));
    
        return newFragment.xml || newFragment.serialize()
        
        /*try{
            var serializer = new XMLSerializer();
            str = serializer.serializeToString(out);
        }
        catch(e){
            throw new Error("---- Javeline Error ----\nProcess : XSLT Transformation\nMessage : Failed to serialize result document. \nInfo : " + e);
        }
        
        return str;*/
    }
    
    // #endif
    
    
    //XMLDocument.setProperty
    HTMLDocument.prototype.setProperty = 
    XMLDocument.prototype.setProperty = function(x,y){};
    
    /* ******** XML Compatibility ************************************************
        Extensions to the xmldb
    ****************************************************************************/
    jpf.getHttpReq = function(){
        if (jpf.teleport.availHTTP.length)
            return jpf.teleport.availHTTP.pop();
        return new XMLHttpRequest();
    }

    jpf.getXmlDom = function(message, noError){
        if (message) {
            var xmlParser = new DOMParser();
            xmlParser     = xmlParser.parseFromString(message, "text/xml");

            if (!noError)
                this.xmlParseError(xmlParser);
        }
        else {
            var xmlParser = document.implementation.createDocument("", "", null);
        }
        
        return xmlParser;
    }
    
    jpf.xmlParseError = function(xml){
        if (xml.documentElement.tagName == "parsererror") {
            var str     = xml.documentElement.firstChild.nodeValue.split("\n");
            var linenr  = str[2].match(/\w+ (\d+)/)[1];
            var message = str[0].replace(/\w+ \w+ \w+: (.*)/, "$1");
            
            var srcText = xml.documentElement.lastChild.firstChild.nodeValue.split("\n")[0];
            
            throw new Error(jpf.formatErrorString(1050, null, 
                "XML Parse Error on line " +  linenr, message + 
                "\nSource Text : " + srcText.replace(/\t/gi, " ")));
        }
        
        return xml;
    }
    
    //#ifdef __WITH_APP || __WITH_XMLDATABASE
    if (jpf.XmlDatabase) {
        jpf.XmlDatabase.prototype.htmlImport = function(xmlNode, htmlNode, beforeNode, test){
            if (!htmlNode) alert("No HTML node given in htmlImport:" + this.htmlImport.caller);
            
            if (xmlNode.length != null && !xmlNode.nodeType) {
                for (var str = [], i = 0, l = xmlNode.length; i < l; i++) 
                    str.push(xmlNode[i].serialize());

                str = str.join("").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
                    .replace(/<([^>]+)\/>/g, "<$1></$1>");
                    
                (beforeNode || htmlNode).insertAdjacentHTML(beforeNode 
                    ? "beforebegin" 
                    : "beforeend", str);

                return;
            }
    
            if (htmlNode.ownerDocument != document)
                return htmlNode.insertBefore(xmlNode, beforeNode);
            
            var strHTML = (xmlNode.outerHTML
                || (xmlNode.nodeType == 1 ? xmlNode.serialize() : xmlNode.nodeValue)).replace(/&amp;/g, "&")
                //.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
                
            var pNode = (beforeNode || htmlNode);
            if (pNode.nodeType == 11){
                var id = xmlNode.getAttribute("id");
                if (!id)
                    throw new Error(jpf.formatErrorString(1049, null, "xmldb", "Inserting Cache Item in Document Fragment without an ID"));
                
                document.body.insertAdjacentHTML(beforeNode ? "beforebegin" : "beforeend", strHTML);
                pNode.appendChild(document.getElementById(id));
            }
            else {
                //firefox bug??
                if (xmlNode.tagName.match(/tbody|td|tr/))
                    pNode.insertBefore(pNode.ownerDocument
                        .createElement(xmlNode.tagName.toLowerCase()), beforeNode || null);
                else
                    pNode.insertAdjacentHTML(beforeNode ? "beforebegin" : "beforeend", strHTML);
            }
            
            //#ifdef __DEBUG
            //var retNode = beforeNode ? beforeNode.previousSibling : htmlNode.lastChild;
            //if(!retNode.tagName || retNode.tagName.toLowerCase() != xmlNode.tagName.toLowerCase()) debugger;
            //#endif
            
            return beforeNode ? beforeNode.previousSibling : htmlNode.lastChild;
        }
        
        jpf.XmlDatabase.prototype.setReadyState = function(oDoc, iReadyState) {
            oDoc.readyState = iReadyState;
            if (oDoc.onreadystatechange != null && typeof oDoc.onreadystatechange == "function")
                oDoc.onreadystatechange();
        }
        
        jpf.XmlDatabase.prototype.loadHandler = function(oDoc){
            if (!oDoc.documentElement || oDoc.documentElement.tagName == "parsererror")
                oDoc.parseError = -1;
            
            jpf.xmldb.setReadyState(oDoc, 4);
        }
        
        //Initialize xmldb
        jpf.xmldb = new jpf.XmlDatabase();
    }
    //#endif
    
    //Fix XML Data-Island Support Problem with Form Tag
    jpf.Init.add(function(){
        var i, nodes = document.getElementsByTagName("form");
        for (i = 0; i < nodes.length; i++)
            nodes[i].removeNode();
        nodes = document.getElementsByTagName("xml");
        for(i = 0; i < nodes.length; i++)
            nodes[i].removeNode();
        nodes = null;
    });
    
    //IE Like Error Handling
    MAXMSG      = 3;
    ERROR_COUNT = 0;
    
    /*window.onerror = function(message, filename, linenr){
        if(++ERROR_COUNT > MAXMSG) return;
        filename = filename ? filename.match(/\/([^\/]*)$/)[1] : "[Mozilla Library]";
        new Error("---- Javeline Error ----\nProcess : Javascript code in '" + filename +  "'\nLine : " + linenr + "\nMessage : " + message);
        return false;
    }*/
    
    if (document.body)
        document.body.focus = function(){};
    
    /*
    //CurIndex = 0;
    //CurValue is []
    //FoundValue is []
    //FoundNode is null
    //Loop through childNodes
    //if(Child is position absolute/relative and overflow == "hidden" && !inSpace) continue;
    
    //if (Child is position absolute/relative and has zIndex) or overflow == "hidden"
        //if(!is position absolute/relative) zIndex = 0
        //if zIndex >= FoundValue[CurIndex] 
            //if zIndex > CurValue[CurIndex];
                //clear all CurValue values after CurIndex
                //set CurValue[CurIndex] = zIndex
            //CurIndex++
            //if(inSpace && CurIndex >= FoundValue.length)
                //Set FoundNode is currentNode
                //Set FoundValue is CurValue
        //else continue; //Ignore this treedepth
    //else if CurValue[CurIndex] continue; //Ignore this treedepth
    
    //loop through childnodes recursively
    */
    
    if (!document.elementFromPoint) {
        Document.prototype.elementFromPointRemove = function(el){
            if (!this.RegElements) return;

            this.RegElements.remove(el);
        }
        
        Document.prototype.elementFromPointAdd = function(el){
            if (!this.RegElements)
                this.RegElements = [];
            this.RegElements.push(el);
        }
        
        Document.prototype.elementFromPointReset = function(RegElements){
            //define globals
            FoundValue   = [];
            FoundNode    = null;
            LastFoundAbs = document.documentElement;
        }
        
        Document.prototype.elementFromPoint = function(x, y){
            // Optimization, Keeping last found node makes it ignore all lower levels 
            // when there is no possibility of changing positions and zIndexes
            /*if(self.FoundNode){
                var sx = getElementPosX(FoundNode); 
                var sy = getElementPosY(FoundNode);
                var ex = sx + FoundNode.offsetWidth; var ey = sy + FoundNode.offsetHeight;
            }
            if(!self.FoundNode || !(x > sx && x < ex && y > sy && y < ey))*/
                document.elementFromPointReset();
        
            // Optimization only looking at registered nodes
            if (this.RegElements) {
                for (var calc_z = -1, calc, i = 0; i < this.RegElements.length; i++) {
                    var n = this.RegElements[i];
                    if (getStyle(n, "display") == "none") continue;
        
                    var sx = getElementPosX(n); 
                    var sy = getElementPosY(n);
                    var ex = sx + n.offsetWidth;
                    var ey = sy + n.offsetHeight;
                    
                    if (x > sx && x < ex && y > sy && y < ey) {
                        var z = getElementZindex(n);
                        if (z > calc_z) { //equal z-indexes not supported
                            calc   = [n, x, y, sx, sy];
                            calc_z = z;
                        }
                    }
                }
                
                if (calc) {
                    efpi(calc[0], calc[1], calc[2], 0, FoundValue, calc[3], calc[4]);
                    if (!FoundNode) {
                        FoundNode    = calc[0];
                        LastFoundAbs = calc[0];
                        FoundValue   = [calc_z];
                    }
                }
            }
            
            if (!this.RegElements || !this.RegElements.length)
                efpi(document.body, x, y, 0, [], getElementPosX(document.body),
                    getElementPosY(document.body));
                
            return FoundNode;
        }
        
        function getStyle(el, prop) {
            return document.defaultView.getComputedStyle(el,'').getPropertyValue(prop);
        }
        
        function efpi(from, x, y, CurIndex, CurValue, px, py){
            var StartValue = CurValue;
            var StartIndex = CurIndex;
            
            //Loop through childNodes
            var nodes = from.childNodes;
            for(var n, i = 0; i < from.childNodes.length; i++) {
                n = from.childNodes[i];
                if (n.nodeType == 1 && getStyle(n, 'display') != 'none' && n.offsetParent) {
                    var sx = px + n.offsetLeft - n.offsetParent.scrollLeft;//getElementPosX(n); 
                    var sy = py + n.offsetTop - n.offsetParent.scrollTop;//getElementPosY(n);
                    var ex = sx + n.offsetWidth;
                    var ey = sy + n.offsetHeight;
                    
                    //if(Child is position absolute/relative and overflow == "hidden" && !inSpace) continue;
                    var isAbs    = getStyle(n, "position");
                    isAbs        = (isAbs == "absolute") || (isAbs == "relative");
                    var isHidden = getStyle(n, "overflow") == "hidden";
                    var inSpace  = (x > sx && x < ex && y > sy && y < ey);

                    if (isAbs && isHidden && !inSpace) continue;
            
                    CurIndex = StartIndex;
                    CurValue = StartValue.copy();
            
                    //if (Child is position absolute/relative and has zIndex) or overflow == "hidden"
                    var z = parseInt(getStyle(n, "z-index")) || 0;
                    if (isAbs && (z || z == 0) || isHidden) {
                        //if(!is position absolute/relative) zIndex = 0
                        if (!isAbs) z = 0;
                        
                        //if zIndex >= FoundValue[CurIndex] 
                        if (z >= (FoundValue[CurIndex] || 0)) {
                            //if zIndex > CurValue[CurIndex];
                            if (z > (CurValue[CurIndex] || 0)) {
                                //CurValue = StartValue.copy();
                                
                                //set CurValue[CurIndex] = zIndex
                                CurValue[CurIndex] = z;
                            }
                            
                            CurIndex++;
                            
                            //if(inSpace && CurIndex >= FoundValue.length)
                            if (inSpace && CurIndex >= FoundValue.length) {
                                //Set FoundNode is currentNode
                                FoundNode = n;
                                //Set FoundValue is CurValue
                                FoundValue = CurValue;//.copy();
                                
                                LastFoundAbs = n;
                            }
                        } else
                            continue; //Ignore this treedepth
                    }
                    else if(inSpace && CurIndex >= FoundValue.length){
                        //else if CurValue[CurIndex] continue; //Ignore this treedepth
                        //else if(CurValue[CurIndex]) continue;
                        
                        //Set FoundNode is currentNode
                        FoundNode = n;
                        //Set FoundValue is CurValue
                        FoundValue = CurValue;//.copy();
                    }
                    
                    //loop through childnodes recursively
                    efpi(n, x, y, CurIndex, CurValue, isAbs ? sx : px, isAbs ? sy : py)
                }
            }
        }
        
        function getElementPosY(myObj){
            return myObj.offsetTop + parseInt(jpf.getStyle(myObj, "border-top-width"))
                + (myObj.offsetParent ? getElementPosY(myObj.offsetParent) : 0);
        }
        
        function getElementPosX(myObj){
            return myObj.offsetLeft + parseInt(jpf.getStyle(myObj, "border-left-width"))
                + (myObj.offsetParent ? getElementPosX(myObj.offsetParent) : 0);
        }
        
        function getElementZindex(myObj){
            //This is not quite sufficient and should be changed
            var z = 0, n, p = myObj;
            while(p && p.nodeType == 1){
                z = Math.max(z, parseInt(getStyle(p, "z-index")) || -1);
                p = p.parentNode;
            }
            return z;
        }
    }
    
    jpf.Init.run('xmldb');

}
//#endif