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
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.1
 * @todo Please refactor this object
 */
apf.text = apf.component(apf.NODE_VISIBLE, function(){
    this.$focussable = true; // This object can't get the focus
    this.focussable  = false;
    this.$hasStateMessages = true;
    var _self        = this;

    /**** Properties and Attributes ****/

    /**
     * @attribute {Boolean} scrolldown  whether this elements viewport is always scrolled down. This is especially useful when this element is used to displayed streaming content such as a chat conversation.
     * @attribute {Boolean} secure      whether the content loaded in this element should be filtered in order for it to not be able to execute javascript. This is especially useful when the content does not come from a trusted source, like a web service or xmpp feed.
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

        if (value)
            this.$removeClearMessage();
        //@todo else

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
        if (apf.cannotSizeIframe && this.oIframe)
            this.oIframe.style.width = this.oIframe.offsetWidth + "px";

        if (this.scrolldown && this.$scrolldown)
            this.oScroll.scrollTop = this.oScroll.scrollHeight;
    };

    /**** Public methods ****/

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.oInt.innerHTML;
    };

    /**** Keyboard Support ****/

    //#ifdef __WITH_KEYBOARD
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
            var cacheObj = this.getNodeFromCache(listenNode.getAttribute("id")
                + "|" + this.uniqueId);

            this.$propHandlers["value"].call(this,
                this.applyRuleSetOnNode("value", xmlNode) || "");
        }
        else {
            this.$propHandlers["value"].call(this,
                this.applyRuleSetOnNode("value", this.xmlRoot) || "");
        }
    };

    this.$load = function(node){
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(node, this);
        var value = this.applyRuleSetOnNode("value", node);

        if (value || typeof value == "string") {
            if (this.caching) {
                var cacheObj = this.getNodeFromCache(node.getAttribute("id")
                    + "|" + this.uniqueId);
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

    var lastMsg, lastClass, changedHeight;
    this.$setClearMessage = this.$updateClearMessage = function(msg, className){
        if (lastClass)
            this.$removeClearMessage();
        apf.setStyleClass(this.oExt, 
            (lastClass = this.baseCSSname + (className || "Empty").uCaseFirst()));//"Empty"); //@todo move to setClearMessage
        
        if (msg) {
            if (this.oInt.offsetHeight 
              && apf.getStyle(this.oInt, "height") == "auto" 
              && (changedHeight = true))
                this.oInt.style.height = (this.oInt.offsetHeight 
                  - apf.getHeightDiff(this.oInt)) + "px";
            this.oInt.innerHTML = msg;
            lastMsg = this.oInt.innerHTML;
        }
    };

    this.$removeClearMessage = function(){
        if (lastClass) {
            apf.setStyleClass(this.oExt, "", [lastClass]);
            lastClass = null;
        }
        
        if (this.oInt.innerHTML == lastMsg) {
            if (changedHeight && !(changedHeight = false))
                this.oInt.style.height = "";
            this.oInt.innerHTML = ""; //clear if no empty message is supported
        }
    };

    this.caching = false; //Fix for now
    // #endif

    /**** Init ****/

    var timer;
    this.$draw = function(){
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);

        if (apf.hasCssUpdateScrollbarBug && !apf.getStyle(this.oInt, "padding"))
            this.$fixScrollBug();

        this.oScroll = this.oFocus ? this.oFocus.parentNode : this.oInt;

        this.$scrolldown = true;
        this.oScroll.onscroll = function(){
            _self.$scrolldown = this.scrollTop >= this.scrollHeight
                - this.offsetHeight + apf.getVerBorders(this);
        }
        clearInterval(timer);
        timer = setInterval(function(){
            if (_self.oScroll && _self.$scrolldown && _self.scrolldown) {
                _self.oScroll.scrollTop = _self.oScroll.scrollHeight;
            }
        }, 60);

        if (this.oInt.tagName.toLowerCase() == "iframe") {
            if (apf.isIE) {
                this.oIframe = this.oInt;
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
        this.caching = false;// hack
        
        if (this["empty-message"] && !this.childNodes.length)
            this.$setClearMessage(this["empty-message"]);
        
        if (apf.xmldb.isOnlyChild(x.firstChild, [3,4]))
            this.$handlePropSet("value", x.firstChild.nodeValue.trim());
        else
            apf.JmlParser.parseChildren(this.$jml, null, this);
    };

    this.$destroy = function(){
        clearInterval(timer);
        apf.removeNode(this.oDrag);
        this.oDrag   = null;
        this.oIframe = null;
        this.oScroll.onscoll = null;
        this.oScroll = null;
        this.oFocus  = null;
    };
}).implement(
    // #ifdef __WITH_CACHE
    apf.Cache,
    // #endif
    apf.BaseSimple
);

// #endif
