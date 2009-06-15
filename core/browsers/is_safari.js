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
       'html, body {\
            margin: 0;\
            font-family: Helvetica;\
            background: #fff;\
            color: #000000;\
            overflow-x: hidden;\
            -webkit-user-select: none;\
            -webkit-text-size-adjust: none;\
            -webkit-touch-callout: none;\
        }\
        body > *:not(.toolbar) {\
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

    
    jpf.iphone = {
        linkEvents: function(el) {
            el.ontouchstart = function(evt) {
                if (!evt.touches || evt.touches.length != 1) return;

                var e = evt.touches[0];
                if (typeof this.onmousedown == "function") {
                    this.onmousedown(e);
                    if (this != document)
                        return false;
                }
            };

            el.ontouchmove = function(evt) {
                if (!evt.touches || evt.touches.length != 1) return;

                var e = evt.touches[0];
                if (typeof this.onmousemove == "function") {
                    this.onmousemove(e);
                    if (this != document)
                        return false;
                }
            };

            var _touching = false;

            el.ontouchend = el.ontouchcancel = function(evt) {
                if (_touching) return;

                var e = evt.touches && evt.touches.length
                    ? evt.touches[0] 
                    : evt.changedTouches[0];
                if (!e) return;
                
                _touching = true;
                setTimeout(function() { _touching = false; });
                if (typeof this.onmouseup == "function") {
                    this.onmouseup(e);
                    if (this != document)
                        return false;
                }
            };

            return this;
        },
        nav: {
            panels       : null,
            active       : null,
            def          : "home",
            divideChar   : "/",
            levelTwoChar : "-",

            go: function(where, noanim) {
                var _self = jpf.iphone.nav;
                _self.update();

                if (!_self.panels[where.page]) return;

                setTimeout("scrollTo(0,1)", 100);
                jpf.dispatchEvent("pagechange", where);

                var i;
                if (noanim) {
                    for (i in _self.panels)
                        _self.panels[i].hide();
                    _self.panels[where.page].show();
                }
                else {
                    for (i in _self.panels) {
                        if (!_self.panels[i].visible || i == where.page)
                            continue;
                        var panel = _self.panels[i];
                        panel.setProperty("zindex", 0);
                        jpf.tween.single(panel.oExt, {
                            steps   : 20,
                            interval: 5,
                            from    : 1,
                            to      : 0,
                            type    : "fade",
                            anim    : jpf.tween.EASEIN,
                            onfinish: function() {
                                panel.setProperty("visible", false);
                            }
                        });
                    }

                    var pad = 10, 
                        p   = _self.panels[where.page],
                        el  = p.oExt,
                        iFrom = (where.index < 0)
                            ? -(el.offsetWidth) - pad
                            : window.innerWidth + el.offsetLeft + pad;
                    p.setProperty("visible", true);
                    p.setProperty("zindex",  jpf.all.length + 1);
                    el.style.opacity = 1; // restore opacity
                    jpf.tween.single(el, {
                        steps   : 40,
                        interval: 10,
                        from    : iFrom,
                        to      : 0,
                        type    : "left",
                        anim    : jpf.tween.EASEIN
                    });
                }
            },

            update: function(force) {
                if (this.panels && !force) return;
                this.panels = {};
                for (var i in window) {
                    if (window[i] && window[i]["tagName"]
                      && window[i].tagName == "panel")
                        this.panels[i] = window[i];
                }
            }
        }
    };
    setTimeout(function() {
        jpf.addEventListener("hashchange", jpf.iphone.nav.go);
        if (location.href.match(/#(.*)$/))
    		jpf.history.init(decodeURI(RegExp.$1));
        else if (jpf._GET.page)
            jpf.history.init(jpf._GET.page);
        else
            jpf.history.init();
    });

    // make sure that document event link to mouse events already. Since the
    // document object on top of the event bubble chain, it will probably also
    // be hooked by other JPF elements.
    jpf.iphone.linkEvents(document);
};

// #endif

// #endif
