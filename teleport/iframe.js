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

// #ifdef __TP_IFRAME
// #define __WITH_TELEPORT 1
// #begindef __CONTENT_IFRAME

var USE_IFRAME = false;

function XMLHttpRequest(){
    this.uniqueId = jpf.all.push(this);
    
    if (USE_IFRAME) {
        this.iframe = document.body.appendChild(document.createElement("iframe"));
        this.iframe.host = this;
        this.iframe.style.display = "none";
        
        this.destroy = function(){
            this.iframe.host = null
        }
    }
    else {
        var xml = document.body.appendChild(document.createElement("xml"));
        this.xmlDocument = xml.XMLDocument;
        this.xmlDocument.setProperty("SelectionLanguage", "XPath");
        document.body.removeChild(xml);
    }
    
    this.readyState   = 0;
    this.status       = null;
    this.responseText = null;
    this.responseXML  = null;
    
    this.setRequestHeader = function(){
        //Not supported
    }
    
    this.send = function(){
        this.done = false;
        if (USE_IFRAME) 
            this.iframe.src = this.url;
        else 
            this.xmlDocument.load(this.url);
    }
    
    this.open = function(protocol, url, async){
        this.protocol = protocol;
        this.url      = url;
        this.async    = async;
        
        if (USE_IFRAME) {
            if (!async) 
                throw new Error(1081, jpf.formatErrorString(1081, null, "Iframe callback", "Compatibility mode prevents possibility of non-async calls"));
            this.iframe.onreadystatechange = this.stateChangeHandlerIframe;
        }
        else {
            this.xmlDocument.async = async;
            this.xmlDocument.onreadystatechange = this.stateChangeHandler;
        }
    }
    
    this.abort = function(){
        if (USE_IFRAME) {
            this.iframe.onreadystatechange = null;
            this.iframe.src = "about:blank";
        }
        else 
            this.xmlDocument.abort();
    }
    
    var me = this;
    this.stateChangeHandler = function(){
        me.receive();
    }
    
    this.receive = function(){
        this.readyState = this.xmlDocument.readyState;
        
        if (this.readyState == 4) {
            this.status       = 200;
            this.responseText = this.xmlDocument.responseText || this.xmlDocument.xml;
            this.responseXML  = this.xmlDocument;
        }
        
        if (this.onreadystatechange) 
            this.onreadystatechange();
    }
    
    this.stateChangeHandlerIframe = function(){
        if (this.host.done || this.readyState != "complete") 
            return;
        this.host.done = true;
        this.host.receiveIframe();
    }
    
    this.receiveIframe = function(){
        var strXml = this.iframe.contentWindow.document.body.innerText;
        strXml     = strXml.replace(/^- /gm, "");
        
        try {
            this.responseXML = jpf.getObject("XMLDOM", strXml);
            this.responseXML.setProperty("SelectionLanguage", "XPath");
            this.responseXML.loadXML(strXml);
        }
        catch (e) {
            this.responseXML = null;
        }
        this.responseText = this.responseXML ? this.responseXML.xml : strXml;
        this.status       = 200;
        this.readyState   = 4;
        
        if (this.onreadystatechange) 
            this.onreadystatechange();
    }
}

function getDOMParser(message, no_error){
    var xml = document.body.appendChild(document.createElement("xml"));
    var xmlParser = xml.XMLDocument;
    document.body.removeChild(xml);
    
    xmlParser.setProperty("SelectionLanguage", "XPath");
    if (message) 
        xmlParser.loadXML(message);
    if (!no_error) 
        jpf.xmlParseError(xmlParser);
    
    return xmlParser;
}

// #enddef
// #endif
jpf.Init.run('XMLDatabaseImplementation');
