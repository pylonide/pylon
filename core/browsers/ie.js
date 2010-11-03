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

// #ifdef __SUPPORT_IE
/**
 * Compatibility layer for Internet Explorer browsers.
 * @private
 */
apf.runIE = function(){
    /* ******** XML Compatibility ************************************************
     Extensions to the xmldb
     ****************************************************************************/
    var hasIE7Security = false,
        hasIESecurity  = false;
    // #ifdef __TP_IFRAME
    if (self.XMLHttpRequest)
        try {
            new XMLHttpRequest()
        }
        catch (e) {
            hasIE7Security = true
        }
    try {
        new ActiveXObject("microsoft.XMLHTTP")
    }
    catch (e) {
        hasIESecurity = true
    }
    // #endif

    /* #ifdef __TP_IFRAME
     if (hasIESecurity)
        apf.importClass(runTpIframe, true, self);
     #endif */
    //#ifndef __PACKAGED
    if (hasIESecurity)
        apf.include(apf.basePath + "teleport/iframe.js");
    //#endif

    apf.getHttpReq = hasIESecurity
        ? function(){
            if (apf.availHTTP.length)
                return apf.availHTTP.pop();

            // #ifdef __DESKRUN
            //if(apf.isDeskrun && !self.useNativeHttp)
            //    return jdshell.CreateComponent("XMLHTTP");
            // #endif

            return new XMLHttpRequest();
        }
        : function(){
            if (apf.availHTTP.length)
                return apf.availHTTP.pop();

            // #ifdef __DESKRUN
            //if(apf.isDeskrun && !apf.useNativeHttp)
            //    return jdshell.CreateComponent("XMLHTTP");
            // #endif

            return new ActiveXObject("microsoft.XMLHTTP");
        };

    apf.getXmlDom = hasIESecurity
        ? function(message, noError){
            var xmlParser = getDOMParser(message, noError);
            return xmlParser;
        }
        : function(message, noError, preserveWhiteSpaces){
            var xmlParser = new ActiveXObject("microsoft.XMLDOM");
            xmlParser.setProperty("SelectionLanguage", "XPath");
            if (preserveWhiteSpaces)
                xmlParser.preserveWhiteSpace = true;

            if (message) {
                if (apf.cantParseXmlDefinition)
                    message = message.replace(/\] \]/g, "] ]")
                                     .replace(/^<\?[^>]*\?>/, "");//replace xml definition <?xml .* ?> for IE5.0

                xmlParser.loadXML(message);

                //#ifdef __WITH_JSON2XML
                if (xmlParser.parseError != 0 && apf.xmldb && apf.isJson(message)) {
                    try {
                        xmlParser = apf.json2Xml(message, noError);
                    }
                   catch(e) {
                        throw new Error(apf.formatErrorString(1051, null,
                           "JSON to XML conversion error occurred."+e.message,
                           "\nSource Text : " + message.replace(/\t/gi, " ")));
                    }
                }
                else
                //#endif
                if (!noError)
                    this.xmlParseError(xmlParser);
            }

            return xmlParser;
        };

    apf.xmlParseError = function(xml){
        var xmlParseError = xml.parseError;
        if (xmlParseError != 0) {
            /*
             http://msdn.microsoft.com/library/en-us/xmlsdk30/htm/xmobjpmexmldomparseerror.asp?frame=true

             errorCode     Contains the error code of the last parse error. Read-only.
             filepos         Contains the absolute file position where the error occurred. Read-only.
             line             Specifies the line number that contains the error. Read-only.
             linepos         Contains the character position within the line where the error occurred. Read-only.
             reason         Explains the reason for the error. Read-only.
             srcText         Returns the full text of the line containing the error. Read-only.
             url             Contains the URL of the XML document containing the last error. Read-only.
             */
            throw new Error(apf.formatErrorString(1050, null,
                "XML Parse error on line " + xmlParseError.line,
                xmlParseError.reason + "Source Text:\n"
                    + xmlParseError.srcText.replace(/\t/gi, " ")
            ));
        }

        return xml;
    };
    
    /**
     * This method retrieves the current value of a property on a HTML element
     * @param {HTMLElement} el    the element to read the property from
     * @param {String}      prop  the property to read
     * @returns {String}
     */
    apf.getStyle = function(el, prop) {
        return el.currentStyle[prop];
    };
  
    apf.insertHtmlNodes = function(nodeList, htmlNode, beforeNode, s){
        var str;
        if (nodeList) {
	        for (str = [], i = 0, l = nodeList.length; i < l; i++)
	            str[i] = nodeList[i].xml;
        }
        str = s || apf.html_entity_decode(str.join(""));
        
        if (apf.isIE < 7)
            str = str.replace(/style="background-image:([^"]*)"/g, 
              "find='$1' style='background-image:$1'");

        try {
            (beforeNode || htmlNode).insertAdjacentHTML(beforeNode
                ? "beforebegin"
                : "beforeend", str);
        }
        catch (e) {
            //IE table hack
            document.body.insertAdjacentHTML("beforeend", "<table><tr>"
                + str + "</tr></table>");

            var x = document.body.lastChild.firstChild.firstChild;
            for (i = x.childNodes.length - 1; i >= 0; i--)
                htmlNode.appendChild(x.childNodes[apf.hasDynamicItemList ? 0 : i]);
        }

        //Fix IE image loading bug
        if (apf.isIE < 7) {
            $setTimeout(function(){
                var nodes = htmlNode.getElementsByTagName("*");
                for (var s, i = 0, l = nodes.length; i < l; i++) {
                    if (s = nodes[i].getAttribute("find"))
                        nodes[i].style.backgroundImage = s.trim(); //@todo apf3.0 why is this needed?
                }
            });
        }
    };
    
    /* I have no idea what below code should do
    
    if (pNode.nodeType == 11) {
        id = xmlNode.getAttribute("id");
        if (!id)
            throw new Error(apf.formatErrorString(1049, null, "xmldb", "Inserting Cache Item in Document Fragment without an ID"));

        document.body.insertAdjacentHTML(beforeNode ? "beforebegin" : "beforeend", strHTML);
        pNode.appendChild(document.getElementById(id));
    }*/
    apf.insertHtmlNode = function(xmlNode, htmlNode, beforeNode, str){
        if (htmlNode.nodeType != 11 && !htmlNode.style)
            return htmlNode.appendChild(xmlNode);
        
        var pNode = beforeNode || htmlNode;
        
        if (!str)
            str = apf.html_entity_decode(xmlNode.serialize
                ? xmlNode.serialize(true)
                : xmlNode.xml || xmlNode.outerHTML || xmlNode.nodeValue);
        try {
            pNode.insertAdjacentHTML(beforeNode 
                ? "beforeBegin" 
                : "beforeEnd", str);
        }
        catch(e) {
            //#ifdef __DEBUG
            apf.console.warn("Warning found block element inside a " 
              + pNode.tagName 
              + " element. Rendering will give unexpected results");
            //#endif
            
            pNode.insertAdjacentHTML("afterEnd", str);
            return pNode.nextSibling;
        }

        if (beforeNode)
            return beforeNode.previousSibling;
        else 
            return htmlNode.lastChild.nodeType == 1 
                ? htmlNode.lastChild 
                : htmlNode.lastChild.previousSibling;
            
    };

    apf.getHtmlLeft = function(oHtml){
        return (oHtml.offsetLeft
            - (apf.isIE > 7 && parseInt(oHtml.parentNode.currentStyle["borderLeftWidth"]) || 0));
    };

    apf.getHtmlRight = function(oHtml){
        var p;
        return (((p = oHtml.offsetParent).tagName == "BODY"
          ? apf.getWindowWidth()
          : p.offsetWidth)
            - oHtml.offsetLeft - oHtml.offsetWidth
            - (apf.isIE < 8 && parseInt(p.currentStyle["borderLeftWidth"]) || 0)
            - (parseInt(p.currentStyle["borderRightWidth"]) || 0));
    };

    apf.getHtmlTop = function(oHtml){
        return (oHtml.offsetTop
            - (apf.isIE > 7 && parseInt(oHtml.offsetParent.currentStyle["borderTopWidth"]) || 0));
    };

    apf.getHtmlBottom = function(oHtml){
        var p;
        return (((p = oHtml.offsetParent).tagName == "BODY"
          ? apf.getWindowHeight()
          : p.offsetHeight)
            - oHtml.offsetTop - oHtml.offsetHeight
            - (apf.isIE < 8 && parseInt(p.currentStyle["borderTopWidth"]) || 0)
            - (parseInt(p.currentStyle["borderBottomidth"]) || 0));
    };

    apf.getBorderOffset = function(oHtml){
        return apf.isIE < 8 && [0,0] || [parseInt(oHtml.currentStyle["borderLeftWidth"]) || 0,
                parseInt(oHtml.currentStyle["borderTopWidth"]) || 0]
    };
    
    apf.getOpacity = function(oHtml) {
        return parseInt(((oHtml.currentStyle["filter"] || "").match(/alpha\(opacity=(\d*)\)/) || [0,0])[1]) / 100;
    };
    
    apf.setOpacity = function(oHtml, value){
        oHtml.style.filter = value == 1
            ? ""
            : "alpha(opacity=" + Math.round(value * 100) + ")";
    };
    
    // #ifdef __WITH_POPUP_IE
    /**
     * @private
     */
    apf.popup2 = {
        cache: {},
        setContent: function(cacheId, content, style, width, height){
            if (!this.popup)
                this.init();

            this.cache[cacheId] = {
                content: content,
                style  : style,
                width  : width,
                height : height
            };
            if (content.parentNode)
                content.parentNode.removeChild(content);
            if (style)
                apf.importCssString(style, this.popup.document);

            return this.popup.document;
        },

        removeContent: function(cacheId){
            this.cache[cacheId] = null;
            delete this.cache[cacheId];
        },

        init: function(){
            this.popup = window.createPopup();

            this.popup.document.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
                <html xmlns="http://www.w3.org/1999/xhtml" xmlns:a=' + apf.ns.aml + ' xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\
                <head>\
                    <script>\
                    var apf = {\
                        all: [],\
                        lookup:function(uniqueId){\
                            return this.all[uniqueId] || {\
                                $setStyleClass:function(){}\
                            };\
                        }\
                    };\
                    function destroy(){\
                        apf.all=null;\
                    }\
                    </script>\
                    <style>\
                    HTML{border:0;overflow:hidden;margin:0}\
                    BODY{margin:0}\
                    </style>\
                </head>\
                <body onmouseover="if(!self.apf) return;if(this.c){apf.all = this.c.all;this.c.Popup.parentDoc=self;}"></body>\
                </html>');

            var c = apf;
            this.popup.document.body.onmousemove = function(){
                this.c = c
            }
        },

        show: function(cacheId, x, y, animate, ref, width, height, callback){
            if (!this.popup)
                this.init();
            var o = this.cache[cacheId];
            //if(this.last != cacheId)
            this.popup.document.body.innerHTML = o.content.outerHTML;

            if (animate) {
                var iVal, steps = 7, i = 0, popup = this.popup;
                iVal = setInterval(function(){
                    var value = ++i * ((height || o.height) / steps);
                    popup.show(x, y, width || o.width, value, ref);
                    popup.document.body.firstChild.style.marginTop
                        = (i - steps - 1) * ((height || o.height) / steps);
                    if (i > steps) {
                        clearInterval(iVal)
                        callback(popup.document.body.firstChild);
                    }
                }, 10);
            }
            else {
                this.popup.show(x, y, width || o.width, height || o.height, ref);
            }

            this.last = cacheId;
        },

        hide: function(){
            if (this.popup)
                this.popup.hide();
        },

        forceHide: function(){
            if (this.last)
                apf.lookup(this.last).dispatchEvent("popuphide");
        },

        destroy: function(){
            if (!this.popup)
                return;
            this.popup.document.body.c = null;
            this.popup.document.body.onmouseover = null;
        }
    };
    //#endif

    //#ifdef __WITH_PRESENTATION
    apf.importClass(apf.runXpath, true, self);
    //#endif
}

// #endif
