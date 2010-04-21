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

// #ifdef __AMLTEXT || __INC_ALL

/**
 * Element displaying a rectangle containing arbitrary (X)HTML.
 * This element can be databound and use databounding rules to
 * convert data into (X)HTML using for instance XSLT or JSLT.
 *
 * @constructor
 * @define text
 * @addnode elements
 *
 * @inherits apf.Cache
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.1
 * @todo Please refactor this object
 */
apf.text = function(struct, tagName){
    this.$init(tagName || "text", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        // #ifdef __WITH_CACHE
        apf.Cache,
        // #endif
        apf.ChildValue
    );

    this.$focussable       = true; // This object can't get the focus
    this.focussable        = false;
    this.$allowSelect      = true;
    this.$hasStateMessages = true;

    this.$textTimer = this.$lastMsg = this.$lastClass = this.$changedHeight = null;

    /**** Properties and Attributes ****/

    /**
     * @attribute {Boolean} scrolldown  whether this elements viewport is always
     *                                  scrolled down. This is especially useful
     *                                  when this element is used to displayed
     *                                  streaming content such as a chat conversation.
     * @attribute {Boolean} secure      whether the content loaded in this element
     *                                  should be filtered in order for it to not
     *                                  be able to execute javascript. This is
     *                                  especially useful when the content does
     *                                  not come from a trusted source, like a
     *                                  web service or xmpp feed.
     */
    this.$booleanProperties["scrolldown"] = true;
    this.$booleanProperties["secure"]     = true;
    this.$supportedProperties.push("behavior", "scrolldown", "secure", "value");

    /**
     * @attribute {String} behaviour specifying how this elements handles new values
     *   Possible values
     *   normal   new values replace the old value.
     *   addonly  new values are added to the current value.
     */
    this.$propHandlers["behavior"] = function(value){
        this.addOnly = value == "addonly";
    }

    /**
     * @attribute {String} value the contents of this element. This can be text or html or xhtml.
     */
    this.$propHandlers["value"] = function(value){
        var cacheObj = false;

        // #ifdef __WITH_CACHE
        if (value)
            this.$removeClearMessage();
        //@todo else
        //#endif

        if (typeof value != "string") {
            if (value.nodeType)
                value = value.nodeType > 1 && value.nodeType < 5
                    ? value.nodeValue
                    : value.firstChild && value.firstChild.nodeValue || "";
            else
                value = value ? value.toString() : "";
        }

        if (this.secure) {
            value = value.replace(/<a /gi, "<a target='_blank' ")
                .replace(/<object.*?\/object>/g, "")
                .replace(/<script.*?\/script>/g, "")
                .replace(new RegExp("ondblclick|onclick|onmouseover|onmouseout"
                    + "|onmousedown|onmousemove|onkeypress|onkeydown|onkeyup|onchange"
                    + "|onpropertychange", "g"), "ona");
        }

        if (this.addOnly) {
            // #ifdef __WITH_CACHE
            if (cacheObj)
                cacheObj.contents += value;
            else
            //#endif
                this.$container.insertAdjacentHTML("beforeend", value);
        }
        else {
            value = value.replace(/\<\?xml version="1\.0" encoding="UTF-16"\?\>/, "");

            // #ifdef __WITH_CACHE
            if (cacheObj)
                cacheObj.contents = value;
            else
            //#endif
                this.$container.innerHTML = value;//.replace(/<img[.\r\n]*?>/ig, "")
        }

        //Iframe bug fix for IE (leaves screen white);
        if (apf.cannotSizeIframe && this.oIframe)
            this.oIframe.style.width = this.oIframe.offsetWidth + "px";

        if (this.scrolldown && this.$scrolldown)
            this.oScroll.scrollTop = this.oScroll.scrollHeight;
    };

    this.$propHandlers["empty-message"] = function(value) {
        if (!this.childNodes.length)
            this.$setClearMessage(this["empty-message"]);
    };

    /**** Public methods ****/

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value, false, true);
    };

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.$container.innerHTML;
    };
    
    //#endif

    /**** Keyboard Support ****/

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;

        switch (key) {
            case 33:
                //PGUP
                this.$container.scrollTop -= this.$container.offsetHeight;
                break;
            case 34:
                //PGDN
                this.$container.scrollTop += this.$container.offsetHeight;
                break;
            case 35:
                //END
                this.$container.scrollTop = this.$container.scrollHeight;
                break;
            case 36:
                //HOME
                this.$container.scrollTop = 0;
                break;
            case 38:
                this.$container.scrollTop -= 10;
                break;
            case 40:
                this.$container.scrollTop += 10;
                break;
            default:
                return;
        }

        return false;
    }, true);
    //#endif

    /**** Private methods ****/

    // #ifdef __WITH_DATABINDING
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        if (this.addOnly && action != "add") return;

        //Action Tracker Support
        if (UndoObj)
            UndoObj.xmlNode = this.addOnly ? xmlNode : this.xmlRoot;//(contents ? contents.xmlRoot : this.xmlRoot);

        //Refresh Properties
        if (this.addOnly) {
            apf.xmldb.nodeConnect(this.documentId, xmlNode, null, this);
            var cacheObj = this.$findHtmlNode(listenNode.getAttribute("id")
                + "|" + this.$uniqueId);

            this.$propHandlers["value"].call(this,
                this.$applyBindRule("value", xmlNode) || "");
        }
        else {
            this.$propHandlers["value"].call(this,
                this.$applyBindRule("value", this.xmlRoot) || "");
        }
    };

    this.$load = function(node){
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(node, this);
        var value = this.$applyBindRule("value", node);

        if (value || typeof value == "string") {
            if (this.caching) {
                var cacheObj = this.$findHtmlNode(node.getAttribute("id")
                    + "|" + this.$uniqueId);
                if (cacheObj)
                    cacheObj.contents = value;
            }
            this.$propHandlers["value"].call(this, value);
        }
        else
            this.$propHandlers["value"].call(this, "");
    };
    // #endif

    // #ifdef __WITH_CACHE
    this.$getCurrentFragment = function(){
        return {
            nodeType : 1,
            contents : this.$container.innerHTML
        }
    };

    this.$setCurrentFragment = function(fragment){
        this.$container.innerHTML = fragment.contents;
        if (this.scrolldown)
            this.$container.scrollTop = this.$container.scrollHeight;
    };

    this.$setClearMessage = this.$updateClearMessage = function(msg, className){
        if (this.$lastClass)
            this.$removeClearMessage();
        //@todo move to setClearMessage
        apf.setStyleClass(this.$ext, 
            (this.$lastClass = this.$baseCSSname + (className || "Empty").uCaseFirst()));//"Empty");

        if (msg) {
            if (!this.height) {
                if (this.$container.offsetHeight 
                  && apf.getStyle(this.$container, "height") == "auto" 
                  && (this.$changedHeight = true))
                    this.$container.style.height = (this.$container.offsetHeight 
                      - apf.getHeightDiff(this.$container)) + "px";
                this.$container.innerHTML = msg;
            }
            this.$lastMsg = this.$container.innerHTML;
        }
    };

    this.$removeClearMessage = function(){
        if (this.$lastClass) {
            apf.setStyleClass(this.$ext, "", [this.$lastClass]);
            this.$lastClass = null;
        }
        
        if (this.$container.innerHTML == this.$lastMsg) {
            if (this.$changedHeight && !(this.$changedHeight = false))
                this.$container.style.height = "";
            this.$container.innerHTML = ""; //clear if no empty message is supported
        }
    };

    this.caching = false; //Fix for now
    // #endif

    /**** Init ****/

    this.$draw = function(){
        var _self = this;

        this.$ext = this.$getExternal();
        this.$container = this.$getLayoutNode("main", "container", this.$ext);

        if (apf.hasCssUpdateScrollbarBug && !apf.getStyle(this.$container, "padding"))
            this.$fixScrollBug();

        this.oScroll = this.oFocus ? this.oFocus.parentNode : this.$container;

        this.$scrolldown = true;
        this.oScroll.onscroll = function(){
            _self.$scrolldown = this.scrollTop >= this.scrollHeight
                - this.offsetHeight + apf.getVerBorders(this);
        }
        clearInterval(this.$textTimer);
        this.$textTimer = setInterval(function(){
            if (_self.oScroll && _self.$scrolldown && _self.scrolldown) {
                _self.oScroll.scrollTop = _self.oScroll.scrollHeight;
            }
        }, 60);

        if (this.$container.tagName.toLowerCase() == "iframe") {
            if (apf.isIE) {
                this.oIframe = this.$container;
                var iStyle = this.skin.selectSingleNode("iframe_style");
                this.oIframe.contentWindow.document.write(
                    "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\
                    <head>\
                        <style>" + (iStyle ? iStyle.firstChild.nodeValue : "") + "</style>\
                        <script>\
                            document.onkeydown = function(e){\
                                if (!e) e = event;\
                                if (" + 'top.apf.disableF5' + " && e.keyCode == 116) {\
                                    e.keyCode = 0;\
                                    return false;\
                                }\
                            }\
                        </script>\
                    </head>\
                    <body oncontextmenu='return false'></body>");
                this.$container = this.oIframe.contentWindow.document.body;
            }
            else {
                var node = document.createElement("div");
                this.$ext.parentNode.replaceChild(node, this.$ext);
                node.className = this.$ext.className;
                this.$ext = this.$container = node;
            }
        }
    };

    this.addEventListener("DOMNodeRemovedFromDocument", function() {
        clearInterval(this.$textTimer);
        apf.destroyHtmlNode(this.oDrag);
        
        if (this.oScroll)
            this.oScroll.onscoll = this.oScroll = null;
        
        this.oDrag = this.oIframe = this.oFocus  = null;
    });
}).call(apf.text.prototype = new apf.BaseSimple());

apf.aml.setElement("text", apf.text);
// #endif
