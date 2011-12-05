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

// #ifdef __SUPPORT_WEBKIT || __SUPPORT_GECKO
/**
 * @private
 */
apf.runNonIe = function (){
    //#ifdef __SUPPORT_IE_API

    DocumentFragment.prototype.getElementById = function(id){
        return this.childNodes.length ? this.childNodes[0].ownerDocument.getElementById(id) : null;
    };

    //#ifdef __WITH_UIRECORDER
    /**** Event.cancelBubble ****/
    if (!apf.isOpera) {  // @todo, add solution for Opera
        if (MouseEvent.prototype.__defineSetter__) {
            //Event.cancelBubble
            MouseEvent.prototype.__defineSetter__("cancelBubble", function(b){
                if (apf.uirecorder.isRecording || apf.uirecorder.isTesting) {
                    // ignore click event
                    if (this.type != "click")
                        apf.uirecorder.capture[this.type](this);
                }
            });
        }
    }
    //#endif
    
    /**** XML Serialization ****/
    if (XMLDocument.prototype.__defineGetter__) {
        //XMLDocument.xml
        XMLDocument.prototype.__defineGetter__("xml", function(){
            return (new XMLSerializer()).serializeToString(this);
        });
        XMLDocument.prototype.__defineSetter__("xml", function(){
            throw new Error(apf.formatErrorString(1042, null, "XML serializer", "Invalid assignment on read-only property 'xml'."));
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
    }
    
    /* ******** HTML Interfaces **************************************************
        insertAdjacentHTML(), insertAdjacentText() and insertAdjacentElement()
    ****************************************************************************/
    if (typeof HTMLElement!="undefined") {
        if (!HTMLElement.prototype.insertAdjacentElement) {
            Text.prototype.insertAdjacentElement =
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
            Text.prototype.insertAdjacentHTML =
            HTMLElement.prototype.insertAdjacentHTML = function(where,htmlStr){
                var r = this.ownerDocument.createRange();
                r.setStartBefore(apf.isWebkit
                    ? document.body
                    : (self.document ? document.body : this));
                var parsedHTML = r.createContextualFragment(htmlStr);
                this.insertAdjacentElement(where, parsedHTML);
            };
        }

        if (!HTMLBodyElement.prototype.insertAdjacentHTML) //apf.isWebkit)
            HTMLBodyElement.prototype.insertAdjacentHTML = HTMLElement.prototype.insertAdjacentHTML;
    
        if (!HTMLElement.prototype.insertAdjacentText) {
            Text.prototype.insertAdjacentText =
            HTMLElement.prototype.insertAdjacentText = function(where,txtStr){
                var parsedText = document.createTextNode(txtStr);
                this.insertAdjacentElement(where,parsedText);
            };
        }
        
        //HTMLElement.removeNode
        HTMLElement.prototype.removeNode = function(){
            if (!this.parentNode) return;

            this.parentNode.removeChild(this);
        };
        
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
                    .replace(/\s\s+/g, " ").replace(/^\s+|\s+$/g, " ");
            });
            
            HTMLElement.prototype.__defineGetter__("outerHTML", function(){
                return (new XMLSerializer()).serializeToString(this);
            });
        }
    }
    
    /* ******** XML Compatibility ************************************************
        Giving the Mozilla XML Parser the same interface as IE's Parser
    ****************************************************************************/
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
    
    /*try{
        XMLDocument.prototype.readyState = 0;
    }catch(e){}*/
    
    XMLDocument.prototype.$clearDOM = function(){
        while (this.hasChildNodes())
            this.removeChild(this.firstChild);
    };
    
    XMLDocument.prototype.$copyDOM = function(oDoc){
        this.$clearDOM();
        
        if (oDoc.nodeType == 9 || oDoc.nodeType == 11) {
           var oNodes = oDoc.childNodes;
    
           for (var i = 0; i < oNodes.length; i++)
                this.appendChild(this.importNode(oNodes[i], true));
        }
        else if (oDoc.nodeType == 1)
            this.appendChild(this.importNode(oDoc, true));
    };
    
    //XMLDocument.loadXML();
    XMLDocument.prototype.loadXML = function(strXML){
        apf.xmldb.setReadyState(this, 1);
        var sOldXML = this.xml || this.serialize();
        var oDoc    = (new DOMParser()).parseFromString(strXML, "text/xml");
        apf.xmldb.setReadyState(this, 2);
        this.$copyDOM(oDoc);
        apf.xmldb.setReadyState(this, 3);
        apf.xmldb.loadHandler(this);
        return sOldXML;
    };
    
    Node.prototype.getElementById = function(id){};
    
    HTMLElement.prototype.replaceNode = 
    Element.prototype.replaceNode     = function(xmlNode){
        if (!this.parentNode) return;

        this.parentNode.insertBefore(xmlNode, this);
        this.parentNode.removeChild(this);
    };
    
    //XMLDocument.load
    XMLDocument.prototype.$load = XMLDocument.prototype.load;
    XMLDocument.prototype.load  = function(sURI){
        var oDoc = document.implementation.createDocument("", "", null);
        oDoc.$copyDOM(this);
        this.parseError = 0;
        apf.xmldb.setReadyState(this, 1);
    
        try {
            if (this.async == false && ASYNCNOTSUPPORTED) {
                var tmp = new XMLHttpRequest();
                tmp.open("GET", sURI, false);
                tmp.overrideMimeType("text/xml");
                tmp.send(null);
                apf.xmldb.setReadyState(this, 2);
                this.$copyDOM(tmp.responseXML);
                apf.xmldb.setReadyState(this, 3);
            } else
                this.$load(sURI);
        }
        catch (objException) {
            this.parseError = -1;
        }
        finally {
            apf.xmldb.loadHandler(this);
        }
    
        return oDoc;
    };
    
    //#endif
    
    // #ifdef __PARSER_XSLT
    
    //Element.transformNodeToObject
    Element.prototype.transformNodeToObject = function(xslDoc, oResult){
        var oDoc = document.implementation.createDocument("", "", null);
        oDoc.$copyDOM(this);
        oDoc.transformNodeToObject(xslDoc, oResult);
    };
    
    //Document.transformNodeToObject
    Document.prototype.transformNodeToObject = function(xslDoc, oResult){
        var xsltProcessor = null;
        try {
            xsltProcessor = new XSLTProcessor();
            
            if (xsltProcessor.reset) {
                // new nsIXSLTProcessor is available
                xslDoc = apf.getXmlDom(xslDoc.xml || xslDoc.serialize());
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
                throw new Error(apf.formatErrorString(1043, null, "XSLT Transformation", "Failed to transform document. \nInfo : " + e));
            else if (!xslDoc)
                throw new Error(apf.formatErrorString(1044, null, "XSLT Transformation", "No Stylesheet Document was provided. \nInfo : " + e));
            else if (!oResult)
                throw new Error(apf.formatErrorString(1045, null, "XSLT Transformation", "No Result Document was provided. \nInfo : " + e));
            else if (xsltProcessor == null)
                throw new Error(apf.formatErrorString(1046, null, "XSLT Transformation", "Could not instantiate an XSLTProcessor object. \nInfo : " + e));
            else
                throw e;
        }
    };
    
    //Element.transformNode
    Element.prototype.transformNode = function(xslDoc){
        return apf.getXmlDom(this.xml || this.serialize())
            .transformNode(xslDoc);
    };
    
    //Document.transformNode
    Document.prototype.transformNode = function(xslDoc){
        var xsltProcessor = new XSLTProcessor();
        xslDoc        = apf.getXmlDom(xslDoc.xml || xslDoc.serialize());
        xsltProcessor.importStylesheet(xslDoc);
        var newFragment   = xsltProcessor.transformToFragment(this,
            document.implementation.createDocument("", "", null));
    
        return newFragment.xml || newFragment.serialize()
        
        /*try{
            var serializer = new XMLSerializer();
            str = serializer.serializeToString(out);
        }
        catch(e){
            throw new Error("---- APF Error ----\nProcess : XSLT Transformation\nMessage : Failed to serialize result document. \nInfo : " + e);
        }
        
        return str;*/
    };
    
    // #endif
    
    /**
     * This method retrieves the current value of a property on a HTML element
     * @param {HTMLElement} el    the element to read the property from
     * @param {String}      prop  the property to read
     * @returns {String}
     */
    var getStyle = apf.getStyle = function(el, prop) {
        try{
            return (window.getComputedStyle(el, "") || {})[prop] || "";
        }catch(e){}
    };
    
    //XMLDocument.setProperty
    HTMLDocument.prototype.setProperty = 
    XMLDocument.prototype.setProperty  = function(x,y){};
    
    /* ******** XML Compatibility ************************************************
        Extensions to the xmldb
    ****************************************************************************/
    apf.getHttpReq = function(){
        if (apf.availHTTP.length)
            return apf.availHTTP.pop();
        return new XMLHttpRequest();
    };

    apf.getXmlDom = function(message, noError, preserveWhiteSpaces){
        var xmlParser;
        if (message) {
            if (preserveWhiteSpaces === false)
                message = message.replace(/>[\s\n\r]*</g, "><");
            
            xmlParser = new DOMParser();
            xmlParser = xmlParser.parseFromString(message, "text/xml");

            //#ifdef __WITH_JSON2XML
            //xmlParser.documentElement.tagName == "parsererror"
            if (xmlParser.getElementsByTagName("parsererror").length && apf.xmldb
              && apf.isJson(message)) {
                try {
                    xmlParser = apf.json2Xml(message, noError);
                }
                catch(e) {
                    throw new Error(apf.formatErrorString(1051, null,
                        "JSON to XML conversion error occurred.",
                        "\nSource Text : " + message.replace(/\t/gi, " ")));
                }
            }
            else
            //#endif
            if (!noError)
                this.xmlParseError(xmlParser);
        }
        else {
            xmlParser = document.implementation.createDocument("", "", null);
        }
        
        return xmlParser;
    };
    
    apf.xmlParseError = function(xml){
        //if (xml.documentElement.tagName == "parsererror") {
        if (xml.getElementsByTagName("parsererror").length) { 
            var nodeValue = xml.documentElement.firstChild.nodeValue;

            if (nodeValue != null) {
                var str     = nodeValue.split("\n"),
                    linenr  = str[2].match(/\w+ (\d+)/)[1],
                    message = str[0].replace(/\w+ \w+ \w+: (.*)/, "$1");
            } else {
                if(nodeValue = xml.documentElement.firstChild.getElementsByTagName('div')[0].firstChild.nodeValue) {
                    var linenr  = nodeValue.match(/line\s(\d*)/)[1] || "N/A",
                        message = nodeValue.match(/column\s\d*:(.*)/)[1] || "N/A";
                }
                else {
                    var linenr  = "N/A",
                        message = "N/A";
                }
            }

            var srcText = xml.documentElement.lastChild.firstChild,//.split("\n")[0];
                srcMsg  = "";
            if(srcText && srcText.nodeValue) {
                srcMsg = "\nSource Text : " + srcText.nodeValue.replace(/\t/gi, " ")
            }
            throw new Error(apf.formatErrorString(1050, null, 
                "XML Parse Error on line " +  linenr, message + srcMsg));
        }
        
        return xml;
    };

    //#ifdef __WITH_XMLDATABASE
    apf.xmldb.setReadyState = function(oDoc, iReadyState) {
        oDoc.readyState = iReadyState;
        if (oDoc.onreadystatechange != null && typeof oDoc.onreadystatechange == "function")
            oDoc.onreadystatechange();
    };
    
    apf.xmldb.loadHandler = function(oDoc){
        if (!oDoc.documentElement || oDoc.documentElement.tagName == "parsererror")
            oDoc.parseError = -1;
        
        apf.xmldb.setReadyState(oDoc, 4);
    };
    //#endif
    //
    //Fix XML Data-Island Support Problem with Form Tag
    apf.Init.add(function(){
        var i, nodes = document.getElementsByTagName("form");
        for (i = 0; i < nodes.length; i++)
            nodes[i].removeNode();
        nodes = document.getElementsByTagName("xml");
        for(i = 0; i < nodes.length; i++)
            nodes[i].removeNode();
        nodes = null;
    });
    
    /*window.onerror = function(message, filename, linenr){
        if(++ERROR_COUNT > MAXMSG) return;
        filename = filename ? filename.match(/\/([^\/]*)$/)[1] : "[Mozilla Library]";
        new Error("---- APF Error ----\nProcess : Javascript code in '" + filename +  "'\nLine : " + linenr + "\nMessage : " + message);
        return false;
    }*/
    
    if (document.body)
        document.body.focus = function(){};
    
    //#ifdef __WITH_ELEMENT_FROM_POINT
    
    if (!document.elementFromPoint) {
        Document.prototype.elementFromPointRemove = function(el){
            if (!this.RegElements) return;

            this.RegElements.remove(el);
        };
        
        Document.prototype.elementFromPointAdd = function(el){
            if (!this.RegElements)
                this.RegElements = [];
            this.RegElements.push(el);
        };
        
        Document.prototype.elementFromPointReset = function(RegElements){
            //define globals
            FoundValue   = [];
            FoundNode    = null;
            LastFoundAbs = document.documentElement;
        };
        
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
                var calc_z = -1,
                    i, calc, n, sx, sy, ex, ey, z
                for (calc_z = -1, calc, i = 0; i < this.RegElements.length; i++) {
                    n = this.RegElements[i];
                    if (getStyle(n, "display") == "none") continue;
        
                    sx = getElementPosX(n); 
                    sy = getElementPosY(n);
                    ex = sx + n.offsetWidth;
                    ey = sy + n.offsetHeight;
                    
                    if (x > sx && x < ex && y > sy && y < ey) {
                        z = getElementZindex(n);
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
        };
        
        function efpi(from, x, y, CurIndex, CurValue, px, py){
            var StartValue = CurValue,
                StartIndex = CurIndex,
            //Loop through childNodes
                nodes      = from.childNodes,
                n, i, z, sx, sy, ex, ey, isAbs, isHidden, inSpace;
            for (n, i = 0; i < from.childNodes.length; i++) {
                n = from.childNodes[i];
                if (n.nodeType == 1 && getStyle(n, "display") != "none" && n.offsetParent) {
                    sx = px + n.offsetLeft - n.offsetParent.scrollLeft;//getElementPosX(n); 
                    sy = py + n.offsetTop - n.offsetParent.scrollTop;//getElementPosY(n);
                    ex = sx + n.offsetWidth;
                    ey = sy + n.offsetHeight;
                    
                    //if(Child is position absolute/relative and overflow == "hidden" && !inSpace) continue;
                    isAbs    = getStyle(n, "position");
                    isAbs        = (isAbs == "absolute") || (isAbs == "relative");
                    isHidden = getStyle(n, "overflow") == "hidden";
                    inSpace  = (x > sx && x < ex && y > sy && y < ey);

                    if (isAbs && isHidden && !inSpace) continue;
            
                    CurIndex = StartIndex;
                    CurValue = StartValue.copy();
            
                    //if (Child is position absolute/relative and has zIndex) or overflow == "hidden"
                    z = parseInt(getStyle(n, "zIndex")) || 0;
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
                        }
                        else
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
            return myObj.offsetTop + parseInt(apf.getStyle(myObj, "borderTopWidth"))
                + (myObj.offsetParent ? getElementPosY(myObj.offsetParent) : 0);
        }
        
        function getElementPosX(myObj){
            return myObj.offsetLeft + parseInt(apf.getStyle(myObj, "borderLeftWidth"))
                + (myObj.offsetParent ? getElementPosX(myObj.offsetParent) : 0);
        }
        
        function getElementZindex(myObj){
            //This is not quite sufficient and should be changed
            var z = 0, n, p = myObj;
            while (p && p.nodeType == 1) {
                z = Math.max(z, parseInt(getStyle(p, "zIndex")) || -1);
                p = p.parentNode;
            }
            return z;
        }
    }
    
    //#endif

    apf.getOpacity = function(oHtml) {
        return apf.getStyle(oHtml, "opacity");
    };
    
    apf.setOpacity = function(oHtml, value){
        oHtml.style.opacity = value;
    };
}
//#endif
