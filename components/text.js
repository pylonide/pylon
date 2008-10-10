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

// #ifdef __JTEXT || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a rectangle containing arbritrary (X)HTML.
 * This component can be databound and use databounding rules to
 * convert data into (X)HTML using for instance XSLT or JSLT.
 *
 * @classDescription		This class creates a new text component
 * @return {Text} Returns a new text component
 * @type {Text}
 * @constructor
 * @addnode components:text
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.1
 * @todo Please refactor this object
 */

jpf.text = function(pHtmlNode){
    jpf.register(this, "text", jpf.NODE_VISIBLE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    //Options
    this.$focussable = true; // This object can't get the focus
    this.focussable = false;

    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.$supportedProperties.push("value");
    this.$propHandlers["value"] = function(value){
        var cacheObj = false;

        if (typeof value != "string")
            value = value ? value.toString() : "";
        
        if (this.secure) {
            value = value.replace(/<a /gi, "<a target='_blank' ")
            .replace(/<object.*?\/object>/g, "")
            .replace(/<script.*?\/script>/g, "")
            .replace(new RegExp("ondblclick|onclick|onmouseover|onmouseout|onmousedown|onmousemove|onkeypress|onkeydown|onkeyup|onchange|onpropertychange", "g"), "ona")
        }

        if (this.addOnly) {
            if (cacheObj)
                cacheObj.contents += value;
            else
                this.oInt.insertAdjacentHTML("beforeend", value);
        }
        else {
            value = value.replace(/\<\?xml version="1\.0" encoding="UTF-16"\?\>/, "");
        
            //var win = window.open();
            //win.document.write(value);
            if (cacheObj)
                cacheObj.contents = value;
            else
                this.oInt.innerHTML = value;//.replace(/<img[.\r\n]*?>/ig, "")
        }
        
        //Iframe bug fix for IE (leaves screen white);
        if (jpf.cannotSizeIframe && this.oIframe)
            this.oIframe.style.width = this.oIframe.offsetWidth + "px";

        if (this.scrolldown)
            this.oFocus.scrollTop = this.oFocus.scrollHeight;
    };
    
    this.getValue = function(){
        return this.oInt.innerHTML;
    };
    
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        
        switch (key) {
            case 33:
                //PGUP
                this.oInt.scrollTop -= this.oInt.offsetHeight;
                break;
            case 34:
                //PGDN
                this.oInt.scrollTop += this.oInt.offsetHeight;
                break;
            case 35:
                //END
                this.oInt.scrollTop = this.oInt.scrollHeight;
                break;
            case 36:
                //HOME
                this.oInt.scrollTop = 0;
                break;
            case 38:
                this.oInt.scrollTop -= 10;
                break;
            case 40:
                this.oInt.scrollTop += 10;
                break;
            default:
                return;
        }
        
        return false;
    });
    
    this.setValue = 
    this.loadHTML = function(value){
        this.setProperty("value", value);
    };
    
    this.$clear = function(){
        //this.oInt.innerHTML = "<div style='text-align:center;font-family:MS Sans Serif;font-size:8pt'>" + this.msg + "</div>";
    };
    
    /* ***************
        DATABINDING
    ****************/
    // #ifdef __WITH_DATABINDING
    
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        if (this.addOnly && action != "add") return;
        
        //Action Tracker Support
        if (UndoObj)
            UndoObj.xmlNode = this.addOnly ? xmlNode : this.xmlRoot;//(contents ? contents.xmlRoot : this.xmlRoot);
        
        //Refresh Properties
        if (this.addOnly) {
            jpf.xmldb.nodeConnect(this.documentId, xmlNode, null, this);
            var cacheObj = this.getNodeFromCache(listenNode.getAttribute("id")
                + "|" + this.uniqueId);

            this.loadHTML(this.applyRuleSetOnNode("value", xmlNode) || "",
                true, cacheObj);
        }
        else {
            this.$propHandlers["value"].call(this, 
                this.applyRuleSetOnNode("value", this.xmlRoot) || "");
        }
    };
    
    this.$load = function(node){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(node, this);
        var value = this.applyRuleSetOnNode("value", node);

        if (value || typeof value == "string") {
            if (this.caching) {
                var cacheObj = this.getNodeFromCache(node.getAttribute("id")
                    + "|" + this.uniqueId);
                if (cacheObj)
                    cacheObj.contents = value;
            }
            this.loadHTML(value);
        }
        else
            this.loadHTML("");
    };
    // #endif
    
    /* ***********************
            DRAGDROP
    ************************/
    // #ifdef __WITH_DRAGDROP
    this.$showDragIndicator = function(sel, e){
        var x = e.offsetX + 22;
        var y = e.offsetY;

        this.oDrag.startX = x;
        this.oDrag.startY = y;

        
        document.body.appendChild(this.oDrag);
        //this.oDrag.getElementsByTagName("DIV")[0].innerHTML = this.selected.innerHTML;
        //this.oDrag.getElementsByTagName("IMG")[0].src = this.selected.parentNode.parentNode.childNodes[1].firstChild.src;
        var oInt = this.$getLayoutNode("main", "caption", this.oDrag);
        if (oInt.nodeType != 1)
            oInt = oInt.parentNode;
        
        oInt.innerHTML = this.applyRuleSetOnNode("caption", this.xmlRoot) || "";
        
        return this.oDrag;
    };
    
    this.$hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    };
    
    this.$moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX - this.oDrag.startX) + "px";
        this.oDrag.style.top  = (e.clientY - this.oDrag.startY) + "px";
    };
    
    this.$initDragDrop = function(){
        //don't execute when only receiving;
        
        this.oDrag    = document.body.appendChild(this.oExt.cloneNode(true));
        this.oDrag.id = "";
        
        this.oDrag.style.zIndex     = 1000000;
        this.oDrag.style.position   = "absolute";
        this.oDrag.style.cursor     = "default";
        this.oDrag.style.filter     = "progid:DXImageTransform.Microsoft.Alpha(opacity=50)";
        this.oDrag.style.MozOpacity = 0.5;
        this.oDrag.style.opacity    = 0.5;
        this.oDrag.style.display    = "none";
        
        //remove id's
    };
    
    this.$dragout  = 
    this.$dragover = 
    this.$dragdrop = jpf.K;
    
    this.inherit(jpf.DragDrop); /** @inherits jpf.DragDrop */
    // #endif
    
    /* ***********************
              CACHING
    ************************/
    // #ifdef __WITH_CACHE
    
    this.$getCurrentFragment = function(){
        return {
            nodeType : 1,
            contents : this.oInt.innerHTML
        }
    };
    
    this.$setCurrentFragment = function(fragment){
        this.oInt.innerHTML = fragment.contents;
        if (this.scrolldown)
            this.oInt.scrollTop = this.oInt.scrollHeight;
    };

    this.$findNode = function(cacheNode, id){
        id = id.split("\|");
        
        if ((cacheNode ? cacheNode : this).xmlRoot
          .selectSingleNode("descendant-or-self::node()[@id='" + (id[0]+"|"+id[1]) + "']")) 
            return (cacheNode ? cacheNode : null);

        return false;
    };
    
    this.$setClearMessage = function(msg){
        /*var oEmpty = xmldb.htmlImport(this.$getLayoutNode("empty"), this.oInt);
        var empty = this.$getLayoutNode("empty", "caption", oEmpty);
        if(empty) empty.nodeValue = msg;
        if(oEmpty) oEmpty.setAttribute("id", "empty" + this.uniqueId);*/
        
        //hack!
        this.oInt.innerHTML = "";
    };
    
    this.$removeClearMessage = function(){
        var oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty)
            oEmpty.parentNode.removeChild(oEmpty);
        else
            this.oInt.innerHTML = ""; //clear if no empty message is supported
    };
    
    this.inherit(jpf.Cache); /** @inherits jpf.Cache */
    this.caching = false; //Fix for now
    // #endif
    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.$draw = function(){
        this.oExt = this.$getExternal(); 
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        
        if (jpf.hasCssUpdateScrollbarBug)
            this.$fixScrollBug();
        
        if (this.oInt.tagName.toLowerCase() == "iframe") {
            if (jpf.isIE) {
                this.oIframe = this.oInt;
                var iStyle = this.skin.selectSingleNode("iframe_style");
                this.oIframe.contentWindow.document.write(
                    "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\
                    <head>\
                        <style>" + (iStyle ? iStyle.firstChild.nodeValue : "") + "</style>\
                        <script>\
                            document.onkeydown = function(e){\
                                if (!e) e = event;\
                                if (" + 'top.jpf.disableF5' + " && e.keyCode == 116) {\
                                    e.keyCode = 0;\
                                    return false;\
                                }\
                            }\
                        </script>\
                    </head>\
                    <body oncontextmenu='return false'></body>");
                this.oInt = this.oIframe.contentWindow.document.body;
            }
            else {
                var node = document.createElement("div");
                this.oExt.parentNode.replaceChild(node, this.oExt);
                node.className = this.oExt.className;
                this.oExt = this.oInt = node;
            }
        }
        else {
            this.oInt.onselectstart = function(e){
                (e ? e : event).cancelBubble = true;
            }
            
            this.oInt.oncontextmenu = function(e){
                if (!this.host.contextmenus)
                    (e ? e : event).cancelBubble = true;
            }
            
            this.oInt.style.cursor = "";
        
            this.oInt.onmouseover = function(e){
                if (!self.STATUSBAR) return;
                if (!e)
                    e = event;
                
                if (e.srcElement.tagName.toLowerCase() == "a") {
                    if (!this.lastStatus)
                        this.lastStatus = STATUSBAR.getStatus();
                    STATUSBAR.status("icoLink.gif", e.srcElement.getAttribute("href"));
                }
                else if (this.lastStatus) {
                    STATUSBAR.status(this.lastStatus[0], this.lastStatus[1]);
                    this.lastStatus = false;
                }
            }
        }
    };

    this.$loadJml = function(x){
        if (x.getAttribute("behavior") == "addonly")
            this.addOnly = true;
        if (x.getAttribute("scrolldown") == "true")
            this.scrolldown = true;
        
        this.secure  = (x.getAttribute("secure") == "true");
        this.caching = false;// hack
        
        //this.focussable = jpf.isTrue(x.getAttribute("focussable"));
        
        /*if (x.childNodes.length == 1 && x.firstChild.namespaceURI != jpf.ns.jpf) {
            this.setProperty("value", (x.xml || x.serialize())
                .replace(new RegExp("^<[\w\.\-\_:]+[^>]*>"), "")
                .replace(new RegExp("<\/\s*[\w\.\-\_:]+[^>]*>$"), ""));
        }
        else if (x.childNodes.length)*/
            //jpf.JmlParser.parseChildren(x, this.oInt, this);

        if (jpf.xmldb.isOnlyChild(x.firstChild, [3,4]))
            this.$handlePropSet("value", x.firstChild.nodeValue.trim());
        else
            jpf.JmlParser.parseChildren(this.$jml, null, this);
    };
    
    this.$destroy = function(){
        jpf.removeNode(this.oDrag);
        this.oDrag   = null;
        this.oIframe = null;
    };
};

// #endif