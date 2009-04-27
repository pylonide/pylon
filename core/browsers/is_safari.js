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

// #ifdef __SUPPORT_SAFARI
/**
 * Compatibility layer for Webkit based browsers.
 * @private
 */
jpf.runSafari = function(){
    //#ifdef __SUPPORT_SAFARI2
    if (!jpf.isChrome) {
        var setTimeoutSafari = window.setTimeout;
        lookupSafariCall = [];
        window.setTimeout = function(call, time){
            if (typeof call == "string") 
                return setTimeoutSafari(call, time);
            return setTimeoutSafari("lookupSafariCall["
                + (lookupSafariCall.push(call) - 1) + "]()", time);
        }
        
        if (jpf.isSafariOld) {
            HTMLHtmlElement = document.createElement("html").constructor;
            Node            = HTMLElement = {};
            HTMLElement.prototype = HTMLHtmlElement.__proto__.__proto__;
            HTMLDocument    = Document = document.constructor;
            var x           = new DOMParser();
            XMLDocument     = x.constructor;
            Element         = x.parseFromString("<Single />", "text/xml").documentElement.constructor;
            x               = null;
        }
        
        if (!XMLDocument.__defineGetter__) {
            Document.prototype.serialize    = 
            Node.prototype.serialize        =
            XMLDocument.prototype.serialize = function(){
                return (new XMLSerializer()).serializeToString(this);
            };
        }
    }
    //#endif
    
    //#ifdef __PARSER_XPATH
    
    if (jpf.isSafariOld || jpf.isSafari || jpf.isChrome) {
        //XMLDocument.selectNodes
        HTMLDocument.prototype.selectNodes =
        XMLDocument.prototype.selectNodes  = function(sExpr, contextNode){
            return jpf.XPath.selectNodes(sExpr, contextNode || this);
        };
        
        //Element.selectNodes
        Element.prototype.selectNodes = function(sExpr, contextNode){
            return jpf.XPath.selectNodes(sExpr, contextNode || this);
        };
        
        //XMLDocument.selectSingleNode
        HTMLDocument.prototype.selectSingleNode =
        XMLDocument.prototype.selectSingleNode  = function(sExpr, contextNode){
            return jpf.XPath.selectNodes(sExpr, contextNode || this)[0];
        };
        
        //Element.selectSingleNode
        Element.prototype.selectSingleNode = function(sExpr, contextNode){
            return jpf.XPath.selectNodes(sExpr, contextNode || this)[0];
        };
        
        jpf.importClass(jpf.runXpath, true, self);
        jpf.importClass(jpf.runXslt, true, self);
    }

    // #endif
    
    if (jpf.runNonIe)
        jpf.runNonIe();
    //jpf.importClass(jpf.runNonIe, true, self);
};

// #ifdef __SUPPORT_IPHONE

jpf.runIphone = function() {
    if (!jpf.isIphone) return;

    jpf.makeClass(this);

    // #ifdef __WITH_CSS
    jpf.importCssString(document,
       'body {\
            margin: 0;\
            font-family: Helvetica;\
            background: #FFFFFF;\
            color: #000000;\
            overflow-x: hidden;\
            -webkit-user-select: none;\
            -webkit-text-size-adjust: none;\
        }\
        body > *:not(.toolbar) {\
            position: absolute;\
            margin: 0;\
            padding: 0;\
            left: 0;\
            top: 45px;\
            width: 100%;\
            min-height: 372px;\
        }\
        body[orient="landscape"] > *:not(.toolbar) {\
            min-height: 268px;\
        }\
        body > *[selected="true"] {\
            display: block;\
        }', "screen");
    // #endif
    
    var head = document.getElementsByTagName("head")[0];
    if (jpf.appsettings.iphoneIcon) {
        var link = document.createElement("link");
        link.setAttribute("rel", "apple-touch-icon" 
            + (jpf.appsettings.iphoneIconIsGlossy ? "" : "-precomposed"));
        link.setAttribute("href", "jpf.appsettings.iphoneIcon");
        head.appendChild(link);
    }

    function appendMeta(name, content) {
        var meta = document.createElement("meta");
        meta.setAttribute("name", name);
        meta.setAttribute("content", content);
        head.appendChild(meta);
    }

    if (jpf.appsettings.iphoneFixedViewport) {
        appendMeta("viewport",
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;");
    }

    if (jpf.appsettings.iphoneFullScreen) {
        appendMeta("apple-mobile-web-app-capable", "yes");

        if (jpf.appsettings.iphoneStatusBar)
            appendMeta("apple-mobile-web-app-status-bar-style",
                "jpf.appsettings.iphoneStatusBar");
    }

    var hasOrientationEvent = false,
        currentWidth        = 0,
        portraitVal         = "portrait",
        landscapeVal        = "landscape",
        checkTimer          = null;

    jpf.addDomLoadEvent(function() {
        setTimeout(checkOrientAndLocation, 0);
        checkTimer = setInterval(checkOrientAndLocation, 300);
    });

    function orientChangeHandler() {
        switch(window.orientation) {
            case 0:
                setOrientation(portraitVal);
                break;
            case 90:
            case -90:
                setOrientation(landscapeVal);
                break;
        }
    }

    if (typeof window.onorientationchange == "object") {
        window.onorientationchange = orientChangeHandler;
        hasOrientationEvent = true;
        setTimeout(orientChangeHandler, 0);
    }

    function checkOrientAndLocation() {
        if (!hasOrientationEvent) {
            if (window.innerWidth != currentWidth) {
                currentWidth = window.innerWidth;
                var orient   = currentWidth == 320 ? portraitVal : landscapeVal;
                setOrientation(orient);
            }
        }

        /*if (location.hash != currentHash) {
            var pageId = location.hash.substr(hashPrefix.length);
            iui.showPageById(pageId);
        }*/
    }

    function setOrientation(orient) {
        document.body.setAttribute("orient", orient);
        setTimeout("scrollTo(0,1)", 100);
    }

    /* register event listeners:
     * - touchstart (skip)
     * - touchmove (skip)
     * - touchend (skip)
     * - touchcancel (skip)
     * - gesturestart
     * - gesturechange
     * - gestureend
     * - orientationchange
     */
    ["gesturestart", "gesturechange", "gestureend",
     "orientationchange"].forEach(function(type) {
        document["on" + type] = function(evt) {
            if (jpf.dispatchEvent)
                jpf.dispatchEvent(type, evt);
        };
    });

    document.ontouchstart = function(e) {
        if (e.touches && e.touches.length == 1) {
            //e.preventDefault();
            e = e.touches[0];
            if (e.target && typeof e.target.onmousedown == "function")
                return e.target.onmousedown(e);
            else if (typeof document.onmousedown == "function")
                return document.onmousedown(e);
        }
    };

    document.ontouchmove = function(e) {
        if (e.touches && e.touches.length == 1) {
            //e.preventDefault();
            e = e.touches[0];
            if (e.target && typeof e.target.onmousemove == "function")
                return e.target.onmousemove(e);
            else if (typeof document.onmousemove == "function")
                return document.onmousemove(e);
        }
    };

    var _touching = false;

    document.ontouchend = document.ontouchcancel = function(e) {
        if (_touching) return;

        e = e.touches && e.touches.length ? e.touches[0] : e.changedTouches[0];
        if (e) {
            _touching = true;
            setTimeout(function() { _touching = false; });
            if (e.target && typeof e.target.onmouseup == "function")
                return e.target.onmouseup(e);
            else if (typeof document.onmouseup == "function")
                return document.onmouseup(e);
        }
    };
};

// #endif

// #endif
