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
function runIE(){

    /* ******** XML Compatibility ************************************************
     Extensions to the XMLDatabase
     ****************************************************************************/
    var hasIE7Security = hasIESecurity = false;
    // #ifdef __TP_IFRAME
    if (self.XLMHttpRequest) 
        try {
            new XLMHttpRequest()
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
     if(hasIESecurity) jpf.importClass(function(){
         __CONTENT_IFRAME
     }, true, self);
     #else*/
    if (hasIESecurity) 
        include(BASEPATH + "Library/TelePort/IFRAME.js");
    //#endif
    
    jpf.getObject = hasIESecurity
        ? function(type, message, no_error, isDataIsland){
            if (type == "HTTP") {
                if (jpf.Teleport.availHTTP.length) 
                    return jpf.Teleport.availHTTP.pop();
                // #ifdef __DESKRUN
                //if((jpf.hasDeskRun||jpf.hasWebRun) && !self.USENATIVEHTTP) return jdshell.CreateComponent("XMLHTTP");
                // #endif
                
                return new XMLHttpRequest();
            }
            else 
                if (type == "XMLDOM") {
                    var xmlParser = getDOMParser(message, no_error);
                    return xmlParser;
                }
          }
        : function(type, message, no_error, isDataIsland){
            if (type == "HTTP") {
                if (jpf.Teleport.availHTTP.length) 
                    return jpf.Teleport.availHTTP.pop();
                // #ifdef __DESKRUN
                //if((jpf.hasDeskRun||jpf.hasWebRun) && !self.USENATIVEHTTP) return jdshell.CreateComponent("XMLHTTP");
                // #endif
                
                //if(jpf.isIE7 && !hasIE7Security) return new XMLHttpRequest();
                return new ActiveXObject("microsoft.XMLHTTP");
            }
            else 
                if (type == "XMLDOM") {
                    var xmlParser = new ActiveXObject("microsoft.XMLDOM");
                    
                    xmlParser.setProperty("SelectionLanguage", "XPath");
                    //xmlParser.setProperty("SelectionNamespaces", "xmlns:j='http://www.javeline.com/2001/PlatForm'");
                    
                    //if(!isDataIsland) xmlParser.preserveWhiteSpace = true;
                    if (message) {
                        if (jpf.cantParseXmlDefinition) 
                            message = message.replace(/\] \]/g, "] ]").replace(/^<\?[^>]*\?>/, "");//replace xml definition <?xml .* ?> for IE5.0 
                        xmlParser.loadXML(message);
                    }
                    if (!no_error) 
                        this.xmlParseError(xmlParser);
                    
                    return xmlParser;
                }
          };
    
    jpf.xmlParseError = function(xml){
        var xmlParseError = xml.parseError;
        if (xmlParseError != 0) {
            /*
             http://msdn.microsoft.com/library/en-us/xmlsdk30/htm/xmobjpmexmldomparseerror.asp?frame=true
             
             errorCode 	Contains the error code of the last parse error. Read-only.
             filepos 		Contains the absolute file position where the error occurred. Read-only.
             line 			Specifies the line number that contains the error. Read-only.
             linepos 		Contains the character position within the line where the error occurred. Read-only.
             reason 		Explains the reason for the error. Read-only.
             srcText 		Returns the full text of the line containing the error. Read-only.
             url 			Contains the URL of the XML document containing the last error. Read-only.
             */
            throw new Error(1050, jpf.formatErrorString(1050, null, "XML Parse error on line " + xmlParseError.line, xmlParseError.reason + "Source Text:\n" + xmlParseError.srcText.replace(/\t/gi, " ")));
        }
        
        return xml;
    }
    
    //function extendXmlDb(){
    if (jpf.XMLDatabaseImplementation) {
    
        //#ifdef __WITH_APP || __WITH_XMLDATABASE
        jpf.XMLDatabaseImplementation.prototype.htmlImport = function(xmlNode, htmlNode, beforeNode){
            if (xmlNode.length != null && !xmlNode.nodeType) {
                for (var str = '', i = 0; i < xmlNode.length; i++) 
                    str += xmlNode[i].xml;
                    
                var str = jpf.html_entity_decode(str)
                    .replace(/style="background-image:([^"]*)"/g, "find='$1' style='background-image:$1'");
                    
                try {
                    (beforeNode || htmlNode).insertAdjacentHTML(beforeNode ? "beforebegin" : "beforeend", str);
                }
                catch (e) {
                    //IE table hack
                    document.body.insertAdjacentHTML("beforeend", "<table><tr>"
                        + str + "</tr></table>");
                    var x = document.body.lastChild.firstChild.firstChild;
                    for (var i = x.childNodes.length - 1; i >= 0; i--) 
                        htmlNode.appendChild(x.childNodes[jpf.hasDynamicItemList ? 0 : i]);
                }
                
                //Fix IE image loading bug
                if (!this.nodes) 
                    this.nodes = [];

                var id = this.nodes.push(htmlNode.getElementsByTagName("*")) - 1;
                setTimeout('jpf.XMLDatabase.doNodes(' + id + ')');
                
                return;
            }
            
            //== ??? OR !=
            if (htmlNode.ownerDocument && htmlNode.ownerDocument != document
              && xmlNode.ownerDocument == htmlNode.ownerDocument) 
                return htmlNode.insertBefore(xmlNode, beforeNode);
            //if(htmlNode.ownerDocument && htmlNode.ownerDocument != document) return htmlNode.insertBefore(xmlNode, beforeNode);
            
            var strHTML = jpf.html_entity_decode(xmlNode.outerHTML || xmlNode.xml || xmlNode.nodeValue);
            var pNode = (beforeNode || htmlNode);
            if (pNode.nodeType == 11) {
                var id = xmlNode.getAttribute("id");
                if (!id) 
                    throw new Error(1049, jpf.formatErrorString(1049, null, "XMLDatabase", "Inserting Cache Item in Document Fragment without an ID"));
                
                document.body.insertAdjacentHTML(beforeNode ? "beforebegin" : "beforeend", strHTML);
                pNode.appendChild(document.getElementById(id));
            }
            else 
                pNode.insertAdjacentHTML(beforeNode ? "beforebegin" : "beforeend", strHTML);
            
            return beforeNode ? beforeNode.previousSibling : htmlNode.lastChild;
        }
        
        jpf.XMLDatabaseImplementation.prototype.doNodes = function(id){
            var nodes = this.nodes[id];
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].getAttribute("find")) 
                    nodes[i].style.backgroundImage = nodes[i].getAttribute("find");
            }
            this.nodes[id] = null;
        }
        
        //Initialize XMLDatabase
        jpf.XMLDatabase = new jpf.XMLDatabaseImplementation();
        
        //#endif
    }
    
    //jpf.Init.addConditional(extendXmlDb, self, 'XMLDatabaseImplementation');
    if (!hasIESecurity) 
        jpf.Init.run('XMLDatabase');
    
    //#ifdef __SUPPORT_IE5
    
    //IE5.5 compat
    jpf.getOwnerDocument = function(node){
        o = node;
        while (o.parentNode && o.nodeType != 9) 
            o = o.parentNode;
        //node.ownerDocument = o;
        return o;
    }
    
    if (!document.createDocumentFragment) {
        /**
         * @constructor
         */
        function DocumentFragment(){
            this.childNodes = [];
            
            this.appendChild = function(childNode){
                this.childNodes.push(childNode);
            }
            
            this.reinsert = function(parent){
                for (var i = 0; i < this.childNodes.length; i++) {
                    parent.appendChild(this.childNodes[i]);
                }
            }
        }
    }
    
    //#endif
    
    // #ifdef __WITH_IE_POPUP
    jpf.Popup2 = {
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
                jpf.importCssString(this.popup.document, style);
            
            return this.popup.document;
        },
        
        removeContent: function(cacheId){
            this.cache[cacheId] = null;
            delete this.cache[cacheId];
        },
        
        init: function(){
            this.popup = window.createPopup();
            
            this.popup.document.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
                <html xmlns="http://www.w3.org/1999/xhtml" xmlns:j=jpf.ns.jpf xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\
                <head>\
                    <script>\
                    var jpf = {\
                        all: [],\
                        lookup:function(uniqueId){\
                            return this.all[uniqueId] || {\
                                __setStyleClass:function(){}\
                            };\
                        }\
                    };\
                    function destroy(){\
                        jpf.all=null;\
                    }\
                    </script>\
                    <style>\
                    HTML{border:0;overflow:hidden;margin:0}\
                    BODY{margin:0}\
                    </style>\
                </head>\
                <body onmouseover="if(!self.jpf) return;if(this.c){jpf.all = this.c.all;this.c.Popup.parentDoc=self;}"></body>\
                </html>');
            
            var c = jpf;
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
                jpf.lookup(this.last).dispatchEvent("onpopuphide");
        },
        
        destroy: function(){
            if (!this.popup) 
                return;
            this.popup.document.body.c = null;
            this.popup.document.body.onmouseover = null;
        }
    }
    //#endif
    
    //#ifdef __WITH_APP
    jpf.importClass(runXpath, true, self);
    //#endif

}

// #endif
